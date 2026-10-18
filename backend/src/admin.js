import { Router } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { z } from 'zod';
import { ApiError } from './validation.js';

export const inquiryStatuses = ['New', 'In discussion', 'Quoted', 'Confirmed', 'Closed'];
const querySchema = z.object({
  q: z.string().trim().max(120).default(''),
  status: z.enum(['All', ...inquiryStatuses]).default('All'),
  page: z.coerce.number().int().min(1).max(1000).default(1),
}).strict();
const fields = { _id: 0, reference: 1, name: 1, email: 1, phone: 1, city: 1, date: 1, timezone: 1, eventType: 1, details: 1, status: 1, createdAt: 1 };
const { details: _details, ...listFields } = fields;

export function adminRouter({ db, auth, config }) {
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
  return router;
}
