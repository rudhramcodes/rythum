import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveInquiry } from '../src/inquiries.js';

test('email-only duplicate check never returns the existing reference or contact details', async () => {
  const email = 'private@example.com';
  const reference = 'RS-PRIVATE-REFERENCE';
  const db = { collection: () => ({ findOne: async query => query.email ? { reference, email } : null }) };
  await assert.rejects(saveInquiry({ db, config: {} }, { email }, 'new-attempt'), error => {
    assert.equal(error.code, 'DUPLICATE_INQUIRY');
    assert.equal(error.reference, undefined);
    assert.ok(!error.message.includes(reference));
    assert.ok(!error.message.includes(email));
    assert.ok(!JSON.stringify(error).includes(reference));
    return true;
  });
});

test('in-discussion and quoted inquiries remain covered by duplicate protection', async () => {
  let statuses;
  const db = { collection: () => ({ findOne: async query => {
    if (!query.email) return null;
    statuses = query.status.$in;
    return { reference: 'private' };
  } }) };
  await assert.rejects(saveInquiry({ db, config: {} }, { email: 'private@example.com' }, 'key'), { code: 'DUPLICATE_INQUIRY' });
  assert.ok(statuses.includes('In discussion'));
  assert.ok(statuses.includes('Quoted'));
  assert.ok(!statuses.includes('Closed'));
});
