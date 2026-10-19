import { z } from 'zod';
import { ApiError } from './validation.js';
import { tokenHash } from './customerAccess.js';

const schema = z.object({ key: z.uuid(), text: z.string().trim().min(1).max(5000) }).strict();
export async function conversation(db, reference, query) {
  const page = z.coerce.number().int().min(1).max(10000).safeParse(query.page || 1);
  if (!page.success) throw new ApiError(400, 'INVALID_PAGE', 'Choose a valid page.');
  const filter = { reference };
  const [items, total] = await Promise.all([
    db.collection('messages').find(filter, { projection: { _id: 0, key: 1, text: 1, role: 1, createdAt: 1 } }).sort({ createdAt: -1, _id: -1 }).skip((page.data - 1) * 50).limit(50).toArray(),
    db.collection('messages').countDocuments(filter),
  ]);
  return { items: items.reverse(), page: page.data, pages: Math.max(1, Math.ceil(total / 50)) };
}
export async function sendMessage(db, config, inquiry, role, email, body) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ApiError(422, 'INVALID_MESSAGE', 'Enter a message of 1–5000 characters.');
  const { key, text } = parsed.data;
  const _id = tokenHash(`${role}:${email}:${inquiry.reference}:${key}`);
  const document = { _id, key, text, role, reference: inquiry.reference, createdAt: new Date(), outboxPending: true,
    recipients: role === 'team' ? [inquiry.email] : [...new Set(config.teamEmails)],
  };
  try { await db.collection('messages').insertOne(document); }
  catch (error) {
    if (error.code !== 11000) throw error;
    const previous = await db.collection('messages').findOne({ _id });
    if (!previous || previous.text !== text) throw new ApiError(409, 'MESSAGE_CONFLICT', 'This retry has different text. Refresh before sending.');
  }
  return { saved: true };
}
