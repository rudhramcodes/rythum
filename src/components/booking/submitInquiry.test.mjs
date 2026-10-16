import { test } from 'node:test';
import assert from 'node:assert/strict';
import { submitInquiry } from './submitInquiry.js';

test('submission sends JSON with the stable retry key to the configured API', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.example.com/api/inquiries');
    assert.equal(options.headers['Idempotency-Key'], 'same-key');
    assert.deepEqual(JSON.parse(options.body), { name: 'Person' });
    return Response.json({ inquiry: { reference: 'RS-test' } }, { status: 201 });
  });
  assert.equal((await submitInquiry({ name: 'Person' }, 'same-key', 'https://api.example.com/')).reference, 'RS-test');
});

test('network failures, invalid success responses and server validation do not report success', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  await assert.rejects(submitInquiry({}, 'key'), /could not confirm/);
  fetch.mock.mockImplementation(async () => Response.json({}));
  await assert.rejects(submitInquiry({}, 'key'), /could not confirm/);
  fetch.mock.mockImplementation(async () => Response.json({ error: { message: 'Check date', fields: { date: 'Past date' } } }, { status: 422 }));
  await assert.rejects(submitInquiry({}, 'key'), error => error.message === 'Check date' && error.fields.date === 'Past date');
  fetch.mock.mockImplementation(async () => Response.json({ error: { code: 'DUPLICATE_INQUIRY', message: 'Already exists', reference: 'RS-999', fields: { email: 'Duplicate' } } }, { status: 409 }));
  await assert.rejects(submitInquiry({}, 'key'), error => error.code === 'DUPLICATE_INQUIRY' && error.reference === 'RS-999' && error.fields.email === 'Duplicate');
});
