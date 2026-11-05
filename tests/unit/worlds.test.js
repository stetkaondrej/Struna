import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { worldStates, chordsBossMet, worldsXpByDate, nextString, EMPTY_WORLDS } from '../../js/logic/worlds.js';
import { computeProgress } from '../../js/logic/progress.js';

const { worlds } = JSON.parse(readFileSync('content/worlds.json', 'utf8'));
const allLessons = (n) => Object.fromEntries(worlds.find((w) => w.id === n).lessons.map((l) => [l.id, '2026-11-05']));

test('obsah: 7 světů v pořadí učitele, lekce a výzvy v obou jazycích', () => {
  assert.deepEqual(worlds.map((w) => w.cs.name), ['Kytarový tábor', 'Strunová ulice', 'Rybníček prvních tónů', 'Akordový les', 'Řeka rytmu', 'Kaňon přechodů', 'Velké pódium']);
  const ids = new Set();
  for (const w of worlds) {
    assert.ok(w.emoji && w.cs.name && w.en.name, `svět ${w.id}`);
    assert.ok(['confirm', 'quiz', 'chords', 'record', 'metronome', 'changes'].includes(w.boss.type), `výzva ${w.id}`);
    for (const lang of ['cs', 'en']) assert.ok(w.boss[lang].title && w.boss[lang].text, `výzva ${w.id} ${lang}`);
    for (const l of w.lessons) {
      assert.ok(!ids.has(l.id), `duplicitní lekce ${l.id}`);
      ids.add(l.id);
      for (const lang of ['cs', 'en']) assert.ok(l[lang].title && l[lang].text, `${l.id} ${lang}`);
    }
  }
});

test('na začátku je svět 1 „právě tady“, ostatní zamčené', () => {
  const s = worldStates(worlds, EMPTY_WORLDS);
  assert.deepEqual(s.map((x) => x.status), ['current', 'locked', 'locked', 'locked', 'locked', 'locked', 'locked']);
  assert.equal(s[0].bossAvailable, false);
});

test('výzva se odemkne po všech lekcích, po výzvě se odemkne další svět', () => {
  let p = { ...EMPTY_WORLDS, lessons: allLessons(1) };
  assert.equal(worldStates(worlds, p)[0].bossAvailable, true);
  p = { ...p, bosses: { 1: '2026-11-05' } };
  const s = worldStates(worlds, p);
  assert.equal(s[0].status, 'done');
  assert.equal(s[1].status, 'current');
  assert.equal(s[2].status, 'locked');
});

test('rodič může svět přeskočit (bez XP)', () => {
  const p = { ...EMPTY_WORLDS, skipped: [1, 2] };
  const s = worldStates(worlds, p);
  assert.deepEqual(s.slice(0, 3).map((x) => x.status), ['done', 'done', 'current']);
  assert.deepEqual(worldsXpByDate(p), {});
});

test('výzva Akordového lesa: 3 akordy s ★★ a víc', () => {
  const boss = worlds.find((w) => w.id === 4).boss;
  assert.equal(chordsBossMet(boss, { Em: { stars: 3 }, Am: { stars: 2 } }), false);
  assert.equal(chordsBossMet(boss, { Em: { stars: 3 }, Am: { stars: 2 }, E: { stars: 2 } }), true);
  assert.equal(chordsBossMet(boss, { Em: { stars: 1 }, Am: { stars: 1 }, E: { stars: 1 } }), false);
});

test('XP z mapy: +5 za lekci, +100 za výzvu, započítané do celkových XP', () => {
  const p = { ...EMPTY_WORLDS, lessons: allLessons(1), bosses: { 1: '2026-11-05' } };
  assert.deepEqual(worldsXpByDate(p), { '2026-11-05': 4 * 5 + 100 });
  assert.equal(computeProgress([], new Date(2026, 10, 5, 20), { worlds: p }).xp, 120);
  assert.equal(computeProgress([], new Date(2026, 10, 5, 20), { worlds: p }).streak, 0, 'mapa nedělá sérii');
});

test('hra Která struna?: nikdy stejná struna dvakrát za sebou', () => {
  let prev = -1;
  const seq = [0, 0, 0.5, 0.5, 0.99, 0.1];
  let i = 0;
  const rnd = () => seq[i++ % seq.length];
  for (let k = 0; k < 4; k++) {
    const n = nextString(prev, rnd);
    assert.ok(n >= 0 && n <= 5);
    assert.notEqual(n, prev);
    prev = n;
  }
});
