// Metronom: tempo, rytmy brnkání a záznam, jak dlouho běžel. Čistá logika.
// Takt má 4 doby = 8 osmin: 1, 1a, 2, 2a, 3, 3a, 4, 4a (sloty 0–7).

export const BPM_MIN = 40;
export const BPM_MAX = 160;
export const BPM_DEFAULT = 70;
export const DAY_MIN_SEC = 60; // den s metronomem se počítá od 1 minuty (samolepka Rytmus)

export const PATTERNS = {
  down: { slots: { 0: 'down', 2: 'down', 4: 'down', 6: 'down' } },               // ↓ ↓ ↓ ↓
  dduudu: { slots: { 0: 'down', 2: 'down', 3: 'up', 5: 'up', 6: 'down', 7: 'up' } }, // ↓ ↓ ↑ ↑ ↓ ↑ = 1 2 2a 3a 4 4a
};

export const clampBpm = (bpm) => Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(Number(bpm) || BPM_DEFAULT)));
export const eighthSec = (bpm) => 60 / clampBpm(bpm) / 2;

// Kde v taktu jsme po `elapsed` sekundách: slot osminy 0–7 a doba 1–4.
export function position(elapsed, bpm) {
  const n = Math.max(0, Math.floor(elapsed / eighthSec(bpm)));
  const slot = n % 8;
  return { slot, beat: Math.floor(slot / 2) + 1, eighths: n };
}

export const EMPTY_METRONOME = { bpm: BPM_DEFAULT, pattern: 'dduudu', days: {}, bestSteadySec: 0 };

// Zapíše jeden běh metronomu. „Steady“ = rytmus ↓ ↓ ↑ ↑ ↓ ↑ s tempem aspoň 70 (výzva světa 5).
export function logRun(state, { date, seconds, bpm, pattern }) {
  const s = { ...EMPTY_METRONOME, ...state, days: { ...(state?.days ?? {}) } };
  const sec = Math.max(0, Math.round(seconds));
  s.days[date] = (s.days[date] ?? 0) + sec;
  if (pattern === 'dduudu' && clampBpm(bpm) >= BPM_DEFAULT) s.bestSteadySec = Math.max(s.bestSteadySec ?? 0, sec);
  return s;
}

export const metronomeDays = (state) => Object.values(state?.days ?? {}).filter((sec) => sec >= DAY_MIN_SEC).length;
