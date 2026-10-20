import test from 'node:test';
import assert from 'node:assert/strict';
import { messagePage } from './messagePage.js';

test('only new latest-page messages animate; initial loads, refreshes and history do not', () => {
  const a = { role: 'customer', key: 'a', text: 'Hello' };
  const b = { role: 'team', key: 'b', text: 'Welcome' };
  const first = messagePage({ items: [] }, { items: [a], pages: 2 }, 1);
  assert.equal(first.items[0].arriving, false);
  const next = messagePage(first, { items: [a, b], pages: 2 }, 1);
  assert.deepEqual(next.items.map(item => item.arriving), [false, true]);
  assert.deepEqual(messagePage(next, next, 1).items.map(item => item.arriving), [false, false]);
  const history = messagePage(next, { items: [a], pages: 2 }, 2);
  assert.equal(history.items[0].arriving, false);
  assert.deepEqual(messagePage(history, next, 1).items.map(item => item.arriving), [false, false]);
});
