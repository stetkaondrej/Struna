import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampBpm, eighthSec, position, PATTERNS, logRun, metronomeDays, EMPTY_METRONOME } from '../../js/logic/metronome.js';
import { pairKey, bestFor, bestOverall, changesXpByDate } from '../../js/logic/changes.js';
import { computeProgress } from '../../js/logic/progress.js';

test('tempo 40–160, výchozí 70', () => {
  assert.equal(clampBpm(20), 40);
  assert.equal(clampBpm(200), 160);
  assert.equal(clampBpm('abc'), 70);
  assert.equal(clampBpm(72.4), 72);
});

test('při tempu 60 trvá doba 1 s a osmina 0,5 s', () => {
  assert.equal(eighthSec(60), 0.5);
  assert.deepEqual(position(0, 60), { slot: 0, beat: 1, eighths: 0 });
  assert.deepEqual(position(1.2, 60), { slot: 2, beat: 2, eighths: 2 });
  assert.deepEqual(position(4.1, 60), { slot: 0, beat: 1, eighths: 8 }, 'nový takt po 4 dobách');
});

test('rytmus ↓ ↓ ↑ ↑ ↓ ↑ = 1 · 2 · 2a · 3a · 4 · 4a', () => {
  const p = PATTERNS.dduudu.slots;
  assert.deepEqual(Object.keys(p).map(Number), [0, 2, 3, 5, 6, 7]);
  assert.deepEqual(Object.values(p), ['down', 'down', 'up', 'up', 'down', 'up']);
  assert.deepEqual(Object.values(PATTERNS.down.slots), ['down', 'down', 'down', 'down']);
});

test('záznam běhů metronomu: dny a nejdelší běh v rytmu (výzva světa 5)', () => {
  let m = EMPTY_METRONOME;
  m = logRun(m, { date: '2026-11-05', seconds: 31, bpm: 70, pattern: 'dduudu' });
  m = logRun(m, { date: '2026-11-05', seconds: 90, bpm: 60, pattern: 'dduudu' }); // pomalé tempo se nepočítá do výzvy
  m = logRun(m, { date: '2026-11-06', seconds: 120, bpm: 80, pattern: 'down' }); // jiný rytmus se nepočítá do výzvy
  assert.equal(m.bestSteadySec, 31);
  assert.deepEqual(m.days, { '2026-11-05': 121, '2026-11-06': 120 });
  assert.equal(metronomeDays(m), 2);
  assert.equal(metronomeDays(logRun(EMPTY_METRONOME, { date: 'x', seconds: 59, bpm: 70, pattern: 'down' })), 0, 'den od 1 minuty');
});

test('výzva 1 minuta: dvojice bez ohledu na pořadí, rekordy', () => {
  const r = [
    { id: '1', date: '2026-11-05', a: 'Em', b: 'Am', count: 12 },
    { id: '2', date: '2026-11-05', a: 'Am', b: 'Em', count: 15 },
    { id: '3', date: '2026-11-05', a: 'G', b: 'C', count: 8 },
  ];
  assert.equal(pairKey('Em', 'Am'), pairKey('Am', 'Em'));
  assert.equal(bestFor(r, 'Em', 'Am'), 15);
  assert.equal(bestFor(r, 'D', 'G'), 0);
  assert.equal(bestOverall(r), 15);
});

test('body: +5 za pokus (max 3× denně), +10 za nový rekord', () => {
  const r = [
    { id: '1', date: 'd1', a: 'Em', b: 'Am', count: 10 }, // 5 + rekord 10
    { id: '2', date: 'd1', a: 'Em', b: 'Am', count: 9 },  // 5
    { id: '3', date: 'd1', a: 'Em', b: 'Am', count: 12 }, // 5 + rekord 10
    { id: '4', date: 'd1', a: 'Em', b: 'Am', count: 11 }, // 4. pokus: 0
    { id: '5', date: 'd2', a: 'G', b: 'C', count: 0 },    // 5, nula není rekord
  ];
  assert.deepEqual(changesXpByDate(r), { d1: 35, d2: 5 });
});

test('body z výzvy 1 minuta jsou v celkových XP', () => {
  const changes = [{ id: '1', date: '2026-11-05', a: 'Em', b: 'Am', count: 10 }];
  assert.equal(computeProgress([], new Date(2026, 10, 5, 20), { changes }).xp, 15);
});
