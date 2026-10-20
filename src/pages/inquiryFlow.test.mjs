import test from 'node:test';
import assert from 'node:assert/strict';
import { inquiryNextStep } from './inquiryFlow.js';

test('each supported stage has actionable client and admin guidance', () => {
  for (const status of ['New', 'In discussion', 'Quoted', 'Confirmed', 'Closed']) {
    for (const audience of ['admin', 'customer']) {
      const step = inquiryNextStep(status, audience);
      assert.ok(step.title && step.description && step.action);
    }
  }
  assert.match(inquiryNextStep('Confirmed', 'customer').title, /confirmed/);
  assert.doesNotMatch(inquiryNextStep('New', 'customer').title, /confirmed/);
  assert.match(inquiryNextStep('Closed', 'customer').title, /closed/);
  assert.deepEqual(inquiryNextStep('Unknown', 'customer'), inquiryNextStep('New', 'customer'));
});
