import { Router, json } from 'express';
import { z } from 'zod';
import { ApiError, eventTypes } from './validation.js';
import { tokenHash } from './customerAccess.js';

const fields = ['eventType', 'city', 'date', 'details'];
const eventSchema = z.object({ eventType: z.enum(eventTypes), city: z.string().trim().min(1).max(160), date: z.union([z.iso.date(), z.literal('')]), details: z.string().trim().min(1).max(5000) }).strict();
const commandSchema = z.object({ key: z.uuid(), revision: z.number().int().min(0), action: z.enum(['edit', 'request', 'approve', 'reject']), reason: z.string().trim().min(1).max(1000), event: eventSchema.optional(), requestId: z.uuid().optional() }).strict();
const snapshot = inquiry => Object.fromEntries(fields.map(key => [key, inquiry[key] || '']));
const publicChange = entry => ({ id: entry.id, at: entry.at, ...entry.eventChange });

export function eventRouter({ db, config, audience, notify }) {
  const router = Router({ mergeParams: true });
  router.use(async (req, res, next) => {
    if (!/^RS-[A-F0-9-]{36}$/.test(req.params.reference)) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
    const inquiry = await db.collection('inquiries').findOne({ reference: req.params.reference, ...(audience === 'customer' ? { email: req.customer.email } : {}) });
    if (!inquiry) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
    req.eventInquiry = inquiry;
    next();
  });
  router.get('/', (req, res) => {
    const parsed = z.object({ before: z.coerce.number().int().min(0).max(1000).optional() }).strict().safeParse(req.query);
    if (!parsed.success) throw new ApiError(400, 'INVALID_PAGE', 'Choose a valid page.');
    const inquiry = req.eventInquiry;
    // shortcut: event audit shares the bounded atomic inquiry history; migrate before 1000 updates.
    const entries = (inquiry.history || []).filter(entry => entry.eventChange);
    const end = Math.min(parsed.data.before ?? entries.length, entries.length);
    const start = Math.max(0, end - 10);
    res.json({ event: snapshot(inquiry), revision: inquiry.eventRevision || 0, pending: inquiry.pendingEventChange || null, items: entries.slice(start, end).reverse().map(publicChange), next: start || null });
  });
  router.post('/', (req, res, next) => {
    if (!config.origins.includes(req.get('Origin'))) throw new ApiError(403, 'ORIGIN_REQUIRED', 'Use the website.');
    if (!req.is('application/json')) throw new ApiError(415, 'JSON_REQUIRED', 'Send application/json.');
    next();
  }, json({ limit: '16kb' }), async (req, res) => {
    const parsed = commandSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(422, 'INVALID_CHANGE', 'Check the event details and add a reason (up to 1,000 characters).');
    const body = parsed.data;
    const { action, reason, key } = body;
    if ((audience === 'customer' && action !== 'request') || (audience === 'admin' && action === 'request')) throw new ApiError(403, 'FORBIDDEN', 'This action is not available.');
    const current = req.eventInquiry;
    const actor = audience === 'admin' ? req.admin.email : req.customer.email;
    const hash = tokenHash(JSON.stringify({ ...body, actor, audience }));
    const previous = current.history?.find(entry => entry.id === key);
    if (previous) {
      if (previous.operationHash !== hash) throw new ApiError(409, 'RETRY_CONFLICT', 'This retry has different details. Refresh before trying again.');
      return res.json({ saved: true });
    }
    if (current.status === 'Closed') throw new ApiError(409, 'INQUIRY_CLOSED', 'This inquiry is closed. Contact the team to discuss reopening it.');
    if ((current.history?.length || 0) >= 1000) throw new ApiError(409, 'HISTORY_FULL', 'History limit reached. Contact the administrator.');
    if (body.revision !== (current.eventRevision || 0)) throw new ApiError(409, 'EDIT_CONFLICT', 'Event details changed. Reload and review before saving.');
    const pending = current.pendingEventChange;
    const before = snapshot(current);
    let after = before;
    if (['edit', 'request'].includes(action)) {
      if (pending) throw new ApiError(409, 'REQUEST_PENDING', 'Review the existing request before making another change.');
      if (!body.event) throw new ApiError(422, 'EVENT_REQUIRED', 'Provide the proposed event details.');
      after = body.event;
    } else {
      if (!pending || pending.id !== body.requestId) throw new ApiError(409, 'REQUEST_RESOLVED', 'This request has already been reviewed. Reload the event details.');
      if (action === 'approve') after = pending.event;
    }
    if (after.date && after.date !== before.date) {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: current.timezone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      if (after.date < today) throw new ApiError(422, 'PAST_DATE', 'Choose today or a future date.');
    }
    if (['edit', 'request'].includes(action) && fields.every(field => after[field] === before[field])) throw new ApiError(422, 'NO_CHANGES', 'Change at least one event detail.');
    const now = new Date();
    const eventChange = { action, reason, before, after: action === 'reject' ? pending.event : after, requestId: pending?.id || (action === 'request' ? key : null), role: audience, ...(pending ? { requestReason: pending.reason } : {}) };
    const entry = { id: key, at: now, actor, changes: {}, note: '', operationHash: hash, eventChange, eventOutbox: true, recipients: audience === 'customer' ? [...new Set(config.teamEmails)] : [current.email] };
    const set = { updatedAt: now, pendingEventChange: action === 'request' ? { id: key, event: after, before, reason, at: now } : null };
    if (action === 'edit' || action === 'approve') Object.assign(set, after);
    const result = await db.collection('inquiries').updateOne({ _id: current._id, ...(current.revision ? { revision: current.revision } : { $or: [{ revision: 0 }, { revision: { $exists: false } }] }) }, {
      $set: set, $inc: { revision: 1, eventRevision: 1 }, $push: { history: entry },
    });
    if (!result.modifiedCount) throw new ApiError(409, 'EDIT_CONFLICT', 'Another update was saved first. Reload and review before saving.');
    notify({ reference: current.reference, email: current.email, kind: 'details' });
    res.json({ saved: true });
  });
  return router;
}
