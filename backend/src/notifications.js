import { randomUUID } from 'node:crypto';
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
  const customer = job.kind === 'acknowledgement';
  const inquiryData = job.inquiryDetails || (await db.collection('inquiries').findOne({ _id: job.inquiryId })) || { reference: job.reference };
  const template = customer ? renderCustomerEmail(inquiryData) : renderTeamEmail(inquiryData);
  let outcome;
  try {
    const result = await transport.sendMail({
      from: { name: 'Rythum Shastri', address: config.MAIL_FROM },
      replyTo: customer ? config.MAIL_REPLY_TO : (inquiryData.email || config.MAIL_REPLY_TO),
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
