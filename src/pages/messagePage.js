// Animate arrivals on the latest page, never an initial load or history navigation.
export function messagePage(previous, incoming, page) {
  const known = new Set(previous.items.map(item => `${item.role}:${item.key}`));
  return {
    ...incoming,
    page,
    items: incoming.items.map(item => ({
      ...item,
      arriving: page === 1 && previous.page === 1 && !known.has(`${item.role}:${item.key}`),
    })),
  };
}
