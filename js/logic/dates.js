// Datum v místním čase ve tvaru RRRR-MM-DD (např. 2026-11-04).
// Používáme místní čas, ne UTC, aby cvičení ve 23:30 patřilo ke správnému dni.
export function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Počet celých dní mezi dvěma okamžiky (podle místního kalendáře).
export function daysBetween(a, b) {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((db - da) / 86400000);
}

// Den posunutý o n dní (místní kalendář, bezpečné i přes změnu času).
export function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

// Pondělí týdne, do kterého patří datum.
export function mondayOf(date) {
  const dayIndex = (date.getDay() + 6) % 7; // Po = 0 … Ne = 6
  return addDays(date, -dayIndex);
}

// "2026-11-04" → Date (místní půlnoc)
export function parseLocalDate(text) {
  const [y, m, d] = text.split('-').map(Number);
  return new Date(y, m - 1, d);
}
