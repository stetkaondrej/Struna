// Mapa výprav: stav světů, odemykání a automatické výzvy. Čistá logika.
// progress = { lessons: { lekceId: 'RRRR-MM-DD' }, bosses: { svetId: 'RRRR-MM-DD' }, skipped: [svetId] }

export const LESSON_XP = 5;
export const BOSS_XP = 100;
export const QUIZ_TARGET = 10;
export const EMPTY_WORLDS = { lessons: {}, bosses: {}, skipped: [] };

export const isWorldDone = (world, p) => Boolean(p.bosses?.[world.id]) || (p.skipped ?? []).includes(world.id);

// Stav všech světů: done (hotovo), current (právě tady), open (odemčený, např. po přeskočení), locked.
export function worldStates(worlds, progress) {
  const p = { ...EMPTY_WORLDS, ...progress };
  let currentFound = false;
  return worlds.map((w, i) => {
    const done = isWorldDone(w, p);
    const unlocked = i === 0 || isWorldDone(worlds[i - 1], p);
    const lessonsDone = w.lessons.filter((l) => p.lessons[l.id]).length;
    let status = 'locked';
    if (done) status = 'done';
    else if (unlocked && !currentFound) { status = 'current'; currentFound = true; }
    else if (unlocked) status = 'open';
    return {
      id: w.id, status, lessonsDone, lessonsTotal: w.lessons.length,
      bossAvailable: !done && unlocked && lessonsDone === w.lessons.length,
      bossDone: Boolean(p.bosses[w.id]), skipped: p.skipped.includes(w.id),
    };
  });
}

// Výzva typu „chords“: stačí dost akordů s dostatkem hvězdiček.
export function chordsBossMet(boss, chordProgress) {
  const good = Object.values(chordProgress ?? {}).filter((c) => (c.stars ?? 0) >= (boss.stars ?? 2)).length;
  return good >= (boss.count ?? 3);
}

// XP za mapu podle dne: { 'RRRR-MM-DD': xp }. Přeskočené světy (rodič) XP nedávají.
export function worldsXpByDate(progress) {
  const p = { ...EMPTY_WORLDS, ...progress };
  const out = {};
  for (const date of Object.values(p.lessons)) out[date] = (out[date] ?? 0) + LESSON_XP;
  for (const date of Object.values(p.bosses)) out[date] = (out[date] ?? 0) + BOSS_XP;
  return out;
}

// Hra „Která struna?“: náhodná struna, nikdy stejná dvakrát za sebou.
export function nextString(previous, random = Math.random) {
  let i;
  do { i = Math.floor(random() * 6); } while (i === previous);
  return i;
}
