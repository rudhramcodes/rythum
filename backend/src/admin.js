import { randomUUID } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import { json, Router } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { z } from 'zod';
import { conversation, sendMessage } from './conversations.js';
import { ApiError } from './validation.js';

export const inquiryStatuses = ['New', 'In discussion', 'Quoted', 'Confirmed', 'Closed'];
const querySchema = z.object({
  q: z.string().trim().max(120).default(''),
  status: z.enum(['All', ...inquiryStatuses]).default('All'),
  page: z.coerce.number().int().min(1).max(1000).default(1),
}).strict();
const fields = { _id: 0, reference: 1, name: 1, email: 1, phone: 1, city: 1, date: 1, timezone: 1, eventType: 1, details: 1, status: 1, createdAt: 1 };
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
    if (status !== 'All') filter.status = status;
    if (q) {
      const search = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      filter.$or = ['name', 'email', 'city', 'reference'].map(key => ({ [key]: search }));
    }
    const inquiries = db.collection('inquiries');
    const [items, total] = await Promise.all([
      inquiries.find(filter, { projection: listFields }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 20).limit(20).toArray(),
      inquiries.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / 20)) });
  });
  router.get('/inquiries/:reference', async (req, res) => {
    if (!/^RS-[A-F0-9-]{36}$/.test(req.params.reference)) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
    const inquiry = await db.collection('inquiries').findOne({ reference: req.params.reference }, { projection: fields });
    if (!inquiry) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
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
    const inquiry = await db.collection('inquiries').findOne({ reference: req.params.reference });
    if (!inquiry) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
    res.json(await conversation(db, inquiry.reference, req.query));
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
  return router;
}
