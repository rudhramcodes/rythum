export function updateNavScroll(state, position, max, headerHeight) {
  // Clamp mobile overscroll so bouncing at either edge cannot reverse the nav.
  const y = Math.max(0, Math.min(position, max));
  if (y <= headerHeight) return { anchor: y, hidden: false, scrolled: y > 0 };
  const delta = y - state.anchor;
  // Ignore tiny movements; anchor at the extreme until direction changes by 8px.
  const hidden = Math.abs(delta) >= 8 ? delta > 0 : state.hidden;
  const anchor = hidden !== state.hidden || (hidden ? delta > 0 : delta < 0) ? y : state.anchor;
  return { anchor, hidden, scrolled: true };
}
