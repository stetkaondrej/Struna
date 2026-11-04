// Denní mise: 3 úkoly na den. Čistá logika bez obrazovky.
// Stejný den a stejná data = vždy stejná mise (žádná náhoda).
import { parseLocalDate } from './dates.js';

export const QUEST_XP = 10;
export const ALL_DONE_BONUS = 10;
export const DEFAULT_LEARNING = ['Em', 'Am'];

// Pořadové číslo dne (pro střídání úkolů den po dni).
const dayNumber = (dateKey) => {
  const d = parseLocalDate(dateKey);
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
};

// Akordy, které se dcera učí, v pořadí z knihy akordů.
export function learningChords(chords, progress) {
  const list = chords.filter((c) => progress[c.id]?.learning).map((c) => c.id);
  return list.length ? list : DEFAULT_LEARNING.filter((id) => chords.some((c) => c.id === id));
}

export function activeHomework(homework) {
  return [...homework].filter((h) => !h.doneAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export function buildMission({ date, chords, chordProgress, homework }) {
  const n = dayNumber(date);
  const learning = learningChords(chords, chordProgress);
  const stars = (id) => chordProgress[id]?.stars ?? 0;
  const pick = (list, offset = 0) => list[(n + offset) % list.length];

  // 1: domácí úkol, jinak rozcvička
  const hw = activeHomework(homework);
  const q1 = hw
    ? { id: 'q1', type: 'homework', params: { homeworkId: hw.id, text: hw.text }, done: false }
    : { id: 'q1', type: 'warmup', params: {}, done: false };

  // 2: akord s nejméně hvězdičkami (při shodě se akordy střídají po dnech)
  const fewest = Math.min(...learning.map(stars));
  const weakest = learning.filter((id) => stars(id) === fewest);
  const q2 = { id: 'q2', type: 'chordHold', params: { chord: pick(weakest) }, done: false };

  // 3: přehazování dvou akordů, nebo brnkání; střídá se den po dni
  let q3;
  if (learning.length >= 2 && n % 2 === 0) {
    const i = n % learning.length;
    q3 = { id: 'q3', type: 'chordChange', params: { a: learning[i], b: learning[(i + 1) % learning.length] }, done: false };
  } else {
    q3 = { id: 'q3', type: 'strum', params: { chord: pick(learning, 1) }, done: false };
  }
  return { date, quests: [q1, q2, q3] };
}

export function missionXp(mission) {
  if (!mission) return 0;
  const done = mission.quests.filter((q) => q.done).length;
  return done * QUEST_XP + (done === mission.quests.length && done > 0 ? ALL_DONE_BONUS : 0);
}

// Doplní text úkolu: "Akord {chord}" → "Akord Am"
export function fillTemplate(text, params) {
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}
