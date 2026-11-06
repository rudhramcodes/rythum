import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { readConfig } from '../src/config.js';
import { connectDatabase } from '../src/db.js';
import { createAdminAuth } from '../src/auth.js';
import { createApp } from '../src/app.js';

let mongo, client, db, config, app;
const origin = 'http://localhost:5173';
const password = `Test-only-${randomBytes(16).toString('hex')}`;
before(async () => {
  mongo = await MongoMemoryServer.create({ binary: { downloadDir: '/tmp/rythum-mongodb-binaries' } });
  config = readConfig({ NODE_ENV: 'test', MONGODB_URI: mongo.getUri(), MONGODB_DB: 'shows_test', WEB_ORIGINS: origin, AUTH_SECRET: randomBytes(32).toString('hex'), ADMIN_EMAIL: 'owner@example.com' });
  ({ client, db } = await connectDatabase(config));
  const auth = createAdminAuth(db, config, { bootstrap: true });
  await auth.api.signUpEmail({ body: { email: config.ADMIN_EMAIL, password, name: 'Test owner' } });
}, { timeout: 180000 });
beforeEach(async () => {
  await db.collection('session').deleteMany({});
  await db.collection('rateLimit').deleteMany({});
  await db.collection('inquiries').deleteMany({});
  app = createApp({ db, config });
});
after(async () => { await client?.close(); await mongo?.stop(); });
const login = agent => agent.post('/api/auth/sign-in/email').set('Origin', origin).send({ email: config.ADMIN_EMAIL, password });

test('shows are public to read, protected to edit, validated and persist without reseeding deleted shows', async () => {
  const initial = await request(app).get('/api/shows');
  assert.equal(initial.status, 200);
  assert.equal(initial.body.items.length, 5);
  assert.equal((await request(app).post('/api/admin/shows').set('Origin', origin).send({})).status, 401);
  const agent = request.agent(app);
  assert.equal((await login(agent)).status, 200);
  const show = { start: '2027-01-02', end: '2027-01-03', city: 'Mumbai', event: 'Live concert', venue: 'Main hall', url: 'https://example.com/tickets' };
  assert.equal((await agent.post('/api/admin/shows').send(show)).status, 403);
  for (const invalid of [{ end: '2026-01-01' }, { start: '2027-02-30' }, { city: ' ' }, { url: 'javascript:alert(1)' }]) {
    assert.equal((await agent.post('/api/admin/shows').set('Origin', origin).send({ ...show, ...invalid })).status, 422);
  }
  const created = await agent.post('/api/admin/shows').set('Origin', origin).send(show);
  assert.equal(created.status, 201);
  const id = created.body.show.id;
  assert.equal((await agent.put(`/api/admin/shows/${id}`).set('Origin', origin).send({ ...show, city: 'Pune' })).status, 200);
  assert.equal((await request(app).get('/api/shows')).body.items.find(item => item.id === id).city, 'Pune');
  assert.equal((await agent.delete(`/api/admin/shows/${id}`).set('Origin', origin)).status, 200);
  assert.equal((await agent.put(`/api/admin/shows/${id}`).set('Origin', origin).send(show)).status, 404);
  for (const item of initial.body.items) assert.equal((await agent.delete(`/api/admin/shows/${item.id}`).set('Origin', origin)).status, 200);
  const { prepareShows } = await import('../src/shows.js');
  await prepareShows(db);
  assert.deepEqual((await request(app).get('/api/shows')).body.items, []);
});
