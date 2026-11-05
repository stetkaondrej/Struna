// Album samolepek. Samolepky se počítají z historie (D-008).
// Jednou získaná samolepka zůstává (stickersSeen), i kdyby se např. smazala nahrávka.

export const STICKERS = [
  { id: 'practice1', emoji: '🎸', test: (d) => d.sessions > 0 },
  { id: 'min100', emoji: '⏱️', test: (d) => d.minutes >= 100 },
  { id: 'min500', emoji: '🕐', test: (d) => d.minutes >= 500 },
  { id: 'min1000', emoji: '🏆', test: (d) => d.minutes >= 1000 },
  { id: 'streak3', emoji: '🔥', test: (d) => d.bestStreak >= 3 },
  { id: 'streak7', emoji: '🌟', test: (d) => d.bestStreak >= 7 },
  { id: 'streak30', emoji: '💎', test: (d) => d.bestStreak >= 30 },
  { id: 'mission1', emoji: '✅', test: (d) => d.missionsDone >= 1 },
  { id: 'mission10', emoji: '🎯', test: (d) => d.missionsDone >= 10 },
  { id: 'chord3', emoji: '⭐', test: (d) => d.chordsThreeStars >= 1 },
  { id: 'chords3x3', emoji: '🌈', test: (d) => d.chordsThreeStars >= 3 },
  { id: 'journal1', emoji: '📝', test: (d) => d.journal > 0 },
  { id: 'clip1', emoji: '🎙️', test: (d) => d.clips > 0 },
  { id: 'report1', emoji: '📨', test: (d) => d.reports > 0 },
  { id: 'rhythm', emoji: '🥁', test: (d) => d.metronomeDays >= 5 },
  { id: 'fastFingers', emoji: '⚡', test: (d) => d.bestChanges >= 20 },
  ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({
    id: `world${n}`, world: n, emoji: ['🏕️', '🛣️', '🐸', '🌲', '🌊', '🏜️', '🎤'][n - 1], test: (d) => d.worldsDone.includes(n),
  })),
];

// Souhrn dat potřebných pro samolepky (z různých částí aplikace).
export function stickerFacts({ progress, sessions, missions, journal, clips, reports, chordProgress, worldsDone, metronomeDays = 0, bestChanges = 0 }) {
  return {
    sessions: sessions.length,
    minutes: Math.floor(progress.totalSec / 60),
    bestStreak: progress.bestStreak,
    missionsDone: missions.filter((m) => m.quests.length && m.quests.every((q) => q.done)).length,
    chordsThreeStars: Object.values(chordProgress ?? {}).filter((c) => c.stars === 3).length,
    journal: journal.length,
    clips,
    reports,
    worldsDone,
    metronomeDays,
    bestChanges,
  };
}

// Vrátí { earned: Set, fresh: [id] } — fresh = nově získané, ještě neukázané.
export function evaluateStickers(facts, seen = {}) {
  const earned = new Set(STICKERS.filter((s) => seen[s.id] || s.test(facts)).map((s) => s.id));
  const fresh = [...earned].filter((id) => !seen[id]);
  return { earned, fresh };
}
