import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { readConfig } from '../src/config.js';
import { connectDatabase } from '../src/db.js';
import { createApp } from '../src/app.js';
import { createAdminAuth } from '../src/auth.js';
import { customerLink, tokenHash } from '../src/customerAccess.js';
import { queueNotifications, deliverNextJob } from '../src/notifications.js';

let mongo, client, db, config, app;
const origin = 'http://localhost:5173';
const email = 'customer@example.com';
const other = 'other@example.com';
const reference = `RS-${randomUUID().toUpperCase()}`;
const otherReference = `RS-${randomUUID().toUpperCase()}`;
const password = randomBytes(20).toString('hex');
const tokenFrom = url => new URLSearchParams(new URL(url).hash.slice(1)).get('token');
before(async () => {
  mongo = await MongoMemoryServer.create({ binary: { downloadDir: '/tmp/rythum-mongodb-binaries' } });
  config = readConfig({ NODE_ENV: 'test', MONGODB_URI: mongo.getUri(), MONGODB_DB: 'customer_test', WEB_ORIGINS: origin, AUTH_SECRET: randomBytes(32).toString('hex'), ADMIN_EMAIL: 'admin@example.com', SMTP_ENABLED: 'true', SMTP_HOST: 'smtp.example.com', SMTP_USER: 'test', SMTP_PASS: 'test', MAIL_FROM: 'test@example.com', MAIL_REPLY_TO: 'team@example.com', TEAM_EMAILS: 'team@example.com' });
  ({ client, db } = await connectDatabase(config));
  await createAdminAuth(db, config, { bootstrap: true }).api.signUpEmail({ body: { email: config.ADMIN_EMAIL, password, name: 'Owner' } });
}, { timeout: 180000 });
beforeEach(async () => {
  for (const collection of ['inquiries', 'messages', 'notificationJobs', 'customerTokens', 'customerSessions', 'customerLinkLimits', 'rateLimit', 'session']) await db.collection(collection).deleteMany({});
  await db.collection('inquiries').insertMany([
    { reference, email, idempotencyKey: 'one', name: 'Customer', eventType: 'Concert / Festival', status: 'New', details: 'Event brief', city: 'Mumbai', createdAt: new Date(), history: [{ note: 'SECRET NOTE' }], closureReason: 'SECRET REASON', followUp: '2027-01-01', requestHash: 'SECRET HASH' },
    { reference: otherReference, email: other, idempotencyKey: 'two', status: 'New', createdAt: new Date() },
  ]);
  app = createApp({ db, config });
});
after(async () => { await client?.close(); await mongo?.stop(); });
async function login(address = email) {
  const token = tokenFrom(await customerLink(db, config, address));
  const agent = request.agent(app);
  assert.equal((await agent.post('/api/customer/verify').set('Origin', origin).send({ token })).status, 200);
  return agent;
}
const post = (agent, path, body) => agent.post(`/api/customer/${path}`).set('Origin', origin).send(body);

test('request responses hide account existence; bounded queue sends only to inquiry owners', async () => {
  const known = await post(request(app), 'request-link', { email });
  const unknown = await post(request(app), 'request-link', { email: 'unknown@example.com' });
  assert.equal(known.status, 200); assert.deepEqual(known.body, unknown.body);
  for (let i = 0; i < 5; i++) await post(request(app), 'request-link', { email });
  assert.equal(await db.collection('notificationJobs').countDocuments({ to: email }), 3);
  const sent = [];
  const transport = { sendMail: async value => { sent.push(value); return { accepted: [value.to] }; } };
  while (await deliverNextJob(db, transport, config)) { /* drain isolated queue */ }
  assert.equal(sent.length, 3); assert.ok(sent.every(mail => mail.to === email));
  assert.equal(await db.collection('notificationJobs').countDocuments({ status: 'skipped' }), 1);
  const raw = tokenFrom(sent[0].text.match(/http\S+/)[0]);
  assert.ok(await db.collection('customerTokens').findOne({ _id: tokenHash(raw) }));
  assert.ok(!JSON.stringify(await db.collection('customerTokens').find({}).toArray()).includes(raw));
  assert.equal((await request(app).post('/api/customer/request-link').send({ email })).status, 403);
  assert.equal((await post(request(app), 'request-link', { email: 'invalid' })).status, 422);
});

test('links are single-use under racing requests, expire, and sessions can be revoked', async () => {
  const token = tokenFrom(await customerLink(db, config, email));
  const results = await Promise.all([1, 2].map(() => post(request(app), 'verify', { token })));
  assert.deepEqual(results.map(value => value.status).sort(), [200, 400]);
  const cookies = results.find(value => value.status === 200).headers['set-cookie'];
  assert.ok(cookies[0].includes('HttpOnly') && cookies[0].includes('SameSite=Lax'));
  const expired = tokenFrom(await customerLink(db, config, email));
  await db.collection('customerTokens').updateOne({ _id: tokenHash(expired) }, { $set: { expiresAt: new Date(0) } });
  assert.equal((await post(request(app), 'verify', { token: expired })).status, 400);
  const agent = await login();
  assert.equal((await agent.get('/api/customer/session')).body.email, email);
  assert.equal((await agent.get('/api/admin/inquiries')).status, 401);
  assert.equal((await post(agent, 'logout', {})).status, 200);
  assert.equal((await agent.get('/api/customer/inquiries')).status, 401);
  const second = await login();
  await db.collection('customerSessions').updateMany({}, { $set: { expiresAt: new Date(0) } });
  assert.equal((await second.get('/api/customer/session')).status, 401);
});

test('portal projections and conversation access isolate customers and hide internal information', async () => {
  assert.equal((await request(app).get('/api/customer/inquiries')).status, 401);
  const agent = await login();
  const result = await agent.get('/api/customer/inquiries');
  assert.equal(result.body.items.length, 1);
  assert.equal(result.body.items[0].reference, reference);
  assert.ok(!JSON.stringify(result.body).includes('SECRET'));
  assert.equal(result.body.items[0].followUp, undefined);
  assert.equal((await agent.get(`/api/customer/inquiries/${otherReference}/messages`)).status, 404);
  assert.equal((await post(agent, `inquiries/${otherReference}/messages`, { key: randomUUID(), text: 'Attempt' })).status, 404);
  assert.equal((await agent.get('/api/customer/inquiries?page=-1')).status, 400);
});

test('customer and admin replies persist once, queue notifications, and never include private notes', async () => {
  const agent = await login();
  const path = `inquiries/${reference}/messages`;
  const body = { key: randomUUID(), text: 'Can we discuss timing?' };
  const results = await Promise.all([post(agent, path, body), post(agent, path, body)]);
  assert.ok(results.every(value => value.status === 200));
  assert.equal(await db.collection('messages').countDocuments({}), 1);
  assert.equal((await post(agent, path, { ...body, text: 'Changed retry' })).status, 409);
  assert.equal((await post(agent, path, { key: randomUUID(), text: ' ', role: 'team' })).status, 422);
  assert.equal((await agent.post(`/api/customer/${path}`).send(body)).status, 403);
  const admin = request.agent(app);
  assert.equal((await admin.post('/api/auth/sign-in/email').set('Origin', origin).send({ email: config.ADMIN_EMAIL, password })).status, 200);
  assert.equal((await admin.post(`/api/admin/${path}`).set('Origin', origin).send({ key: randomUUID(), text: 'Yes, please share your preferred time.' })).status, 200);
  const messages = (await agent.get(`/api/customer/${path}`)).body.items;
  assert.deepEqual(messages.map(value => value.role), ['customer', 'team']);
  assert.ok(!JSON.stringify(messages).includes('SECRET'));
  await queueNotifications(db); await queueNotifications(db);
  assert.equal(await db.collection('notificationJobs').countDocuments({}), 2);
  const sent = [];
  const transport = { sendMail: async value => { sent.push(value); return { accepted: [value.to] }; } };
  while (await deliverNextJob(db, transport, config)) { /* mocked mail */ }
  assert.deepEqual(sent.map(mail => mail.to).sort(), [email, 'team@example.com']);
  assert.ok(sent.every(mail => !mail.text.includes(body.text)));
  assert.ok(sent.some(mail => mail.text.includes('/portal')));
});

test('acknowledgements contain a fresh portal link and retain durable queue deduplication', async () => {
  await db.collection('inquiries').updateOne({ reference }, { $set: { outboxPending: true, notificationRecipients: [{ to: email, kind: 'acknowledgement' }] } });
  await queueNotifications(db); await queueNotifications(db);
  let mail;
  await deliverNextJob(db, { sendMail: async value => { mail = value; return { accepted: [value.to] }; } }, config);
  assert.ok(mail.text.includes(reference));
  assert.ok(mail.html.includes('View your inquiry'));
  const url = mail.text.match(/http\S*\/portal#token=[a-f0-9]+/)[0];
  assert.equal((await post(request(app), 'verify', { token: tokenFrom(url) })).status, 200);
  assert.equal(await db.collection('notificationJobs').countDocuments({}), 1);
});

test('Socket.IO delivers saved changes only to the owner and admin, rejects spoofing and revoked sessions', async () => {
  const { createServer } = await import('node:http');
  const { io: connect } = await import('socket.io-client');
  const { createRealtime } = await import('../src/realtime.js');
  const server = createServer(app);
  const realtime = createRealtime(server, { db, config, auth: app.locals.auth });
  app.locals.publish = realtime.publish;
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const sockets = [];
  const cookies = response => response.headers['set-cookie'].map(value => value.split(';')[0]).join('; ');
  async function cookieFor(address) {
    const token = tokenFrom(await customerLink(db, config, address));
    return cookies(await post(request(app), 'verify', { token }));
  }
  const ownerCookie = await cookieFor(email);
  const otherCookie = await cookieFor(other);
  const adminCookie = cookies(await request(app).post('/api/auth/sign-in/email').set('Origin', origin).send({ email: config.ADMIN_EMAIL, password }));
  function socket(cookie, audience, allowedOrigin = origin) {
    const client = connect(url, { path: '/api/customer/realtime', auth: { audience }, transports: ['websocket'], reconnection: false, extraHeaders: { Cookie: cookie, Origin: allowedOrigin } });
    sockets.push(client);
    return client;
  }
  const once = (socket, event) => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Missing ${event}`)), 3000);
    socket.once(event, data => { clearTimeout(timeout); resolve(data); });
  });
  try {
    const owner = socket(ownerCookie, 'customer'); await once(owner, 'connect');
    const unrelated = socket(otherCookie, 'customer'); await once(unrelated, 'connect');
    const admin = socket(adminCookie, 'admin'); await once(admin, 'connect');
    const received = []; unrelated.on('inquiry:updated', event => received.push(event));
    const nextOwner = once(owner, 'inquiry:updated'), nextAdmin = once(admin, 'inquiry:updated');
    const response = await request(app).post(`/api/admin/inquiries/${reference}/messages`).set('Origin', origin).set('Cookie', adminCookie).send({ key: randomUUID(), text: 'Realtime reply' });
    assert.equal(response.status, 200);
    assert.deepEqual(await nextOwner, { reference, kind: 'message' });
    assert.deepEqual(await nextAdmin, { reference, kind: 'message' });
    assert.equal(await db.collection('messages').countDocuments({ reference }), 1);
    const forged = socket(ownerCookie, 'admin');
    assert.equal((await once(forged, 'connect_error')).data.code, 'AUTH_REQUIRED');
    const untrusted = socket(ownerCookie, 'customer', 'https://evil.example');
    await once(untrusted, 'connect_error');
    const noCookie = socket('', 'customer'); await once(noCookie, 'connect_error');
    const status = once(owner, 'inquiry:updated');
    assert.equal((await request(app).post(`/api/admin/inquiries/${reference}`).set('Origin', origin).set('Cookie', adminCookie).send({ revision: 0, status: 'In discussion', followUp: '', closureReason: '', note: 'PRIVATE NOTE' })).status, 200);
    assert.deepEqual(await status, { reference, kind: 'status' });
    const expired = once(owner, 'session:expired');
    await db.collection('customerSessions').deleteMany({ email });
    await realtime.publish({ reference, email, kind: 'message' });
    await expired;
    assert.deepEqual(received, []);
  } finally {
    sockets.forEach(socket => socket.disconnect());
    await new Promise(resolve => realtime.io.close(resolve));
  }
});
