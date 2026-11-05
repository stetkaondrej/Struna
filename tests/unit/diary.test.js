import { test } from 'node:test';
import assert from 'node:assert/strict';
import { firstWeekStart, groupByWeek, compareCandidates, daysApart, hasClipThisWeek, clipWeeks } from '../../js/logic/diary.js';
import { localDateString } from '../../js/logic/dates.js';

const clip = (id, date, title) => ({ id, date, title, createdAt: `${date}T18:00:00.000Z` });

test('týden 1 = týden prvního cvičení, nahrávky po týdnech od nejnovějšího', () => {
  const sessions = [{ date: '2026-11-04' }]; // středa
  const clips = [clip('a', '2026-11-05', 'Ode'), clip('b', '2026-11-18', 'Ode'), clip('c', '2026-11-19', 'Em')];
  const start = firstWeekStart(sessions, clips);
  assert.equal(localDateString(start), '2026-11-02'); // pondělí
  const g = groupByWeek(clips, start);
  assert.deepEqual(g.map((x) => x.weekNo), [3, 1]);
  assert.deepEqual(g[0].clips.map((c) => c.id), ['c', 'b'], 'nejnovější nahoře');
  assert.equal(localDateString(g[0].end), '2026-11-22');
  assert.deepEqual(groupByWeek(clips, null), []);
});

test('Tehdy a teď: stejná skladba s nejdelším odstupem', () => {
  const clips = [
    clip('1', '2026-11-02', 'Ode to Joy'), clip('2', '2026-11-09', 'Em akord'),
    clip('3', '2026-11-30', 'ode to joy!'), clip('4', '2026-11-16', 'Em akord'),
  ];
  const p = compareCandidates(clips);
  assert.equal(p.before.id, '1');
  assert.equal(p.after.id, '3');
  assert.equal(p.sameSong, true);
  assert.equal(daysApart(p), 28);
});

test('Tehdy a teď bez opakované skladby: první a poslední nahrávka; s jednou nahrávkou nic', () => {
  const p = compareCandidates([clip('1', '2026-11-02', 'A'), clip('2', '2026-11-09', 'B'), clip('3', '2026-11-05', 'C')]);
  assert.deepEqual([p.before.id, p.after.id, p.sameSong], ['1', '2', false]);
  assert.equal(compareCandidates([clip('1', '2026-11-02', 'A')]), null);
});

test('připomínka: je tento týden nahrávka? a počet týdnů s nahrávkou', () => {
  const clips = [clip('1', '2026-11-02', 'A'), clip('2', '2026-11-04', 'B'), clip('3', '2026-11-12', 'C')];
  assert.equal(hasClipThisWeek(clips, new Date(2026, 10, 13)), true);
  assert.equal(hasClipThisWeek(clips, new Date(2026, 10, 17)), false);
  assert.equal(clipWeeks(clips), 2);
});
