import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readConfig } from '../src/config.js';
import { inquirySchema } from '../src/validation.js';
import { failureStatus } from '../src/notifications.js';

const env = { MONGODB_URI: 'mongodb://localhost:27017', MONGODB_DB: 'test', WEB_ORIGINS: 'http://localhost:5173' };
const valid = { name: 'Test person', email: 'test@example.com', city: 'Mumbai, India', eventType: 'Concert / Festival', date: '2026-10-16', timezone: 'Asia/Kolkata', details: 'A test concert.' };

test('configuration fails closed for missing credentials, unsafe origins and blanket proxy trust', () => {
  assert.equal(readConfig(env).SMTP_ENABLED, 'false');
  assert.throws(() => readConfig({ ...env, MONGODB_URI: '' }));
  assert.throws(() => readConfig({ ...env, NODE_ENV: 'production' }));
  assert.throws(() => readConfig({ ...env, WEB_ORIGINS: '*' }));
  assert.throws(() => readConfig({ ...env, TRUST_PROXY: 'true' }));
  assert.throws(() => readConfig({ ...env, SMTP_ENABLED: 'true' }));
  assert.throws(() => readConfig({ ...env, SMTP_ENABLED: 'yes' }));
  assert.equal(readConfig({ ...env, TRUST_PROXY: 'loopback' }).TRUST_PROXY, 'loopback');
});

test('date checks reject impossible and past dates, respecting calendar timezone', () => {
  const schema = inquirySchema(new Date('2026-10-16T01:00:00Z'));
  assert.equal(schema.safeParse(valid).success, true);
  assert.equal(schema.safeParse({ ...valid, date: '' }).success, true);
  assert.equal(schema.safeParse({ ...valid, date: '2026-10-15' }).success, false);
  assert.equal(schema.safeParse({ ...valid, date: '2026-10-15', timezone: 'America/Los_Angeles' }).success, true);
  assert.equal(schema.safeParse({ ...valid, date: '2027-02-30' }).success, false);
  assert.equal(schema.safeParse({ ...valid, timezone: 'not-a-timezone' }).success, false);
  assert.equal(schema.safeParse({ ...valid, status: 'Confirmed' }).success, false);
});

test('SMTP retries definite transient failures only; ambiguous delivery requires review', () => {
  assert.equal(failureStatus({ responseCode: 451 }, 1), 'pending');
  assert.equal(failureStatus({ responseCode: 451 }, 5), 'failed');
  assert.equal(failureStatus({ responseCode: 550 }, 1), 'failed');
  assert.equal(failureStatus({ command: 'CONN', code: 'ETIMEDOUT' }, 1), 'pending');
  assert.equal(failureStatus({ command: 'DATA', code: 'ETIMEDOUT' }, 1), 'uncertain');
  assert.equal(failureStatus({}, 1), 'uncertain');
});
