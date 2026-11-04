import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as timer from '../../js/logic/timer.js';
import { localDateString } from '../../js/logic/dates.js';

const at = (min, sec = 0) => new Date(2026, 10, 4, 17, min, sec);
const dateOf = localDateString;

test('čas běží od startu a pauza ho zastaví', () => {
  let a = timer.start(at(0));
  assert.equal(timer.elapsedSec(a, at(5)), 300);
  a = timer.pause(a, at(5));
  assert.equal(timer.elapsedSec(a, at(20)), 300, 'během pauzy čas neběží');
  a = timer.resume(a, at(20));
  assert.equal(timer.elapsedSec(a, at(22)), 420);
});

test('čas se dopočítá i po uspání aplikace (žádné tikání)', () => {
  const a = timer.start(at(0));
  const restored = JSON.parse(JSON.stringify(a)); // jako po uložení a načtení
  assert.equal(timer.elapsedSec(restored, at(12, 30)), 750);
});

test('cvičení kratší než minuta se neuloží', () => {
  const a = timer.start(at(0));
  assert.equal(timer.finish(a, { now: at(0, 59), goalMin: 15, dateOf }), null);
  const s = timer.finish(a, { now: at(1), goalMin: 15, dateOf });
  assert.equal(s.seconds, 60);
  assert.equal(s.date, '2026-11-04');
  assert.equal(s.goalMin, 15);
});

test('cvičení přes půlnoc patří ke dni začátku', () => {
  const a = timer.start(new Date(2026, 10, 4, 23, 55));
  const s = timer.finish(a, { now: new Date(2026, 10, 5, 0, 10), goalMin: 15, dateOf });
  assert.equal(s.date, '2026-11-04');
  assert.equal(s.seconds, 15 * 60);
});

test('po hodině se aplikace zeptá a „uložit hodinu“ ořízne čas', () => {
  let a = timer.start(at(0));
  assert.equal(timer.needsCheck(a, new Date(+at(0) + 59 * 60000)), false);
  const later = new Date(+at(0) + 61 * 60000);
  assert.equal(timer.needsCheck(a, later), true);
  assert.equal(timer.finish(a, { now: later, goalMin: 15, capSec: 3600, dateOf }).seconds, 3600);
  a = timer.confirmStillPracticing(a, later);
  assert.equal(timer.needsCheck(a, new Date(+at(0) + 100 * 60000)), false);
  assert.equal(timer.needsCheck(a, new Date(+at(0) + 122 * 60000)), true);
});

test('pozastavený časovač se nikdy neptá', () => {
  const a = timer.pause(timer.start(at(0)), new Date(+at(0) + 70 * 60000));
  assert.equal(timer.needsCheck(a, new Date(+at(0) + 200 * 60000)), false);
});

test('zobrazení času', () => {
  assert.equal(timer.formatClock(0), '00:00');
  assert.equal(timer.formatClock(125), '02:05');
  assert.equal(timer.formatClock(3725), '1:02:05');
});
