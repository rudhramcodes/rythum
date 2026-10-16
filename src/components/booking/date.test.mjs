import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isAvailableDate, localDate, monthDays } from './date.js';

test('only real dates today or in the future are selectable', () => {
  const today = '2026-10-16';
  assert.equal(isAvailableDate('2026-10-15', today), false);
  assert.equal(isAvailableDate(today, today), true);
  assert.equal(isAvailableDate('2027-01-01', today), true);
  for (const invalid of ['', '2026-02-30', '2027-02-29', '2026-13-01', '16/10/2026', '2026-10-16junk']) {
    assert.equal(isAvailableDate(invalid, today), false, invalid);
  }
  assert.equal(isAvailableDate('2028-02-29', today), true);
  assert.equal(isAvailableDate('2026-10-16', '2026-10-17'), false);
});

test('calendar uses local dates, Monday first, and handles leap years and year boundaries', () => {
  assert.equal(localDate(new Date(2026, 9, 16, 0, 1)), '2026-10-16');
  assert.deepEqual(monthDays(2026, 9).slice(0, 5), [null, null, null, '2026-10-01', '2026-10-02']);
  assert.equal(monthDays(2028, 1).filter(Boolean).length, 29);
  assert.equal(monthDays(2027, 1).filter(Boolean).length, 28);
  assert.equal(monthDays(2026, 11).at(-1), '2026-12-31');
  assert.equal(monthDays(2026, 12).find(Boolean), '2027-01-01');
});
