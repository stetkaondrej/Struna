// Výzva „1 minuta střídání akordů“: rekordy a body. Čistá logika.
export const CHALLENGE_SEC = 60;
export const COUNTDOWN_SEC = 3;
export const XP_ATTEMPT = 5;
export const XP_ATTEMPTS_PER_DAY = 3;
export const XP_RECORD = 10;

// Dvojice akordů bez ohledu na pořadí: Em ↔ Am je totéž co Am ↔ Em.
export const pairKey = (a, b) => [a, b].sort().join('|');

export function bestFor(results, a, b) {
  const key = pairKey(a, b);
  return results.filter((r) => pairKey(r.a, r.b) === key).reduce((m, r) => Math.max(m, r.count), 0);
}

export const bestOverall = (results) => results.reduce((m, r) => Math.max(m, r.count), 0);

// Body podle dne. Rekord = víc přechodů než všechny dřívější pokusy se stejnou dvojicí (a aspoň 1).
export function changesXpByDate(results) {
  const out = {};
  const attempts = {};
  const best = {};
  for (const r of [...results].sort((x, y) => x.id.localeCompare(y.id))) {
    const key = pairKey(r.a, r.b);
    attempts[r.date] = (attempts[r.date] ?? 0) + 1;
    let xp = attempts[r.date] <= XP_ATTEMPTS_PER_DAY ? XP_ATTEMPT : 0;
    if (r.count > (best[key] ?? 0)) { xp += XP_RECORD; best[key] = r.count; }
    out[r.date] = (out[r.date] ?? 0) + xp;
  }
  return out;
}
