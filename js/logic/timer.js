// Časovač cvičení. Čistá logika bez obrazovky.
// Čas se počítá z okamžiků (startu a pauz), ne „tikáním“. Když iPhone aplikaci uspí
// nebo zavře, po otevření se čas dopočítá správně.
//
// Stav běžícího cvičení:
//   { startedAt: ISO, accumulatedSec: číslo, runningSince: ISO | null, confirmedUntilSec: číslo }

export const MIN_SESSION_SEC = 60;      // kratší cvičení se neuloží
export const ASK_AFTER_SEC = 60 * 60;   // po hodině se zeptáme „Pořád cvičíš?“

export function start(now = new Date()) {
  const iso = now.toISOString();
  return { startedAt: iso, accumulatedSec: 0, runningSince: iso, confirmedUntilSec: ASK_AFTER_SEC };
}

export const isRunning = (active) => Boolean(active?.runningSince);

export function elapsedSec(active, now = new Date()) {
  if (!active) return 0;
  const running = active.runningSince ? Math.max(0, (now - new Date(active.runningSince)) / 1000) : 0;
  return Math.floor(active.accumulatedSec + running);
}

export function pause(active, now = new Date()) {
  if (!isRunning(active)) return active;
  return { ...active, accumulatedSec: elapsedSec(active, now), runningSince: null };
}

export function resume(active, now = new Date()) {
  if (isRunning(active)) return active;
  return { ...active, runningSince: now.toISOString() };
}

// Má se aplikace zeptat, jestli dcera pořád cvičí?
export const needsCheck = (active, now = new Date()) =>
  isRunning(active) && elapsedSec(active, now) >= active.confirmedUntilSec;

// „Ano, pořád cvičím“: další dotaz až za hodinu.
export const confirmStillPracticing = (active, now = new Date()) =>
  ({ ...active, confirmedUntilSec: elapsedSec(active, now) + ASK_AFTER_SEC });

// Ukončí cvičení. Vrátí záznam k uložení, nebo null, když bylo kratší než minuta.
// capSec: „Uložit jen první hodinu“.
export function finish(active, { now = new Date(), goalMin, capSec = Infinity, dateOf }) {
  const seconds = Math.min(elapsedSec(active, now), capSec);
  if (seconds < MIN_SESSION_SEC) return null;
  const startedAt = new Date(active.startedAt);
  return {
    id: active.startedAt,
    date: dateOf(startedAt), // cvičení přes půlnoc patří ke dni, kdy začalo
    startedAt: active.startedAt,
    endedAt: now.toISOString(),
    seconds,
    goalMin,
  };
}

// 125 → "02:05", 3725 → "1:02:05"
export function formatClock(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${m}:${sec}` : `${m}:${sec}`;
}
