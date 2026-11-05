import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { baseFret, barreOf, chordDiagram } from '../../js/chord-diagram.js';

const { chords } = JSON.parse(readFileSync('content/chords.json', 'utf8'));
const byId = (id) => chords.find((c) => c.id === id);

test('akordy u hlavy kytary začínají 1. pražcem, barré Cm a Gm 3. pražcem', () => {
  for (const id of ['Em', 'Am', 'E', 'A', 'D', 'G', 'C']) assert.equal(baseFret(byId(id)), 1, id);
  assert.equal(baseFret(byId('Cm')), 3);
  assert.equal(baseFret(byId('Gm')), 3);
});

test('barré: Gm přes všech 6 strun, Cm přes struny A až e, ostatní bez barré', () => {
  assert.deepEqual(barreOf(byId('Gm')), { fret: 3, from: 0, to: 5 });
  assert.deepEqual(barreOf(byId('Cm')), { fret: 3, from: 1, to: 5 });
  for (const id of ['Em', 'Am', 'E', 'A', 'D', 'G', 'C']) assert.equal(barreOf(byId(id)), null, id);
});

test('každý zahraný tón leží uvnitř nakresleného rozsahu (4 pražce)', () => {
  for (const c of chords) {
    const base = baseFret(c);
    for (const f of c.frets.filter((x) => x > 0)) assert.ok(f >= base && f < base + 4, `${c.id}: pražec ${f} mimo diagram od ${base}`);
  }
});

test('diagram barré akordu má pruh a číslo pražce, obyčejný akord ne', () => {
  const gm = chordDiagram(byId('Gm'));
  assert.match(gm, /class="barre"/);
  assert.match(gm, /class="base-fret"[^>]*>3</);
  const em = chordDiagram(byId('Em'));
  assert.doesNotMatch(em, /class="barre"|class="base-fret"/);
});

test('číslo pražce se vejde do obrázku (není oříznuté vlevo)', () => {
  for (const width of [96, 200, 230]) {
    const svg = chordDiagram(byId('Gm'), { width });
    const x = Number(svg.match(/class="base-fret" x="([\d.]+)"/)[1]);
    const size = Number(svg.match(/class="base-fret"[^>]*font-size="([\d.]+)"/)[1]);
    assert.ok(x - size * 0.7 >= 0, `šířka ${width}: číslo začíná na ${x - size * 0.7}`);
  }
});
