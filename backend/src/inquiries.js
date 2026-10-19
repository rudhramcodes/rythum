import { createHash, randomUUID } from 'node:crypto';
import { ApiError } from './validation.js';

const hash = value => createHash('sha256').update(value).digest('hex');
const receipt = inquiry => ({ reference: inquiry.reference, status: inquiry.status, createdAt: inquiry.createdAt });

export async function saveInquiry({ db, config }, input, key, now = new Date()) {
  const { website: _honeypot, ...details } = input;
  const requestHash = hash(JSON.stringify(details));
  const idempotencyKey = hash(key);
  const inquiries = db.collection('inquiries');
  const existing = await inquiries.findOne({ idempotencyKey });
  const replay = document => {
    if (document.requestHash !== requestHash) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'This submission key was already used. Please start a new submission.');
    return { ...receipt(document), replayed: true };
  };
  if (existing) return replay(existing);

  // Check for duplicate active inquiry with the same email
  const normalizedEmail = details.email.toLowerCase();
  const activeExisting = await inquiries.findOne({
    email: normalizedEmail,
    status: { $in: ['New', 'Under Review', 'In discussion', 'Quoted'] },
  });
  if (activeExisting) {
    throw new ApiError(
      409,
      'DUPLICATE_INQUIRY',
      'An inquiry is already awaiting review. Please use your original confirmation for follow-up.',
      { email: 'An inquiry with this email address is already awaiting review.' }
    );
  }

  // Reserve at most three distinct attempts per email/hour; retries reuse their slot.
  const hour = Math.floor(now.getTime() / 3600000);
  const bucket = `${hash(details.email)}:${hour}`;
  const limits = db.collection('submissionLimits');
  try {
    await limits.updateOne({ _id: bucket }, { $setOnInsert: { keys: [], expiresAt: new Date((hour + 2) * 3600000) } }, { upsert: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
  const reserved = await limits.findOneAndUpdate(
    { _id: bucket, $or: [{ keys: idempotencyKey }, { 'keys.2': { $exists: false } }] },
    { $addToSet: { keys: idempotencyKey } }, { returnDocument: 'after' },
  );
  if (!reserved) throw new ApiError(429, 'TOO_MANY_REQUESTS', 'Please wait before submitting another inquiry.');

  const reference = `RS-${randomUUID().toUpperCase()}`;
  const recipients = [...new Set([details.email, ...config.teamEmails.map(email => email.toLowerCase())])];
  // One atomic document holds both the inquiry and durable notification intent.
  const inquiry = {
    ...details, reference, idempotencyKey, requestHash, status: 'New', source: 'website', createdAt: now, updatedAt: now,
    unreadCount: 1,
    notificationRecipients: recipients.map((to, index) => ({ to, kind: index === 0 ? 'acknowledgement' : 'team-notification' })),
    outboxPending: true,
  };
  try {
    await inquiries.insertOne(inquiry);
    return { ...receipt(inquiry), replayed: false };
  } catch (error) {
    // A concurrent retry may win the unique-index race.
    if (error.code === 11000) {
      const winner = await inquiries.findOne({ idempotencyKey });
      if (winner) return replay(winner);
    }
    throw error;
  }
}
