import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
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
  config = readConfig({ NODE_ENV: 'test', MONGODB_URI: mongo.getUri(), MONGODB_DB: 'admin_test', WEB_ORIGINS: origin, AUTH_SECRET: randomBytes(32).toString('hex'), ADMIN_EMAIL: 'owner@example.com' });
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

test('private endpoints deny anonymous users; public signup and cross-origin login are blocked', async () => {
  assert.equal((await request(app).get('/api/admin/inquiries')).status, 401);
  assert.equal((await request(app).get(`/api/admin/inquiries/RS-${randomUUID().toUpperCase()}`)).status, 401);
  assert.equal((await request(app).post('/api/auth/sign-up/email').set('Origin', origin).send({ email: config.ADMIN_EMAIL, password, name: 'Someone' })).status, 404);
  assert.equal((await request(app).post('/api/auth/sign-in/email').set('Origin', 'https://wrong.example').send({ email: config.ADMIN_EMAIL, password })).status, 403);
  assert.equal((await request(app).post('/api/auth/sign-in/email').send({ email: config.ADMIN_EMAIL, password })).status, 403);
  assert.equal((await request(app).post('/api/auth/sign-in/email').set('Origin', origin).send({ email: config.ADMIN_EMAIL, password: 'wrong-password' })).status, 401);
  const account = await db.collection('account').findOne({ providerId: 'credential' });
  assert.ok(account.password && account.password !== password);
});

test('approved admin can search and read inquiries, without internal hashes or notification data', async () => {
  const reference = `RS-${randomUUID().toUpperCase()}`;
  await db.collection('inquiries').insertOne({ reference, name: 'Test organizer', email: 'organizer@example.com', city: 'Mumbai', details: 'Private test brief', eventType: 'Concert / Festival', status: 'New', date: '', createdAt: new Date(), idempotencyKey: 'secret-key', requestHash: 'secret-hash', notificationRecipients: ['private'] });
  const agent = request.agent(app);
  const response = await login(agent);
  assert.equal(response.status, 200);
  assert.ok(response.headers['set-cookie'].some(cookie => cookie.includes('HttpOnly') && cookie.includes('SameSite=Lax')));
  assert.equal((await agent.get('/api/admin/session')).body.user.email, config.ADMIN_EMAIL);
  const list = await agent.get('/api/admin/inquiries?q=Mumbai&status=New');
  assert.equal(list.status, 200);
  assert.equal(list.body.total, 1);
  assert.equal(list.body.items[0].details, undefined);
  assert.equal(list.body.items[0].idempotencyKey, undefined);
  const detail = await agent.get(`/api/admin/inquiries/${reference}`);
  assert.equal(detail.body.inquiry.details, 'Private test brief');
  assert.equal(detail.body.inquiry.requestHash, undefined);
  assert.equal(detail.body.inquiry.notificationRecipients, undefined);
  assert.equal((await agent.get('/api/admin/inquiries?q=.*')).body.total, 0);
  assert.equal((await agent.get('/api/admin/inquiries?page=-1')).status, 400);
  assert.equal((await agent.post('/api/auth/sign-out').set('Origin', origin).send({})).status, 200);
  assert.equal((await agent.get('/api/admin/inquiries')).status, 401);
});

test('multiple devices work; sign out other devices revokes only those sessions', async () => {
  const first = request.agent(app), second = request.agent(app);
  assert.equal((await login(first)).status, 200);
  assert.equal((await login(second)).status, 200);
  assert.equal((await first.get('/api/admin/session')).status, 200);
  assert.equal((await second.get('/api/admin/session')).status, 200);
  assert.equal((await first.post('/api/auth/revoke-other-sessions').set('Origin', origin).send({})).status, 200);
  assert.equal((await first.get('/api/admin/session')).status, 200);
  assert.equal((await second.get('/api/admin/session')).status, 401);
});

test('a valid session cannot grant admin access for a different approved email', async () => {
  const response = await login(request(app));
  const cookie = response.headers['set-cookie'].map(value => value.split(';')[0]).join('; ');
  const restricted = createApp({ db, config: { ...config, ADMIN_EMAIL: 'different@example.com' } });
  assert.equal((await request(restricted).get('/api/admin/inquiries').set('Cookie', cookie)).status, 403);
});

test('password change requires the current password and revokes other sessions', async () => {
  const first = request.agent(app), second = request.agent(app);
  await login(first); await login(second);
  const nextPassword = `Updated-test-${randomBytes(16).toString('hex')}`;
  const bad = await first.post('/api/auth/change-password').set('Origin', origin).send({ currentPassword: 'not-the-password', newPassword: nextPassword, revokeOtherSessions: true });
  assert.notEqual(bad.status, 200);
  const changed = await first.post('/api/auth/change-password').set('Origin', origin).send({ currentPassword: password, newPassword: nextPassword, revokeOtherSessions: true });
  assert.equal(changed.status, 200);
  assert.equal((await second.get('/api/admin/session')).status, 401);
  assert.equal((await request(app).post('/api/auth/sign-in/email').set('Origin', origin).send({ email: config.ADMIN_EMAIL, password: nextPassword })).status, 200);
});

test('password recovery is private, expiring, single-use and revokes sessions', async () => {
  const sent = [];
  const resetApp = createApp({ db, config: { ...config, SMTP_ENABLED: 'true', MAIL_FROM: 'test@example.com' }, resetTransport: { sendMail: async mail => { sent.push(mail); return { accepted: [mail.to] }; } } });
  const post = (path, body) => request(resetApp).post(`/api/auth/${path}`).set('Origin', origin).send(body);
  assert.equal((await request(app).get('/api/admin/config')).body.resetEnabled, false);
  const unknown = await post('request-password-reset', { email: 'unknown@example.com' });
  const known = await post('request-password-reset', { email: config.ADMIN_EMAIL });
  assert.equal(known.status, 200);
  assert.deepEqual(known.body, unknown.body);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, config.ADMIN_EMAIL);
  const readToken = () => new URLSearchParams(new URL(sent.at(-1).text.match(/http[^\s]+/)[0]).hash.slice(1)).get('reset');
  const token = readToken();
  const record = await db.collection('verification').findOne({ identifier: `reset-password:${token}` });
  assert.ok(record.expiresAt.getTime() - Date.now() <= 900000);
  assert.notEqual((await post('reset-password', { token, newPassword: 'short' })).status, 200);
  assert.equal((await post('reset-password', { token, newPassword: password })).status, 200);
  assert.notEqual((await post('reset-password', { token, newPassword: password })).status, 200);
  const agent = request.agent(resetApp);
  assert.equal((await login(agent)).status, 200);
  await post('request-password-reset', { email: config.ADMIN_EMAIL });
  const expired = readToken();
  await db.collection('verification').updateOne({ identifier: `reset-password:${expired}` }, { $set: { expiresAt: new Date(0) } });
  assert.notEqual((await post('reset-password', { token: expired, newPassword: password })).status, 200);
  // Each scenario gets its own rate-limit window; production limits stay enabled.
  await db.collection('rateLimit').deleteMany({});
  assert.equal((await post('request-password-reset', { email: config.ADMIN_EMAIL })).status, 200);
  assert.equal((await post('reset-password', { token: readToken(), newPassword: password })).status, 200);
  assert.equal((await agent.get('/api/admin/session')).status, 401);
});

test('admin updates are private, validated, atomic and protected from stale edits', async () => {
  const reference = `RS-${randomUUID().toUpperCase()}`;
  await db.collection('inquiries').insertOne({ reference, idempotencyKey: randomUUID(), name: 'Organizer', email: 'organizer@example.com', status: 'New', createdAt: new Date() });
  const path = `/api/admin/inquiries/${reference}`;
  const body = { revision: 0, status: 'In discussion', followUp: '2027-01-20', closureReason: '', note: 'Private planning note' };
  assert.equal((await request(app).post(path).set('Origin', origin).send(body)).status, 401);
  const agent = request.agent(app);
  assert.equal((await login(agent)).status, 200);
  assert.equal((await agent.post(path).send(body)).status, 403);
  assert.equal((await agent.post(path).set('Origin', 'https://evil.example').send(body)).status, 403);
  for (const invalid of [{ status: 'Invalid' }, { followUp: '2027-02-30' }, { status: 'Closed' }, { note: 'x'.repeat(3001) }, { email: 'attacker@example.com' }]) {
    assert.equal((await agent.post(path).set('Origin', origin).send({ ...body, ...invalid })).status, 422);
  }
  const results = await Promise.all([1, 2].map(() => agent.post(path).set('Origin', origin).send(body)));
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
  const detail = (await agent.get(path)).body.inquiry;
  assert.equal(detail.status, 'In discussion');
  assert.equal(detail.revision, 1);
  assert.equal(detail.history.length, 1);
  assert.equal(detail.history[0].actor, config.ADMIN_EMAIL);
  assert.equal(detail.history[0].note, body.note);
  assert.equal(detail.history[0].changes.status.from, 'New');
  const list = (await agent.get('/api/admin/inquiries')).body.items[0];
  assert.equal(list.history, undefined);
  assert.equal((await request(app).get(path)).status, 401);
  const close = await agent.post(path).set('Origin', origin).send({ ...body, revision: 1, status: 'Closed', closureReason: 'Event cancelled', note: '', followUp: '' });
  assert.equal(close.status, 200);
  assert.equal(close.body.inquiry.history.length, 2);
  assert.equal(close.body.inquiry.followUp, '');
  const noop = await agent.post(path).set('Origin', origin).send({ ...body, revision: 2, status: 'Closed', closureReason: 'Event cancelled', note: '', followUp: '' });
  assert.equal(noop.body.inquiry.revision, 2);
  assert.equal(await db.collection('notificationJobs').countDocuments({}), 0);
});
