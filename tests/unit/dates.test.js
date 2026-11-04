import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localDateString, daysBetween } from '../../js/logic/dates.js';

test('místní datum s nulami na začátku', () => {
  assert.equal(localDateString(new Date(2026, 0, 5)), '2026-01-05');
});

test('cvičení těsně před půlnocí patří ke správnému dni', () => {
  assert.equal(localDateString(new Date(2026, 10, 4, 23, 59)), '2026-11-04');
  assert.equal(localDateString(new Date(2026, 10, 5, 0, 1)), '2026-11-05');
});

test('počet dní mezi daty, i přes změnu času', () => {
  assert.equal(daysBetween(new Date(2026, 10, 4, 23, 0), new Date(2026, 10, 5, 1, 0)), 1);
  assert.equal(daysBetween(new Date(2026, 2, 28, 12), new Date(2026, 2, 30, 12)), 2); // přechod na letní čas
  assert.equal(daysBetween(new Date(2026, 9, 24, 12), new Date(2026, 9, 26, 12)), 2); // přechod na zimní čas
  assert.equal(daysBetween(new Date(2026, 10, 4), new Date(2026, 10, 4, 22)), 0);
});
