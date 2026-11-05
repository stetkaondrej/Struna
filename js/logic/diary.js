// Zvukový deník: nahrávky po týdnech a porovnání „Tehdy a teď“. Čistá logika.
import { localDateString, addDays, mondayOf, parseLocalDate, daysBetween } from './dates.js';

// Týden 1 = týden prvního cvičení (nebo první nahrávky, pokud je dřív).
export function firstWeekStart(sessions, clips) {
  const dates = [...sessions.map((s) => s.date), ...clips.map((c) => c.date)].sort();
  return dates.length ? mondayOf(parseLocalDate(dates[0])) : null;
}

// Skupiny po týdnech, nejnovější nahoře. Uvnitř týdne nejnovější nahoře.
export function groupByWeek(clips, start) {
  if (!start) return [];
  const groups = new Map();
  for (const c of clips) {
    const monday = mondayOf(parseLocalDate(c.date));
    const key = localDateString(monday);
    if (!groups.has(key)) {
      groups.set(key, {
        key, start: monday, end: addDays(monday, 6),
        weekNo: Math.floor(daysBetween(start, monday) / 7) + 1, clips: [],
      });
    }
    groups.get(key).clips.push(c);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, clips: g.clips.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

const normalize = (title) => (title || '').toLocaleLowerCase('cs').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

// Tehdy a teď: nejstarší a nejnovější nahrávka stejné skladby (podle názvu, s nejdelším odstupem).
// Když žádná skladba nemá 2 nahrávky, vezme úplně první a poslední nahrávku.
export function compareCandidates(clips) {
  if (clips.length < 2) return null;
  const sorted = [...clips].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const byTitle = new Map();
  for (const c of sorted) {
    const k = normalize(c.title);
    if (!byTitle.has(k)) byTitle.set(k, []);
    byTitle.get(k).push(c);
  }
  let best = null;
  for (const list of byTitle.values()) {
    if (list.length < 2) continue;
    const pair = { before: list[0], after: list[list.length - 1], sameSong: true };
    if (!best || span(pair) > span(best)) best = pair;
  }
  return best ?? { before: sorted[0], after: sorted[sorted.length - 1], sameSong: false };
}

const span = (p) => new Date(p.after.createdAt) - new Date(p.before.createdAt);

export const daysApart = (pair) => daysBetween(parseLocalDate(pair.before.date), parseLocalDate(pair.after.date));

export const hasClipThisWeek = (clips, today = new Date()) => {
  const monday = localDateString(mondayOf(today));
  return clips.some((c) => c.date >= monday);
};

export const clipWeeks = (clips) => new Set(clips.map((c) => localDateString(mondayOf(parseLocalDate(c.date))))).size;
