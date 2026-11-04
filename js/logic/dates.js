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
