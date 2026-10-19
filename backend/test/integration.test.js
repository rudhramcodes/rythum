import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { readConfig } from '../src/config.js';
import { connectDatabase } from '../src/db.js';
import { createApp } from '../src/app.js';
import { saveInquiry } from '../src/inquiries.js';
import { deliverNextJob, queueNotifications } from '../src/notifications.js';

let mongo, client, db, config, app;
const origin = 'http://localhost:5173';
const valid = { name: 'Test person', email: 'customer@example.com', phone: '', city: 'Mumbai, India', eventType: 'Concert / Festival', date: '2099-10-16', timezone: 'Asia/Kolkata', details: 'An integration-test inquiry.', website: '' };
const post = (body = valid, key = randomUUID()) => request(app).post('/api/inquiries').set('Origin', origin).set('Idempotency-Key', key).send(body);

before(async () => {
  mongo = await MongoMemoryServer.create({ binary: { downloadDir: '/tmp/rythum-mongodb-binaries' } });
  config = readConfig({ NODE_ENV: 'test', MONGODB_URI: mongo.getUri(), MONGODB_DB: 'rythum_test', WEB_ORIGINS: origin, TEAM_EMAILS: 'team@example.com' });
  ({ client, db } = await connectDatabase(config));
}, { timeout: 180000 });

beforeEach(async () => {
  for (const name of ['inquiries', 'notificationJobs', 'submissionLimits']) await db.collection(name).deleteMany({});
  app = createApp({ client, db, config });
});

after(async () => { await client?.close(); await mongo?.stop(); });

test('save inquiry before success, queue email while SMTP is disabled, expose no private retrieval', async () => {
  const response = await post();
  assert.equal(response.status, 201);
  assert.equal(response.body.inquiry.status, 'New');
  const inquiry = await db.collection('inquiries').findOne({ reference: response.body.inquiry.reference });
  assert.equal(inquiry.details, valid.details);
  assert.equal(inquiry.source, 'website');
  assert.equal(inquiry.website, undefined);
  assert.equal(inquiry.outboxPending, true);
  assert.equal(inquiry.notificationRecipients.length, 2);
  assert.equal((await db.command({ hello: 1 })).setName, undefined);
  await queueNotifications(db);
  assert.equal(await db.collection('notificationJobs').countDocuments({ status: 'pending' }), 2);
  assert.equal((await request(app).get(`/api/inquiries/${inquiry.reference}`)).status, 404);
  assert.equal((await request(app).get('/api/health')).status, 200);
});

test('concurrent retries save one inquiry and one set of jobs; changed body with same key is rejected', async () => {
  const key = randomUUID();
  const responses = await Promise.all(Array.from({ length: 4 }, () => post(valid, key)));
  assert.ok(responses.every(response => [200, 201].includes(response.status)));
  assert.equal(new Set(responses.map(response => response.body.inquiry.reference)).size, 1);
  assert.equal(await db.collection('inquiries').countDocuments(), 1);
  assert.equal((await db.collection('submissionLimits').findOne()).keys.length, 1);
  await Promise.all([queueNotifications(db), queueNotifications(db)]);
  assert.equal(await db.collection('notificationJobs').countDocuments(), 2);
  assert.equal((await post({ ...valid, details: 'Changed event brief.' }, key)).status, 409);
});

test('bad input, honeypot, untrusted origin and missing submission key create no records', async () => {
  assert.equal((await post({ ...valid, email: 'invalid' })).status, 422);
  assert.equal((await post({ ...valid, name: ' ' })).status, 422);
  assert.equal((await post({ ...valid, date: '2020-01-01' })).status, 422);
  assert.equal((await post({ ...valid, website: 'spam' })).status, 422);
  assert.equal((await post({ ...valid, details: 'a'.repeat(5001) })).status, 422);
  assert.equal((await post({ ...valid, status: 'Confirmed' })).status, 422);
  assert.equal((await request(app).post('/api/inquiries').set('Origin', 'https://untrusted.example').send(valid)).status, 403);
  assert.equal((await request(app).post('/api/inquiries').set('Origin', origin).send(valid)).status, 400);
  assert.equal((await request(app).post('/api/inquiries').send(valid)).status, 403);
  assert.equal(await db.collection('inquiries').countDocuments(), 0);
});

test('body limits, malformed JSON and CORS preflight have safe responses', async () => {
  assert.equal((await post({ ...valid, details: 'x'.repeat(40000) })).status, 413);
  assert.equal((await request(app).post('/api/inquiries').set('Origin', origin).set('Content-Type', 'application/json').send('{broken')).status, 400);
  const response = await request(app).options('/api/inquiries').set('Origin', origin).set('Access-Control-Request-Method', 'POST');
  assert.equal(response.status, 204);
  assert.equal(response.headers['access-control-allow-origin'], origin);
});

test('per-email rate limit survives a new API instance and does not create extra jobs', async () => {
  for (let i = 0; i < 3; i++) assert.equal((await post()).status, 201);
  app = createApp({ client, db, config });
  assert.equal((await post()).status, 429);
  assert.equal(await db.collection('inquiries').countDocuments(), 3);
  await queueNotifications(db);
  assert.equal(await db.collection('notificationJobs').countDocuments(), 6);
});

test('queue failure leaves saved intent recoverable; restart never duplicates an already-created job', async () => {
  await post();
  const inquiry = await db.collection('inquiries').findOne();
  const brokenDb = { collection: name => name === 'notificationJobs'
    ? { updateOne: async () => { throw new Error('Simulated database failure'); } }
    : db.collection(name) };
  await assert.rejects(queueNotifications(brokenDb));
  assert.equal(await db.collection('inquiries').countDocuments({ outboxPending: true }), 1);
  await queueNotifications(db);
  await db.collection('notificationJobs').updateOne({ kind: 'acknowledgement' }, { $set: { status: 'sent', attempts: 1 } });
  // Simulate a crash after job writes but before clearing the pending marker.
  await db.collection('inquiries').updateOne({ _id: inquiry._id }, { $set: { outboxPending: true } });
  await queueNotifications(db);
  assert.equal(await db.collection('notificationJobs').countDocuments(), 2);
  assert.equal(await db.collection('notificationJobs').countDocuments({ status: 'sent', attempts: 1 }), 1);
  assert.equal(await db.collection('inquiries').countDocuments({ outboxPending: true }), 0);
});

test('failed inquiry write creates no jobs; retry reuses its rate-limit slot', async () => {
  const realInquiries = db.collection('inquiries');
  const brokenDb = { collection: name => name === 'inquiries'
    ? { findOne: (...args) => realInquiries.findOne(...args), insertOne: async () => { throw new Error('Simulated write failure'); } }
    : db.collection(name) };
  const key = randomUUID();
  await assert.rejects(saveInquiry({ db: brokenDb, config }, valid, key));
  assert.equal(await db.collection('inquiries').countDocuments(), 0);
  assert.equal(await db.collection('notificationJobs').countDocuments(), 0);
  assert.equal((await post(valid, key)).status, 201);
  assert.equal((await db.collection('submissionLimits').findOne()).keys.length, 1);
});

test('simultaneous distinct attempts cannot exceed the per-email limit', async () => {
  const responses = await Promise.all(Array.from({ length: 6 }, () => post()));
  assert.equal(responses.filter(response => response.status === 201).length, 3);
  assert.equal(responses.filter(response => response.status === 429).length, 3);
  assert.equal(await db.collection('inquiries').countDocuments(), 3);
});

test('worker claims jobs once and sends the approved templates with website reply links', async () => {
  await post();
  await queueNotifications(db);
  const sent = [];
  const transport = { sendMail: async mail => { sent.push(mail); return { accepted: [mail.to] }; } };
  const mailConfig = { ...config, MAIL_FROM: 'bookings@example.com', MAIL_REPLY_TO: 'bookings@example.com' };
  await Promise.all([deliverNextJob(db, transport, mailConfig), deliverNextJob(db, transport, mailConfig)]);
  assert.equal(sent.length, 2);
  assert.equal(await db.collection('notificationJobs').countDocuments({ status: 'sent' }), 2);
  assert.equal(await deliverNextJob(db, transport, mailConfig), false);
  assert.ok(sent.find(mail => mail.to === 'team@example.com').text.includes(valid.details));
  assert.ok(sent.every(mail => !mail.html.includes('mailto:')));
  assert.ok(sent.find(mail => mail.to === valid.email).text.includes('/portal#token='));
});

test('transient SMTP failure retries later, permanent/ambiguous sends and expired leases are not blindly retried', async () => {
  await post();
  await queueNotifications(db);
  await db.collection('notificationJobs').deleteOne({ kind: 'team-notification' });
  const now = new Date(Date.now() + 1000);
  const mailConfig = { ...config, MAIL_FROM: 'bookings@example.com' };
  const failing = { sendMail: async () => { throw Object.assign(new Error('temporary'), { responseCode: 451, code: 'EMESSAGE' }); } };
  await deliverNextJob(db, failing, mailConfig, now);
  let job = await db.collection('notificationJobs').findOne();
  assert.equal(job.status, 'pending');
  assert.equal(job.attempts, 1);
  assert.equal(await deliverNextJob(db, failing, mailConfig, now), false);
  const ambiguous = { sendMail: async () => { throw Object.assign(new Error('timeout'), { code: 'ETIMEDOUT', command: 'DATA' }); } };
  await deliverNextJob(db, ambiguous, mailConfig, new Date(now.getTime() + 61000));
  job = await db.collection('notificationJobs').findOne();
  assert.equal(job.status, 'uncertain');
  await db.collection('notificationJobs').updateOne({ _id: job._id }, { $set: { status: 'sending', leaseUntil: now } });
  assert.equal(await deliverNextJob(db, failing, mailConfig, new Date(now.getTime() + 120000)), false);
  assert.equal((await db.collection('notificationJobs').findOne()).errorCode, 'WORKER_INTERRUPTED');
  assert.equal(await db.collection('inquiries').countDocuments(), 1);
});
