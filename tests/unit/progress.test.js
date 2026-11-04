import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeProgress, weekView, restUsedThisWeek, levelFor, RULES } from '../../js/logic/progress.js';
import { localDateString, addDays } from '../../js/logic/dates.js';

// Pomocník: cvičení v daný den (místní datum) s danými minutami.
let n = 0;
const s = (date, minutes, goalMin = 15) => ({
  id: `s${n++}`, date: localDateString(date), startedAt: new Date(+date + n).toISOString(), seconds: minutes * 60, goalMin,
});
// Středa 4. 11. 2026
const WED = new Date(2026, 10, 4, 18, 0);
const day = (offset) => addDays(WED, offset);

test('bez cvičení: nula', () => {
  const p = computeProgress([], WED);
  assert.equal(p.streak, 0);
  assert.equal(p.xp, 0);
});

test('3 dny v řadě = série 3', () => {
  const p = computeProgress([s(day(-2), 10), s(day(-1), 10), s(day(0), 10)], WED);
  assert.equal(p.streak, 3);
});

test('dnešek sérii nepřeruší, dokud den neskončí', () => {
  const p = computeProgress([s(day(-2), 10), s(day(-1), 10)], WED);
  assert.equal(p.streak, 2);
  assert.equal(p.statusByDate[localDateString(WED)], 'today');
});

test('méně než 5 minut se jako den nepočítá', () => {
  const p = computeProgress([s(day(-1), 4), s(day(0), 10)], WED);
  assert.equal(p.statusByDate[localDateString(day(-1))], 'rest');
  assert.equal(p.streak, 1);
});

test('2 dny volna v týdnu sérii nepřeruší, třetí ano', () => {
  // Po cvičí, Út volno, St volno, Čt cvičí → série 2 (volno se nepočítá do série)
  const mon = new Date(2026, 10, 2, 18);
  const two = computeProgress([s(mon, 10), s(addDays(mon, 3), 10)], addDays(mon, 3));
  assert.equal(two.streak, 2);
  assert.equal(restUsedThisWeek(two, addDays(mon, 3)), 2);

  // Po cvičí, Út, St, Čt volno → třetí volno sérii přeruší, Pá začíná znovu
  const three = computeProgress([s(mon, 10), s(addDays(mon, 4), 10)], addDays(mon, 4));
  assert.equal(three.streak, 1);
  assert.equal(three.statusByDate[localDateString(addDays(mon, 3))], 'missed');
});

test('nový týden má zase 2 dny volna', () => {
  const sat = new Date(2026, 10, 7, 18);
  // Čt a Pá volno (2 v týdnu), So cvičí, Ne cvičí, Po a Út volno (2 nového týdne), St cvičí
  const list = [s(addDays(sat, -3), 10), s(sat, 10), s(addDays(sat, 1), 10), s(addDays(sat, 4), 10)];
  const p = computeProgress(list, addDays(sat, 4));
  assert.equal(p.streak, 4);
});

test('XP: minuta = 1 XP, strop 30 za den, +20 za cíl', () => {
  assert.equal(computeProgress([s(WED, 10)], WED).xp, 10);
  assert.equal(computeProgress([s(WED, 15)], WED).xp, 15 + 20);
  assert.equal(computeProgress([s(WED, 90)], WED).xp, 30 + 20);
  assert.equal(computeProgress([s(WED, 10, 10)], WED).xp, 10 + 20, 'cíl 10 minut');
});

test('XP: dvě cvičení za den se sčítají', () => {
  assert.equal(computeProgress([s(WED, 8), s(WED, 8)], WED).xp, 16 + 20);
});

test('XP: bonus +50 za 7 a 14 dní série', () => {
  const week = Array.from({ length: 7 }, (_, i) => s(day(i - 6), 10));
  assert.equal(computeProgress(week, WED).xp, 7 * 10 + 50);
  const two = Array.from({ length: 14 }, (_, i) => s(day(i - 13), 10));
  assert.equal(computeProgress(two, WED).xp, 14 * 10 + 100);
});

test('cvičení v budoucnu (špatně nastavené hodiny) se nepočítá', () => {
  const p = computeProgress([s(day(2), 10)], WED);
  assert.equal(p.xp, 0);
});

test('série přežije změnu času (konec října)', () => {
  const list = Array.from({ length: 5 }, (_, i) => s(new Date(2026, 9, 23 + i, 18), 10)); // 23.–27. 10.
  assert.equal(computeProgress(list, new Date(2026, 9, 27, 20)).streak, 5);
});

test('týden v kostce: Po–Ne se stavy', () => {
  const p = computeProgress([s(day(-2), 10), s(day(0), 10)], WED); // Po cvičí, Út volno, St cvičí
  const w = weekView(p, WED);
  assert.deepEqual(w.map((d) => d.status), ['done', 'rest', 'done', 'future', 'future', 'future', 'future']);
});

test('úrovně: 100, 250, 450, 700, 1000', () => {
  assert.deepEqual(levelFor(0), { level: 1, floorXp: 0, nextXp: 100 });
  assert.equal(levelFor(99).level, 1);
  assert.equal(levelFor(100).level, 2);
  assert.equal(levelFor(249).level, 2);
  assert.deepEqual(levelFor(340), { level: 3, floorXp: 250, nextXp: 450 });
  assert.equal(levelFor(700).level, 5);
  assert.equal(levelFor(1000).level, 6);
});

test('pravidla odpovídají schválené specifikaci', () => {
  assert.equal(RULES.practiceDayMinSec, 300);
  assert.equal(RULES.restDaysPerWeek, 2);
  assert.equal(RULES.defaultGoalMin, 15);
});
