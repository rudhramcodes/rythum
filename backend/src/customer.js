import { existsSync } from 'node:fs';
import { json, Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { ApiError } from './validation.js';
import { tokenHash, customerSession } from './customerAccess.js';
import { conversation, sendMessage } from './conversations.js';
import { attachmentUpload, listAttachments, saveAttachment, getAttachment, resolveAttachmentPath } from './attachments.js';

const publicFields = { _id: 0, reference: 1, name: 1, eventType: 1, city: 1, date: 1, details: 1, status: 1, createdAt: 1 };
export function customerRouter({ db, config, notify = () => {} }) {
  const router = Router();
  const cookieName = config.NODE_ENV === 'production' ? '__Secure-customer-session' : 'customer-session';
  const cookieOptions = { httpOnly: true, secure: config.NODE_ENV === 'production', sameSite: 'lax', path: '/api/customer' };
  router.use((req, res, next) => {
    if (req.method === 'POST') {
      if (!config.origins.includes(req.get('Origin'))) throw new ApiError(403, 'ORIGIN_REQUIRED', 'Use the website to continue.');
      if (!req.is('multipart/form-data') && !req.is('application/json')) {
        throw new ApiError(415, 'JSON_REQUIRED', 'Send application/json.');
      }
    }
    next();
  });
  router.use((req, res, next) => {
    if (req.is('multipart/form-data')) return next();
    return json({ limit: '16kb' })(req, res, next);
  });
  const accessLimit = rateLimit({ windowMs: 15 * 60000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
  router.post('/request-link', accessLimit, async (req, res) => {
    if (config.SMTP_ENABLED !== 'true') throw new ApiError(503, 'MAIL_UNAVAILABLE', 'Email sign-in is unavailable. Please try again shortly.');
    const parsed = z.object({ email: z.email().max(254).transform(value => value.toLowerCase()) }).strict().safeParse(req.body);
    if (!parsed.success) throw new ApiError(422, 'INVALID_EMAIL', 'Enter a valid email address.');
    const { email } = parsed.data;
    const now = new Date();
    const bucket = tokenHash(`${email}:${Math.floor(now.getTime() / 3600000)}`);
    try { await db.collection('customerLinkLimits').updateOne({ _id: bucket }, { $setOnInsert: { count: 0, expiresAt: new Date(now.getTime() + 7200000) } }, { upsert: true }); }
    catch (error) { if (error.code !== 11000) throw error; }
    const limit = await db.collection('customerLinkLimits').findOneAndUpdate({ _id: bucket }, { $inc: { count: 1 } }, { returnDocument: 'after' });
    if (limit.count <= 3) {
      // Queue for every valid address; the worker privately checks whether an inquiry exists.
      await db.collection('notificationJobs').insertOne({ dedupeKey: `access:${bucket}:${limit.count}`, kind: 'customer-access', to: email, status: 'pending', attempts: 0, nextAttemptAt: now, createdAt: now });
    }
    res.json({ message: 'If this email has an inquiry, a sign-in link will arrive shortly. Check your spam folder too.' });
  });
  router.post('/verify', accessLimit, async (req, res) => {
    const parsed = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).strict().safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, 'INVALID_LINK', 'This sign-in link is invalid or expired. Request a new link.');
    const access = await db.collection('customerTokens').findOneAndDelete({ _id: tokenHash(parsed.data.token), expiresAt: { $gt: new Date() } });
    if (!access) throw new ApiError(400, 'INVALID_LINK', 'This sign-in link is invalid or expired. Request a new link.');
    const token = randomBytes(32).toString('hex');
    await db.collection('customerSessions').insertOne({ _id: tokenHash(token), email: access.email, expiresAt: new Date(Date.now() + 86400000) });
    res.cookie(cookieName, token, { ...cookieOptions, maxAge: 86400000 });
    res.json({ email: access.email });
  });
  router.use(async (req, res, next) => {
    const session = await customerSession(db, config, req.headers);
    if (!session) throw new ApiError(401, 'AUTH_REQUIRED', 'Your session expired. Request a new sign-in link.');
    req.customer = session;
    next();
  });
  router.get('/session', (req, res) => res.json({ email: req.customer.email }));
  router.post('/logout', async (req, res) => {
    await db.collection('customerSessions').deleteOne({ _id: req.customer._id });
    res.clearCookie(cookieName, cookieOptions).json({ signedOut: true });
  });
  router.get('/inquiries', async (req, res) => {
    const page = z.coerce.number().int().min(1).max(10000).safeParse(req.query.page || 1);
    if (!page.success) throw new ApiError(400, 'INVALID_PAGE', 'Choose a valid page.');
    const filter = { email: req.customer.email };
    const inquiries = db.collection('inquiries');
    const total = await inquiries.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / 20));
    const currentPage = Math.min(page.data, pages);
    const items = await inquiries.find(filter, { projection: publicFields }).sort({ createdAt: -1, _id: -1 }).skip((currentPage - 1) * 20).limit(20).toArray();
    res.json({ items, page: currentPage, pages });
  });
  router.use('/inquiries/:reference', async (req, res, next) => {
    if (!/^RS-[A-F0-9-]{36}$/.test(req.params.reference)) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
    const inquiry = await db.collection('inquiries').findOne({ reference: req.params.reference, email: req.customer.email });
    if (!inquiry) throw new ApiError(404, 'NOT_FOUND', 'Inquiry not found.');
    req.inquiry = inquiry;
    next();
  });
  router.get('/inquiries/:reference/messages', async (req, res) => res.json(await conversation(db, req.inquiry.reference, req.query)));
  router.post('/inquiries/:reference/messages', rateLimit({ windowMs: 60000, limit: 10, keyGenerator: req => req.customer._id, standardHeaders: 'draft-8', legacyHeaders: false }), async (req, res) => {
    const result = await sendMessage(db, config, req.inquiry, 'customer', req.customer.email, req.body);
    notify({ reference: req.inquiry.reference, email: req.customer.email, kind: 'message' });
    res.json(result);
  });
  router.get('/inquiries/:reference/attachments', async (req, res) => {
    res.json({ attachments: await listAttachments(db, req.inquiry.reference) });
  });
  router.post('/inquiries/:reference/attachments', rateLimit({ windowMs: 60000, limit: 10, keyGenerator: req => req.customer._id, standardHeaders: 'draft-8', legacyHeaders: false }), attachmentUpload.single('file'), async (req, res) => {
    if (!req.file) throw new ApiError(400, 'FILE_REQUIRED', 'Please select a file to upload.');
    const saved = await saveAttachment(db, {
      reference: req.inquiry.reference,
      file: req.file,
      role: 'customer',
      email: req.customer.email,
      label: req.body.label || 'Customer document',
    });
    notify({ reference: req.inquiry.reference, email: req.customer.email, kind: 'attachment' });
    res.json({ attachment: saved });
  });
  router.get('/inquiries/:reference/attachments/:id/download', async (req, res) => {
    const attachment = await getAttachment(db, req.inquiry.reference, req.params.id);
    if (!attachment) throw new ApiError(404, 'NOT_FOUND', 'Attachment not found.');
    const filePath = resolveAttachmentPath(attachment.fileName);
    if (!existsSync(filePath)) throw new ApiError(404, 'FILE_NOT_FOUND', 'File not found on disk.');
    res.setHeader('Content-Type', attachment.mimeType);
    const disposition = req.query.inline === '1' ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(attachment.originalName)}"`);
    res.sendFile(filePath);
  });
  return router;
}
