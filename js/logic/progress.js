// Série dní, body XP a úrovně. Vše se počítá z uložených cvičení,
// takže čísla nikdy nemůžou „nesedět“ s historií.
import { localDateString, addDays, mondayOf, parseLocalDate } from './dates.js';
import { missionXp } from './mission.js';
import { worldsXpByDate } from './worlds.js';
import { changesXpByDate } from './changes.js';

export const RULES = {
  practiceDayMinSec: 5 * 60,  // den se počítá od 5 minut
  restDaysPerWeek: 2,         // 2 dny volna týdně sérii nepřeruší
  xpPerMinute: 1,
  xpMinutesCapPerDay: 30,     // max. 30 XP za minuty denně
  xpGoalBonus: 20,            // splněný denní cíl
  xpStreakBonus: 50,          // každých 7 dní série
  streakBonusEvery: 7,
  xpJournal: 5,               // zápis do deníku, jednou denně
  defaultGoalMin: 15,
};

// Součet za každý den: { '2026-11-04': { seconds, goalMin } }
export function summarizeDays(sessions) {
  const days = {};
  for (const s of [...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt))) {
    const day = (days[s.date] ??= { seconds: 0, goalMin: RULES.defaultGoalMin });
    day.seconds += s.seconds;
    if (s.goalMin) day.goalMin = s.goalMin; // platí cíl z posledního cvičení dne
  }
  return days;
}

// Projde všechny dny od prvního záznamu do dneška a spočítá sérii, body a čísla.
// extras: { missions: [...], journal: [...] } (od kroku 2)
export function computeProgress(sessions, today = new Date(), { missions = [], journal = [], worlds = null, changes = [] } = {}) {
  const days = summarizeDays(sessions);
  const todayKey = localDateString(today);
  const missionByDate = Object.fromEntries(missions.map((m) => [m.date, m]));
  const journalDates = new Set(journal.map((j) => j.date));
  const worldXp = worlds ? worldsXpByDate(worlds) : {};
  const changeXp = changesXpByDate(changes);
  const keys = [...new Set([...Object.keys(days), ...Object.keys(missionByDate), ...journalDates, ...Object.keys(worldXp), ...Object.keys(changeXp)])]
    .filter((k) => k <= todayKey).sort();

  const result = {
    streak: 0, bestStreak: 0, xp: 0, todaySec: days[todayKey]?.seconds ?? 0,
    totalSec: 0, practiceDays: 0, statusByDate: {}, missesByWeek: {},
  };
  if (!keys.length) return result;
  let started = false; // série se počítá až od prvního dne s cvičením

  let streak = 0;
  for (let d = parseLocalDate(keys[0]); localDateString(d) <= todayKey; d = addDays(d, 1)) {
    const key = localDateString(d);
    const day = days[key];
    const practised = (day?.seconds ?? 0) >= RULES.practiceDayMinSec;

    if (day) {
      const minutes = Math.floor(day.seconds / 60);
      result.xp += Math.min(minutes * RULES.xpPerMinute, RULES.xpMinutesCapPerDay);
      if (day.seconds >= day.goalMin * 60) result.xp += RULES.xpGoalBonus;
      result.totalSec += day.seconds;
    }
    result.xp += missionXp(missionByDate[key]);
    if (journalDates.has(key)) result.xp += RULES.xpJournal;
    result.xp += worldXp[key] ?? 0;
    result.xp += changeXp[key] ?? 0;

    if (practised) {
      started = true;
      streak += 1;
      result.practiceDays += 1;
      result.bestStreak = Math.max(result.bestStreak, streak);
      if (streak % RULES.streakBonusEvery === 0) result.xp += RULES.xpStreakBonus;
      result.statusByDate[key] = 'done';
    } else if (!started) {
      // před prvním cvičením (např. jen odškrtnutý úkol) se volno nepočítá
    } else if (key === todayKey) {
      result.statusByDate[key] = 'today'; // dnešek sérii nikdy nepřeruší
    } else {
      const week = localDateString(mondayOf(d));
      const misses = (result.missesByWeek[week] ?? 0) + 1;
      result.missesByWeek[week] = misses;
      if (misses > RULES.restDaysPerWeek) {
        streak = 0;
        result.statusByDate[key] = 'missed';
      } else {
        result.statusByDate[key] = 'rest';
      }
    }
  }
  result.streak = streak;
  return result;
}

// Kolik dní volna už padlo v tomto týdnu (Po až včera).
export function restUsedThisWeek(progress, today = new Date()) {
  return Math.min(progress.missesByWeek[localDateString(mondayOf(today))] ?? 0, RULES.restDaysPerWeek);
}

// 7 dní aktuálního týdne pro „týden v kostce“.
export function weekView(progress, today = new Date()) {
  const monday = mondayOf(today);
  const todayKey = localDateString(today);
  return Array.from({ length: 7 }, (_, i) => {
    const key = localDateString(addDays(monday, i));
    const status = progress.statusByDate[key] ?? (key > todayKey ? 'future' : key === todayKey ? 'today' : 'none');
    return { key, index: i, status };
  });
}

// Úrovně: 1 od 0 XP, pak 100, 250, 450, 700, 1000 … (každý krok o 50 XP větší).
export function levelFor(xp) {
  let level = 1;
  let floor = 0;
  let step = 100;
  while (xp >= floor + step) {
    floor += step;
    step += 50;
    level += 1;
  }
  return { level, floorXp: floor, nextXp: floor + step };
}
