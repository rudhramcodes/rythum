import { randomUUID } from 'node:crypto';
import { Router, json } from 'express';
import { z } from 'zod';
import { ApiError } from './validation.js';

const initialShows = [
  { start: '2026-10-02', end: '2026-10-03', date: '02–03 Oct', city: 'Longview, TX', event: 'Fall Headline Festival', venue: 'Maude Cobb Convention Center' },
  { start: '2026-10-09', end: '2026-10-19', date: '09–19 Oct', city: 'Houston, TX', event: 'Navratri Residency', venue: 'VPSS Cultural Center Hall' },
  { start: '2026-10-22', end: '2026-10-23', date: '22–23 Oct', city: 'El Paso, TX', event: 'Southwest Navratri Celebration', venue: 'El Paso Coliseum Pavilion' },
  { start: '2026-11-07', end: '2026-11-07', date: '07 Nov', city: 'Nashville, TN', event: 'Music City Heritage Concert', venue: 'Grand Cultural Auditorium' },
  { start: '2026-11-14', end: '2026-11-14', date: '14 Nov', city: 'Longview, TX', event: 'Season Finale & Devotional Gala', venue: 'Belcher Center Stage' },
];

export async function prepareShows(db) {
  await db.collection('siteContent').updateOne({ _id: 'shows' }, { $setOnInsert: {
    items: initialShows.map(({ date: _date, ...show }, index) => ({ ...show, id: `initial-${index}`, url: '' })),
  } }, { upsert: true });
}
export async function listShows(db) {
  const document = await db.collection('siteContent').findOne({ _id: 'shows' });
  return (document?.items || []).sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
}
const schema = z.object({
  start: z.iso.date(), end: z.iso.date(),
  city: z.string().trim().min(1).max(160),
  event: z.string().trim().min(1).max(200),
  venue: z.string().trim().min(1).max(200),
  url: z.union([z.literal(''), z.url({ protocol: /^https?$/ })]).default(''),
}).strict().refine(show => show.end >= show.start, { message: 'End date must be on or after the start date.' });

export function showsRouter({ db, config }) {
  const router = Router();
  router.get('/', async (req, res) => res.json({ items: await listShows(db) }));
  router.use((req, res, next) => {
    if (!config.origins.includes(req.get('Origin'))) throw new ApiError(403, 'ORIGIN_REQUIRED', 'Use the admin website.');
    next();
  }, json({ limit: '8kb' }));
  const parse = body => {
    const result = schema.safeParse(body);
    if (!result.success) throw new ApiError(422, 'INVALID_SHOW', result.error.issues[0].message);
    return result.data;
  };
  router.post('/', async (req, res) => {
    const show = { ...parse(req.body), id: randomUUID() };
    await db.collection('siteContent').updateOne({ _id: 'shows' }, { $push: { items: show } });
    res.status(201).json({ show });
  });
  router.put('/:id', async (req, res) => {
    const show = { ...parse(req.body), id: req.params.id };
    const result = await db.collection('siteContent').updateOne({ _id: 'shows', 'items.id': req.params.id }, { $set: { 'items.$': show } });
    if (!result.matchedCount) throw new ApiError(404, 'SHOW_NOT_FOUND', 'This show no longer exists.');
    res.json({ show });
  });
  router.delete('/:id', async (req, res) => {
    const result = await db.collection('siteContent').updateOne({ _id: 'shows', 'items.id': req.params.id }, { $pull: { items: { id: req.params.id } } });
    if (!result.matchedCount) throw new ApiError(404, 'SHOW_NOT_FOUND', 'This show no longer exists.');
    res.json({ ok: true });
  });
  return router;
}
