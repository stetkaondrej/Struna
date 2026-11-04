// Migrace = převod uložených dat ze starého tvaru na nový.
//
// Pravidla:
// 1. Existující krok NIKDY neměň. Vždy přidej nový krok s dalším číslem.
// 2. Krok N dostane snapshot ve verzi N-1 a vrátí ho ve verzi N.
// 3. Ke každému kroku napiš test v tests/unit/migrations.test.js.

export const CURRENT_SCHEMA = 2;

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
