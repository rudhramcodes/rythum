import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { inquirySchema, idempotencySchema, ApiError } from './validation.js';
import { saveInquiry } from './inquiries.js';

export function createApp({ db, config }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.TRUST_PROXY || false);
  app.use(helmet());
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.set({ 'X-Request-ID': req.requestId, 'Cache-Control': 'no-store' });
    next();
  });
  app.use((req, res, next) => {
    const origin = req.get('Origin');
    if (origin && !config.origins.includes(origin)) return next(new ApiError(403, 'ORIGIN_DENIED', 'This website is not allowed to submit requests.'));
    next();
  });
  app.use(cors({ origin: config.origins, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Idempotency-Key'], maxAge: 600 }));
  app.get('/api/health', async (req, res) => {
    await db.command({ ping: 1 });
    res.json({ status: 'ok' });
  });
  // shortcut: per-IP buckets are process-local; use a shared store before adding API replicas.
  const submissionLimit = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts. Please try again in 15 minutes.' } },
  });
  app.post('/api/inquiries', submissionLimit, (req, res, next) => {
    if (!req.get('Origin') || !config.origins.includes(req.get('Origin'))) return next(new ApiError(403, 'ORIGIN_REQUIRED', 'Submit this form from the website.'));
    if (!req.is('application/json')) return next(new ApiError(415, 'JSON_REQUIRED', 'Send application/json.'));
    next();
  }, express.json({ limit: '32kb' }), async (req, res) => {
    const key = idempotencySchema.safeParse(req.get('Idempotency-Key'));
    if (!key.success) throw new ApiError(400, 'INVALID_SUBMISSION_KEY', 'A valid submission key is required.');
    const parsed = inquirySchema().safeParse(req.body);
    if (!parsed.success) {
      const fields = Object.fromEntries(parsed.error.issues.map(issue => [issue.path[0] || 'form', issue.message]));
      const firstMessage = parsed.error.issues[0]?.message;
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: firstMessage || 'Please check the highlighted fields.', fields } });
    }
    const result = await saveInquiry({ db, config }, parsed.data, key.data);
    res.status(result.replayed ? 200 : 201).json({ inquiry: result });
  });
  app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } }));
  app.use((error, req, res, _next) => {
    if (error instanceof ApiError) {
      if (error.status === 429) res.set('Retry-After', '3600');
      const payload = { code: error.code, message: error.message };
      if (error.fields) payload.fields = error.fields;
      if (error.reference) payload.reference = error.reference;
      return res.status(error.status).json({ error: payload });
    }
    if (error.type === 'entity.too.large') return res.status(413).json({ error: { code: 'BODY_TOO_LARGE', message: 'The inquiry is too large.' } });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Invalid request body.' } });
    // Do not log bodies, email addresses, connection strings or SMTP errors.
    console.error(JSON.stringify({ event: 'request_failed', requestId: req.requestId, type: error.name }));
    res.status(503).json({ error: { code: 'TEMPORARILY_UNAVAILABLE', message: 'We could not confirm your submission. Please retry with the same details.', requestId: req.requestId } });
  });
  return app;
}
