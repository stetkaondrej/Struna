import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildWeekReport, reportText, weekRange } from '../../js/logic/report.js';
import { t, setLang } from '../../js/i18n.js';

const { chords } = JSON.parse(readFileSync('content/chords.json', 'utf8'));
const s = (date, minutes) => ({ id: date + minutes, date, startedAt: `${date}T16:00:00.000Z`, seconds: minutes * 60, goalMin: 15 });
const quests = (done) => [0, 1, 2].map((i) => ({ id: `q${i + 1}`, done: i < done }));

const data = {
  monday: new Date(2026, 10, 2), // Po 2. 11. 2026
  today: new Date(2026, 10, 9, 20),
  sessions: [s('2026-10-30', 20), s('2026-11-02', 15), s('2026-11-03', 10), s('2026-11-03', 5), s('2026-11-05', 20), s('2026-11-08', 24)],
  missions: [{ date: '2026-11-02', quests: quests(3) }, { date: '2026-11-03', quests: quests(1) }, { date: '2026-10-31', quests: quests(3) }],
  homework: [{ id: 'h', text: 'Ode to Joy, 1. řádek', lessonDate: '2026-11-02', createdAt: '2026-11-02T17:00:00Z', doneAt: '2026-11-06T17:00:00Z' }],
  journal: [
    { date: '2026-11-03', learned: 'Em bez koukání', stuck: '', feeling: 'great', createdAt: '2026-11-03T18:00:00Z' },
    { date: '2026-11-05', learned: '', stuck: 'C akord drnčí', feeling: 'meh', createdAt: '2026-11-05T18:00:00Z' },
    { date: '2026-11-10', learned: 'jiný týden', stuck: '', feeling: 'happy', createdAt: '2026-11-10T18:00:00Z' },
  ],
  chords,
  chordProgress: { Em: { learning: true, stars: 3 }, Am: { learning: true, stars: 2 }, C: { learning: false, stars: 0 } },
  clips: [{ title: 'Ode to Joy', seconds: 42, kind: 'audio' }],
};

test('týden je pondělí až neděle', () => {
  const w = weekRange(new Date(2026, 10, 5));
  assert.equal(w.startKey, '2026-11-02');
  assert.equal(w.endKey, '2026-11-08');
});

test('čísla týdne: jen cvičení z tohoto týdne', () => {
  const r = buildWeekReport(data);
  assert.equal(r.minutes, 74);
  assert.equal(r.days, 4);
  assert.equal(r.questsDone, 4);
  assert.equal(r.questsTotal, 6);
  assert.deepEqual(r.learned, ['Em bez koukání']);
  assert.deepEqual(r.stuck, ['C akord drnčí']);
  assert.deepEqual(r.feelings, ['great', 'meh']);
  assert.equal(r.homework.done, true);
  assert.deepEqual(r.chords.map((c) => c.id), ['Em', 'Am']);
});

test('domácí úkol splněný až po týdnu se v tomto týdnu ukáže jako rozpracovaný', () => {
  const hw = [{ ...data.homework[0], doneAt: '2026-11-12T10:00:00Z' }];
  assert.equal(buildWeekReport({ ...data, homework: hw }).homework.done, false);
});

test('text zprávy česky obsahuje všechny řádky', () => {
  setLang('cs');
  const text = reportText(buildWeekReport(data), { t, lang: 'cs', nickname: 'Kytaristka' });
  assert.match(text, /^🎸 Struna · Kytaristka · týden 2\. 11\.–8\. 11\./);
  assert.match(text, /⏱ 74 minut · 4 dní cvičení · série 🔥 \d+/);
  assert.match(text, /✅ Mise: 4 z 6 úkolů/);
  assert.match(text, /📝 Domácí úkol \(lekce 2\. 11\.\): Ode to Joy, 1\. řádek – splněno/);
  assert.match(text, /💡 Co jsem se naučila: Em bez koukání/);
  assert.match(text, /🤔 Kde jsem se zasekla: C akord drnčí/);
  assert.match(text, /🤩 😐/);
  assert.match(text, /🎼 Akordy: Em ★★★ · Am ★★☆/);
  assert.match(text, /🎙 Nahrávky \(1\): Ode to Joy \(0:42\)/);
  assert.doesNotMatch(text, /jiný týden/);
});

test('prázdný týden má srozumitelný text a anglická verze funguje', () => {
  const empty = buildWeekReport({ ...data, monday: new Date(2026, 9, 5), sessions: [], missions: [], journal: [], homework: [], clips: [], chordProgress: {} });
  setLang('en');
  const text = reportText(empty, { t, lang: 'en' });
  assert.match(text, /^🎸 Struna · week 5\/10–11\/10/);
  assert.match(text, /No practice this week yet\./);
  setLang('cs');
});
