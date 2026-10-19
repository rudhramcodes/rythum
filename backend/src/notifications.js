import { randomUUID } from 'node:crypto';
import { customerLink } from './customerAccess.js';
import nodemailer from 'nodemailer';
import { renderCustomerEmail, renderTeamEmail } from './emailTemplate.js';

export async function queueNotifications(db) {
  const inquiries = db.collection('inquiries');
  const jobs = db.collection('notificationJobs');
  const pending = inquiries.find({ outboxPending: true }).sort({ createdAt: 1 }).limit(25);
  for await (const inquiry of pending) {
    for (const recipient of inquiry.notificationRecipients) {
      const dedupeKey = `${inquiry.reference}:${recipient.to}`;
      try {
        await jobs.updateOne({ dedupeKey }, { $setOnInsert: {
          ...recipient, inquiryId: inquiry._id, reference: inquiry.reference,
          inquiryDetails: {
            reference: inquiry.reference,
            name: inquiry.name,
            email: inquiry.email,
            phone: inquiry.phone,
            eventType: inquiry.eventType,
            city: inquiry.city,
            date: inquiry.date,
            details: inquiry.details,
          },
          dedupeKey, status: 'pending', attempts: 0, nextAttemptAt: inquiry.createdAt, createdAt: inquiry.createdAt,
        } }, { upsert: true });
      } catch (error) {
        if (error.code !== 11000) throw error;
        // Another worker may have created this exact job concurrently.
        if (!await jobs.findOne({ dedupeKey })) throw error;
      }
    }
    // A crash before this update is safe: retrying never resets an existing job.
    await inquiries.updateOne({ _id: inquiry._id }, { $set: { outboxPending: false } });
  }
  for await (const message of db.collection('messages').find({ outboxPending: true }).limit(25)) {
    for (const to of message.recipients) {
      const dedupeKey = `message:${message._id}:${to}`;
      try {
        await jobs.updateOne({ dedupeKey }, { $setOnInsert: { dedupeKey, to, kind: message.role === 'team' ? 'customer-message' : 'team-message', reference: message.reference, status: 'pending', attempts: 0, nextAttemptAt: message.createdAt, createdAt: message.createdAt } }, { upsert: true });
      } catch (error) { if (error.code !== 11000) throw error; }
    }
    await db.collection('messages').updateOne({ _id: message._id }, { $set: { outboxPending: false } });
  }

}

export function createMailTransport(config) {
  return nodemailer.createTransport({
    host: config.SMTP_HOST, port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465, requireTLS: true,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000,
    disableFileAccess: true, disableUrlAccess: true,
  });
}

export function failureStatus(error, attempts) {
  if (error.responseCode >= 500) return 'failed';
  // A definite temporary rejection or a pre-message connection failure can be retried.
  const safeToRetry = (error.responseCode >= 400 && error.responseCode < 500) ||
    ['CONN', 'EHLO', 'HELO', 'STARTTLS', 'AUTH', 'MAIL FROM', 'RCPT TO'].includes(error.command);
  if (safeToRetry) return attempts >= 5 ? 'failed' : 'pending';
  // A timeout after DATA may already have delivered. Never silently send it twice.
  return 'uncertain';
}

export async function deliverNextJob(db, transport, config, now = new Date()) {
  const jobs = db.collection('notificationJobs');
  await jobs.updateMany({ status: 'sending', leaseUntil: { $lte: now } }, {
    $set: { status: 'uncertain', errorCode: 'WORKER_INTERRUPTED', updatedAt: now },
  });
  const lockId = randomUUID();
  const job = await jobs.findOneAndUpdate({ status: 'pending', nextAttemptAt: { $lte: now } }, {
    $set: { status: 'sending', lockId, leaseUntil: new Date(now.getTime() + 120000), updatedAt: now },
    $inc: { attempts: 1 },
  }, { sort: { nextAttemptAt: 1 }, returnDocument: 'after' });
  if (!job) return false;
  const customer = ['acknowledgement', 'customer-access', 'customer-message'].includes(job.kind);
  const inquiryData = job.inquiryDetails ? { ...job.inquiryDetails, reference: job.reference } : (job.inquiryId ? await db.collection('inquiries').findOne({ _id: job.inquiryId }) : null) || { reference: job.reference };
  let outcome;
  try {
    if (job.kind === 'customer-access' && !await db.collection('inquiries').findOne({ email: job.to }, { projection: { _id: 1 } })) {
      await jobs.updateOne({ _id: job._id, lockId }, { $set: { status: 'skipped', updatedAt: now }, $unset: { lockId: '', leaseUntil: '' } });
      return true;
    }
    let template;
    if (job.kind === 'customer-access') {
      const url = await customerLink(db, config, job.to);
      template = { subject: 'Your inquiry sign-in link', text: `Sign in to your Rythum Shastri inquiry portal:\n\n${url}\n\nThis link expires in 15 minutes and works once. If you did not request it, ignore this email.` };
    } else if (job.kind.endsWith('-message')) {
      const url = new URL(customer ? '/portal' : '/admin', config.origins[0]).href;
      template = { subject: 'New inquiry message', text: `There is a new message for inquiry ${job.reference}. Read and reply securely on the website:\n${url}\n\nPlease do not reply to this email.` };
    } else {
      const url = customer ? await customerLink(db, config, job.to) : new URL('/admin', config.origins[0]).href;
      template = customer ? renderCustomerEmail(inquiryData, url) : renderTeamEmail(inquiryData, url);
      template.text += `\n\n${customer ? 'View your inquiry (sign-in link expires in 15 minutes)' : 'Open admin inbox'}: ${url}\nReply through the website, not by email.`;
    }
    const result = await transport.sendMail({
      from: { name: 'Rythum Shastri', address: config.MAIL_FROM },
      replyTo: config.MAIL_REPLY_TO,
      to: job.to,
      messageId: `<${job._id}@${config.MAIL_FROM.split('@')[1]}>`,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
    outcome = result.accepted?.length
      ? { status: 'sent', acceptedAt: now }
      : { status: 'failed', errorCode: 'RECIPIENT_NOT_ACCEPTED' };
  } catch (error) {
    outcome = {
      status: failureStatus(error, job.attempts),
      errorCode: typeof error.code === 'string' && /^[A-Z_]{1,40}$/.test(error.code) ? error.code : 'SMTP_ERROR',
      nextAttemptAt: new Date(now.getTime() + Math.min(3600000, 60000 * 2 ** (job.attempts - 1))),
    };
  }
  // Keep database-write failures outside the send catch: acceptance may already have happened.
  await jobs.updateOne({ _id: job._id, lockId, status: 'sending' }, {
    $set: { ...outcome, updatedAt: new Date() }, $unset: { lockId: '', leaseUntil: '' },
  });
  return true;
}
