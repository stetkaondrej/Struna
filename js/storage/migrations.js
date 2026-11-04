// Migrace = převod uložených dat ze starého tvaru na nový.
//
// Pravidla:
// 1. Existující krok NIKDY neměň. Vždy přidej nový krok s dalším číslem.
// 2. Krok N dostane snapshot ve verzi N-1 a vrátí ho ve verzi N.
// 3. Ke každému kroku napiš test v tests/unit/migrations.test.js.

export const CURRENT_SCHEMA = 5;

const STEPS = {
  // 0 → 1: první verze dat. Zajistí, že existuje úložiště kv.
  1: (s) => ({ ...s, stores: { ...s.stores, kv: s.stores?.kv ?? [] } }),

  // 1 → 2 (krok 1): smaže testovací počitadlo z kroku 0 a přidá úložiště cvičení.
  2: (s) => ({
    ...s,
    stores: {
      ...s.stores,
      kv: (s.stores.kv ?? []).filter(([key]) => key !== 'testCounter'),
      sessions: s.stores.sessions ?? [],
    },
  }),

  // 2 → 3 (krok 2): úložiště pro mise, domácí úkoly a deník; výchozí akordy „učím se“ Em a Am.
  3: (s) => {
    const kv = s.stores.kv ?? [];
    const hasChords = kv.some(([key]) => key === 'chords');
    return {
      ...s,
      stores: {
        ...s.stores,
        kv: hasChords ? kv : [...kv, ['chords', { Em: { stars: 0, learning: true }, Am: { stars: 0, learning: true } }]],
        missions: s.stores.missions ?? [],
        homework: s.stores.homework ?? [],
        journal: s.stores.journal ?? [],
      },
    };
  },

  // 3 → 4 (krok 3): prázdný profil (přezdívka, avatar) a zapnuté zvuky.
  4: (s) => {
    let kv = s.stores.kv ?? [];
    if (!kv.some(([key]) => key === 'profile')) {
      kv = [...kv, ['profile', { nickname: '', avatar: null, onboardedAt: null }]];
    }
    const hasSettings = kv.some(([key]) => key === 'settings');
    kv = hasSettings
      ? kv.map(([key, value]) => (key === 'settings' && value.sounds === undefined ? [key, { ...value, sounds: true }] : [key, value]))
      : [...kv, ['settings', { lang: 'cs', dailyGoalMin: 15, sounds: true }]];
    return { ...s, stores: { ...s.stores, kv } };
  },

  // 4 → 5 (krok 4a): úložiště odeslaných reportů pro učitele.
  5: (s) => ({ ...s, stores: { ...s.stores, reports: s.stores.reports ?? [] } }),
};

export function migrate(snapshot, target = CURRENT_SCHEMA) {
  let s = structuredClone(snapshot);
  let v = s.schemaVersion ?? 0;
  if (v > target) throw new Error('DATA_NEWER');
  while (v < target) {
    const step = STEPS[v + 1];
    if (!step) throw new Error(`MISSING_MIGRATION_${v + 1}`);
    s = step(s);
    v += 1;
    s.schemaVersion = v;
  }
  return s;
}

// Jen pro testy.
export const _steps = STEPS;
