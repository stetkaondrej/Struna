import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STICKERS, stickerFacts, evaluateStickers } from '../../js/logic/stickers.js';
import { TEXTS } from '../../js/i18n.js';

const base = {
  progress: { totalSec: 0, bestStreak: 0 }, sessions: [], missions: [], journal: [],
  clips: 0, reports: 0, chordProgress: {}, worldsDone: [],
};

test('21 samolepek s názvem a nápovědou v obou jazycích', () => {
  assert.equal(STICKERS.length, 21);
  assert.equal(new Set(STICKERS.map((s) => s.id)).size, 21);
  for (const s of STICKERS) {
    for (const lang of ['cs', 'en']) {
      assert.ok(TEXTS[lang][`sticker.${s.id}`], `${lang} název ${s.id}`);
      assert.ok(TEXTS[lang][`sticker.${s.id}.hint`], `${lang} nápověda ${s.id}`);
    }
  }
});

test('bez dat žádná samolepka', () => {
  assert.equal(evaluateStickers(stickerFacts(base)).earned.size, 0);
});

test('samolepky podle dat', () => {
  const facts = stickerFacts({
    ...base,
    progress: { totalSec: 120 * 60, bestStreak: 7 },
    sessions: [{}],
    missions: [{ quests: [{ done: true }, { done: true }, { done: true }] }, { quests: [{ done: true }, { done: false }] }],
    journal: [{}], clips: 1, reports: 0,
    chordProgress: { Em: { stars: 3 }, Am: { stars: 2 } },
    worldsDone: [1],
  });
  const { earned } = evaluateStickers(facts);
  assert.deepEqual([...earned].sort(), ['chord3', 'clip1', 'journal1', 'min100', 'mission1', 'practice1', 'streak3', 'streak7', 'world1'].sort());
});

test('jednou získaná samolepka zůstane a nově získané se poznají', () => {
  const { earned, fresh } = evaluateStickers(stickerFacts({ ...base, sessions: [{}] }), { clip1: '2026-11-01' });
  assert.ok(earned.has('clip1'), 'nahrávka smazaná, samolepka zůstává');
  assert.deepEqual(fresh, ['practice1']);
});
