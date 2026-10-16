export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isAvailableDate(value, today = localDate()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && localDate(date) === value && value >= today;
}

export function monthDays(year, month) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  return Array.from({ length: offset + new Date(year, month + 1, 0).getDate() }, (_, i) => i < offset ? null : localDate(new Date(year, month, i - offset + 1)));
}
