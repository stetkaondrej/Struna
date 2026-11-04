import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildMission, missionXp, learningChords, activeHomework, fillTemplate } from '../../js/logic/mission.js';

const { chords } = JSON.parse(readFileSync('content/chords.json', 'utf8'));
const base = { date: '2026-11-04', chords, chordProgress: {}, homework: [] };

test('bez domácího úkolu: rozcvička, akord, a výchozí akordy Em a Am', () => {
  const m = buildMission(base);
  assert.equal(m.quests.length, 3);
  assert.equal(m.quests[0].type, 'warmup');
  assert.ok(['Em', 'Am'].includes(m.quests[1].params.chord));
  assert.deepEqual(learningChords(chords, {}), ['Em', 'Am']);
});

test('domácí úkol je vždy první, dokud není splněný', () => {
  const homework = [
    { id: 'h1', text: 'Starý', createdAt: '2026-10-01T10:00:00Z', doneAt: '2026-10-05T10:00:00Z' },
    { id: 'h2', text: 'Ode to Joy, první řádek', createdAt: '2026-11-02T16:00:00Z', doneAt: null },
  ];
  const m = buildMission({ ...base, homework });
  assert.equal(m.quests[0].type, 'homework');
  assert.equal(m.quests[0].params.text, 'Ode to Joy, první řádek');
  assert.equal(activeHomework([homework[0]]), null);
});

test('úkol s akordem vybere ten, který jde nejhůř', () => {
  const chordProgress = { Em: { learning: true, stars: 3 }, Am: { learning: true, stars: 1 }, E: { learning: true, stars: 2 } };
  for (const date of ['2026-11-04', '2026-11-05', '2026-11-06']) {
    assert.equal(buildMission({ ...base, date, chordProgress }).quests[1].params.chord, 'Am');
  }
});

test('stejný den = stejná mise, třetí úkol se střídá po dnech', () => {
  assert.deepEqual(buildMission(base), buildMission(base));
  const types = ['2026-11-04', '2026-11-05'].map((date) => buildMission({ ...base, date }).quests[2].type).sort();
  assert.deepEqual(types, ['chordChange', 'strum']);
});

test('přehazování nikdy nespojí akord sám se sebou', () => {
  for (let d = 1; d <= 28; d++) {
    const m = buildMission({ ...base, date: `2026-02-${String(d).padStart(2, '0')}` });
    if (m.quests[2].type === 'chordChange') assert.notEqual(m.quests[2].params.a, m.quests[2].params.b);
  }
});

test('jediný akord „učím se“: místo přehazování brnkání', () => {
  const chordProgress = { Em: { learning: true, stars: 0 } };
  for (const date of ['2026-11-04', '2026-11-05']) {
    const q3 = buildMission({ ...base, date, chordProgress }).quests[2];
    assert.equal(q3.type, 'strum');
    assert.equal(q3.params.chord, 'Em');
  }
});

test('XP za misi: 10 za úkol, bonus 10 za všechny tři', () => {
  const m = buildMission(base);
  assert.equal(missionXp(m), 0);
  m.quests[0].done = true;
  assert.equal(missionXp(m), 10);
  m.quests.forEach((q) => { q.done = true; });
  assert.equal(missionXp(m), 40);
  assert.equal(missionXp(null), 0);
});

test('doplnění textu úkolu', () => {
  assert.equal(fillTemplate('Přehazování {a} ↔ {b}', { a: 'Em', b: 'Am' }), 'Přehazování Em ↔ Am');
});
