// Kontrola obsahu (akordy, úkoly), aby překlep v JSON nerozbil aplikaci.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { chords } = JSON.parse(readFileSync('content/chords.json', 'utf8'));
const { quests } = JSON.parse(readFileSync('content/quests.json', 'utf8'));
const holes = (s) => (s.match(/\{\w+\}/g) ?? []).sort();

test('7 akordů v pořadí Akordového lesa', () => {
  assert.deepEqual(chords.map((c) => c.id), ['Em', 'Am', 'E', 'A', 'D', 'G', 'C']);
});

test('každý akord má 6 strun, platné pražce a prsty', () => {
  for (const c of chords) {
    assert.equal(c.frets.length, 6, c.id);
    assert.equal(c.fingers.length, 6, c.id);
    c.frets.forEach((f, i) => {
      assert.ok(Number.isInteger(f) && f >= -1 && f <= 5, `${c.id}: pražec ${f}`);
      const finger = c.fingers[i];
      if (f > 0) assert.ok(finger >= 1 && finger <= 4, `${c.id}: struna ${i + 1} potřebuje prst 1–4`);
      else assert.equal(finger, 0, `${c.id}: prázdná nebo nehraná struna nemá prst`);
    });
    for (const lang of ['cs', 'en']) {
      assert.ok(c[lang]?.label && c[lang]?.tip, `${c.id}: chybí text ${lang}`);
    }
  }
});

test('prstoklady odpovídají běžným tvarům pro začátečníky', () => {
  const shapes = Object.fromEntries(chords.map((c) => [c.id, c.frets.join(',')]));
  assert.deepEqual(shapes, {
    Em: '0,2,2,0,0,0', Am: '-1,0,2,2,1,0', E: '0,2,2,1,0,0', A: '-1,0,2,2,2,0',
    D: '-1,-1,0,2,3,2', G: '3,2,0,0,0,3', C: '-1,3,2,0,1,0',
  });
});

test('úkoly mise mají texty v obou jazycích se stejnými zástupnými místy', () => {
  for (const type of ['warmup', 'homework', 'chordHold', 'chordChange', 'strum']) {
    const q = quests[type];
    assert.ok(q, `chybí typ úkolu ${type}`);
    for (const field of ['title', 'text']) {
      assert.ok(q.cs[field] && q.en[field], `${type}.${field}`);
      assert.deepEqual(holes(q.en[field]), holes(q.cs[field]), `${type}.${field}`);
    }
  }
});
