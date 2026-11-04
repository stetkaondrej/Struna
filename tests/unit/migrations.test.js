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
  const out = migrate(v1);
  assert.equal(out.schemaVersion, 2);
  assert.deepEqual(out.stores.kv, [['settings', { lang: 'en' }]]);
  assert.deepEqual(out.stores.sessions, []);
});

test('záloha z verze 0.1.0 (data verze 1) jde převést na aktuální', () => {
  const backup010 = { app: 'struna', schemaVersion: 1, appVersion: '0.1.0', exportedAt: '2026-11-04T20:00:00.000Z',
    stores: { kv: [['testCounter', 3]] } };
  const out = migrate(backup010);
  assert.equal(out.schemaVersion, CURRENT_SCHEMA);
  assert.deepEqual(out.stores, { kv: [], sessions: [] });
});
