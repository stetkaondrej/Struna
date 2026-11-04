import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrate, CURRENT_SCHEMA, _steps } from '../../js/storage/migrations.js';

test('každá verze dat má svůj migrační krok', () => {
  for (let v = 1; v <= CURRENT_SCHEMA; v++) assert.equal(typeof _steps[v], 'function', `chybí krok ${v}`);
});

test('migrace 0 → 1 přidá úložiště kv a zachová data', () => {
  const out = migrate({ app: 'struna', schemaVersion: 0, stores: {} }, 1);
  assert.equal(out.schemaVersion, 1);
  assert.deepEqual(out.stores.kv, []);

  const keep = migrate({ app: 'struna', schemaVersion: 0, stores: { kv: [['testCounter', 5]] } }, 1);
  assert.deepEqual(keep.stores.kv, [['testCounter', 5]]);
});

test('aktuální data se nemění', () => {
  const snap = { app: 'struna', schemaVersion: CURRENT_SCHEMA, stores: { kv: [['a', 1]] } };
  assert.deepEqual(migrate(snap), snap);
});

test('migrace nemění původní objekt', () => {
  const snap = { app: 'struna', schemaVersion: 0, stores: {} };
  migrate(snap);
  assert.deepEqual(snap, { app: 'struna', schemaVersion: 0, stores: {} });
});

test('data z novější verze aplikace se odmítnou', () => {
  assert.throws(() => migrate({ schemaVersion: CURRENT_SCHEMA + 1, stores: {} }), /DATA_NEWER/);
});

test('migrace 1 → 2 smaže testovací počitadlo, ostatní nechá a přidá cvičení', () => {
  const v1 = { app: 'struna', schemaVersion: 1, stores: { kv: [['testCounter', 5], ['settings', { lang: 'en' }]] } };
  const out = migrate(v1, 2);
  assert.equal(out.schemaVersion, 2);
  assert.deepEqual(out.stores.kv, [['settings', { lang: 'en' }]]);
  assert.deepEqual(out.stores.sessions, []);
});

test('záloha z verze 0.1.0 (data verze 1) jde převést na aktuální', () => {
  const backup010 = { app: 'struna', schemaVersion: 1, appVersion: '0.1.0', exportedAt: '2026-11-04T20:00:00.000Z',
    stores: { kv: [['testCounter', 3]] } };
  const out = migrate(backup010);
  assert.equal(out.schemaVersion, CURRENT_SCHEMA);
  assert.deepEqual(out.stores.sessions, []);
  assert.ok(!out.stores.kv.some(([k]) => k === 'testCounter'));
});

test('migrace 2 → 3 přidá mise, úkoly, deník a výchozí akordy Em a Am', () => {
  const v2 = { app: 'struna', schemaVersion: 2, stores: { kv: [['settings', { lang: 'cs' }]], sessions: [['a', { seconds: 60 }]] } };
  const out = migrate(v2, 3);
  assert.equal(out.schemaVersion, 3);
  assert.deepEqual(out.stores.sessions, [['a', { seconds: 60 }]]);
  assert.deepEqual(out.stores.missions, []);
  assert.deepEqual(out.stores.homework, []);
  assert.deepEqual(out.stores.journal, []);
  assert.deepEqual(out.stores.kv.find(([k]) => k === 'chords')[1], { Em: { stars: 0, learning: true }, Am: { stars: 0, learning: true } });
});

test('migrace 2 → 3 nepřepíše existující pokrok v akordech', () => {
  const mine = { G: { stars: 2, learning: true } };
  const out = migrate({ app: 'struna', schemaVersion: 2, stores: { kv: [['chords', mine]], sessions: [] } }, 3);
  assert.deepEqual(out.stores.kv, [['chords', mine]]);
});

test('migrace 3 → 4 přidá prázdný profil a zapne zvuky, nastavení zachová', () => {
  const v3 = { app: 'struna', schemaVersion: 3, stores: {
    kv: [['settings', { lang: 'en', dailyGoalMin: 10 }]], sessions: [], missions: [], homework: [], journal: [] } };
  const out = migrate(v3);
  assert.equal(out.schemaVersion, 4);
  const kv = Object.fromEntries(out.stores.kv);
  assert.deepEqual(kv.settings, { lang: 'en', dailyGoalMin: 10, sounds: true });
  assert.deepEqual(kv.profile, { nickname: '', avatar: null, onboardedAt: null });
});

test('migrace 3 → 4 nepřepíše existující profil ani vypnuté zvuky', () => {
  const profile = { nickname: 'Kytaristko', avatar: 'fox', onboardedAt: '2026-11-05T10:00:00Z' };
  const out = migrate({ app: 'struna', schemaVersion: 3, stores: {
    kv: [['profile', profile], ['settings', { lang: 'cs', sounds: false }]], sessions: [], missions: [], homework: [], journal: [] } });
  const kv = Object.fromEntries(out.stores.kv);
  assert.deepEqual(kv.profile, profile);
  assert.equal(kv.settings.sounds, false);
});

test('nová instalace (od nuly) má výchozí nastavení, profil i akordy', () => {
  const out = migrate({ schemaVersion: 0, stores: {} });
  const kv = Object.fromEntries(out.stores.kv);
  assert.deepEqual(kv.settings, { lang: 'cs', dailyGoalMin: 15, sounds: true });
  assert.equal(kv.profile.onboardedAt, null);
  assert.ok(kv.chords.Em.learning);
});
