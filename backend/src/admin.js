import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import { json, Router } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { z } from 'zod';
import { conversation, sendMessage } from './conversations.js';
import { attachmentUpload, listAttachments, saveAttachment, getAttachment, deleteAttachment, resolveAttachmentPath } from './attachments.js';
import { ApiError } from './validation.js';

export const inquiryStatuses = ['New', 'In discussion', 'Quoted', 'Confirmed', 'Closed'];
const querySchema = z.object({
  q: z.string().trim().max(120).default(''),
  status: z.enum(['All', 'Unread', ...inquiryStatuses]).default('All'),
  page: z.coerce.number().int().min(1).max(1000).default(1),
}).strict();
const fields = {
  _id: 0, reference: 1, name: 1, email: 1, phone: 1, city: 1, date: 1, timezone: 1,
  eventType: 1, details: 1, status: 1, createdAt: 1,
  unreadCount: 1, lastMessageAt: 1, lastMessageRole: 1, lastMessageSnippet: 1
};
const listFields = { ...fields };
delete listFields.details;
Object.assign(fields, { revision: 1, followUp: 1, closureReason: 1, history: 1 });
const updateSchema = z.object({
  revision: z.number().int().min(0),
  status: z.enum(inquiryStatuses),
  followUp: z.union([z.iso.date(), z.literal('')]),
  closureReason: z.string().trim().max(1000),
  note: z.string().trim().max(3000),
}).strict().refine(value => value.status !== 'Closed' || value.closureReason.length > 0, { message: 'Add a reason before closing this inquiry.' });

export function adminRouter({ db, auth, config, notify = () => {} }) {
  const router = Router();
  router.get('/config', (req, res) => res.json({ enabled: Boolean(auth), resetEnabled: Boolean(auth && config.SMTP_ENABLED === 'true') }));
  router.use(async (req, res, next) => {
    if (!auth) throw new ApiError(503, 'ADMIN_UNAVAILABLE', 'Admin authentication is not configured.');
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) throw new ApiError(401, 'AUTH_REQUIRED', 'Please sign in.');
    if (session.user.email.toLowerCase() !== config.ADMIN_EMAIL) throw new ApiError(403, 'ADMIN_ONLY', 'Admin access is restricted.');
    req.admin = session.user;
    next();
  });
  router.get('/session', (req, res) => res.json({ user: { name: req.admin.name, email: req.admin.email } }));
  router.get('/inquiries', async (req, res) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) throw new ApiError(400, 'INVALID_FILTER', 'Choose a valid search or filter.');
    const { q, status, page } = parsed.data;
    const filter = {};
    if (status === 'Unread') {
      filter.unreadCount = { $gt: 0 };
    } else if (status !== 'All') {
      filter.status = status;
    }
    if (q) {
      const search = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      filter.$or = ['name', 'email', 'city', 'reference'].map(key => ({ [key]: search }));
    }
    const inquiries = db.collection('inquiries');
    const [items, total, totalUnread] = await Promise.all([
      inquiries.find(filter, { projection: listFields }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 20).limit(20).toArray(),
      inquiries.countDocuments(filter),
      inquiries.countDocuments({ unreadCount: { $gt: 0 } }),
    ]);
    res.json({ items, total, totalUnread, page, pages: Math.max(1, Math.ceil(total / 20)) });
  });
  router.get('/inquiries/:reference', async (req, res) => {
    if (!/^RS-[A-F0-9-]{36}$/.test(req.params.reference)) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
    const inquiries = db.collection('inquiries');
    const inquiry = await inquiries.findOne({ reference: req.params.reference }, { projection: fields });
    if (!inquiry) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
    if ((inquiry.unreadCount || 0) > 0) {
      await inquiries.updateOne({ reference: req.params.reference }, { $set: { unreadCount: 0 } });
      await db.collection('messages').updateMany({ reference: req.params.reference, role: 'customer' }, { $set: { readByAdmin: true } });
      inquiry.unreadCount = 0;
    }
    res.json({ inquiry });
  });
  router.post('/inquiries/:reference', (req, res, next) => {
    if (!config.origins.includes(req.get('Origin'))) throw new ApiError(403, 'ORIGIN_REQUIRED', 'Use the admin website.');
    if (!req.is('application/json')) throw new ApiError(415, 'JSON_REQUIRED', 'Send application/json.');
    next();
  }, json({ limit: '16kb' }), async (req, res) => {
    if (!/^RS-[A-F0-9-]{36}$/.test(req.params.reference)) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(422, 'INVALID_UPDATE', parsed.error.issues[0].message);
    const { revision, status, followUp, note } = parsed.data;
    const closureReason = status === 'Closed' ? parsed.data.closureReason : '';
    const inquiries = db.collection('inquiries');
    const current = await inquiries.findOne({ reference: req.params.reference });
    if (!current) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
    if ((current.revision || 0) !== revision) throw new ApiError(409, 'EDIT_CONFLICT', 'Another session updated this inquiry. Reload the latest details before saving.');
    const changes = {};
    for (const [key, value] of Object.entries({ status, followUp, closureReason })) {
      if ((current[key] || '') !== value) changes[key] = { from: current[key] || '', to: value };
    }
    if (!note && !Object.keys(changes).length) {
      return res.json({ inquiry: await inquiries.findOne({ _id: current._id }, { projection: fields }) });
    }
    // shortcut: history stays atomic in the inquiry; move to a durable event model before 1000 updates per inquiry.
    if ((current.history?.length || 0) >= 1000) throw new ApiError(409, 'HISTORY_FULL', 'History limit reached. Contact the website administrator.');
    const now = new Date();
    const inquiry = await inquiries.findOneAndUpdate({ _id: current._id,
      ...(revision === 0 ? { $or: [{ revision: 0 }, { revision: { $exists: false } }] } : { revision }),
    }, {
      $set: { status, followUp, closureReason, updatedAt: now },
      $inc: { revision: 1 },
      $push: { history: { id: randomUUID(), at: now, actor: req.admin.email, changes, note } },
    }, { returnDocument: 'after', projection: fields });
    if (!inquiry) throw new ApiError(409, 'EDIT_CONFLICT', 'Another session updated this inquiry. Reload the latest details before saving.');
    if (Object.keys(changes).some(key => key === 'status')) notify({ reference: current.reference, email: current.email, kind: 'status' });
    res.json({ inquiry });
  });
  router.get('/inquiries/:reference/messages', async (req, res) => {
    const inquiries = db.collection('inquiries');
    const inquiry = await inquiries.findOne({ reference: req.params.reference });
    if (!inquiry) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
    if ((inquiry.unreadCount || 0) > 0) {
      await inquiries.updateOne({ reference: req.params.reference }, { $set: { unreadCount: 0 } });
      await db.collection('messages').updateMany({ reference: req.params.reference, role: 'customer' }, { $set: { readByAdmin: true } });
    }
    res.json(await conversation(db, inquiry.reference, req.query));
  });
  router.post('/inquiries/:reference/read', async (req, res) => {
    if (!/^RS-[A-F0-9-]{36}$/.test(req.params.reference)) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
    await db.collection('inquiries').updateOne({ reference: req.params.reference }, { $set: { unreadCount: 0 } });
    await db.collection('messages').updateMany({ reference: req.params.reference, role: 'customer' }, { $set: { readByAdmin: true } });
    res.json({ ok: true });
  });
  router.post('/inquiries/:reference/messages', rateLimit({ windowMs: 60000, limit: 20, keyGenerator: req => req.admin.id, standardHeaders: 'draft-8', legacyHeaders: false }), (req, res, next) => {
    if (!config.origins.includes(req.get('Origin'))) throw new ApiError(403, 'ORIGIN_REQUIRED', 'Use the admin website.');
    if (!req.is('application/json')) throw new ApiError(415, 'JSON_REQUIRED', 'Send application/json.');
    next();
  }, json({ limit: '16kb' }), async (req, res) => {
    const inquiry = await db.collection('inquiries').findOne({ reference: req.params.reference });
    if (!inquiry) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
    const result = await sendMessage(db, config, inquiry, 'team', req.admin.email, req.body);
    notify({ reference: inquiry.reference, email: inquiry.email, kind: 'message' });
    res.json(result);
  });
  router.get('/inquiries/:reference/attachments', async (req, res) => {
    const inquiry = await db.collection('inquiries').findOne({ reference: req.params.reference });
    if (!inquiry) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
    res.json({ attachments: await listAttachments(db, inquiry.reference) });
  });
  router.post('/inquiries/:reference/attachments', (req, res, next) => {
    if (!config.origins.includes(req.get('Origin'))) throw new ApiError(403, 'ORIGIN_REQUIRED', 'Use the admin website.');
    next();
  }, attachmentUpload.single('file'), async (req, res) => {
    if (!req.file) throw new ApiError(400, 'FILE_REQUIRED', 'Please select a file to upload.');
    const inquiry = await db.collection('inquiries').findOne({ reference: req.params.reference });
    if (!inquiry) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
    const saved = await saveAttachment(db, {
      reference: inquiry.reference,
      file: req.file,
      role: 'team',
      email: req.admin.email,
      label: req.body.label || 'Document',
    });
    notify({ reference: inquiry.reference, email: inquiry.email, kind: 'attachment' });
    res.json({ attachment: saved });
  });
  router.get('/inquiries/:reference/attachments/:id/download', async (req, res) => {
    const inquiry = await db.collection('inquiries').findOne({ reference: req.params.reference });
    if (!inquiry) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
    const attachment = await getAttachment(db, inquiry.reference, req.params.id);
    if (!attachment) throw new ApiError(404, 'NOT_FOUND', 'Attachment not found.');
    const filePath = resolveAttachmentPath(attachment.fileName);
    if (!existsSync(filePath)) throw new ApiError(404, 'FILE_NOT_FOUND', 'File not found on disk.');
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.originalName)}"`);
    res.sendFile(filePath);
  });
  router.delete('/inquiries/:reference/attachments/:id', async (req, res) => {
    if (!config.origins.includes(req.get('Origin'))) throw new ApiError(403, 'ORIGIN_REQUIRED', 'Use the admin website.');
    const inquiry = await db.collection('inquiries').findOne({ reference: req.params.reference });
    if (!inquiry) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
    const deleted = await deleteAttachment(db, inquiry.reference, req.params.id);
    if (!deleted) throw new ApiError(404, 'NOT_FOUND', 'Attachment not found.');
    notify({ reference: inquiry.reference, email: inquiry.email, kind: 'attachment' });
    res.json({ ok: true });
  });
  return router;
}
