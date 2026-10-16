import assert from 'node:assert/strict';
import { test } from 'node:test';
import { updateNavScroll } from './navScroll.js';

test('nav hides down, ignores jitter, reveals after a small upward scroll, and hides again', () => {
  let state = { anchor: 0, hidden: false, scrolled: false };
  const move = y => (state = updateNavScroll(state, y, 1000, 82));
  assert.equal(move(70).hidden, false);
  assert.equal(move(100).hidden, true);
  assert.equal(move(300).hidden, true);
  assert.equal(move(297).hidden, true);
  assert.equal(move(292).hidden, false);
  assert.equal(move(295).hidden, false);
  assert.equal(move(300).hidden, true);
  assert.equal(move(0).hidden, false);
  assert.equal(state.scrolled, false);
});

test('mobile edge bounce is clamped and the shorter mobile header is supported', () => {
  let state = updateNavScroll({ anchor: 80, hidden: true }, -30, 1000, 70);
  assert.equal(state.hidden, false);
  assert.equal(state.anchor, 0);
  state = updateNavScroll(state, 1000, 1000, 70);
  state = updateNavScroll(state, 1050, 1000, 70);
  assert.equal(updateNavScroll(state, 1000, 1000, 70).hidden, true);
  assert.equal(updateNavScroll(state, 992, 1000, 70).hidden, false);
  assert.equal(updateNavScroll(state, 70, 1000, 70).hidden, false);
});
