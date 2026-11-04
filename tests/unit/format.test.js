import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSnapshot, validateBackup, parseBackupText, backupFileName, hasOnlyKnownStores } from '../../js/storage/format.js';
import { CURRENT_SCHEMA } from '../../js/storage/migrations.js';

const good = () => buildSnapshot({
  schemaVersion: CURRENT_SCHEMA, appVersion: '0.1.0',
  stores: { kv: [['testCounter', 3], ['settings', { lang: 'en' }]] },
  now: new Date('2026-11-04T19:00:00Z'),
});

test('platná záloha projde a přežije převod na text a zpět', () => {
  const parsed = parseBackupText(JSON.stringify(good()));
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.snapshot, good());
});

test('cizí nebo poškozený soubor se odmítne', () => {
  assert.deepEqual(parseBackupText('tohle není json'), { ok: false, error: 'invalid' });
  assert.equal(validateBackup(null).ok, false);
  assert.equal(validateBackup({ ...good(), app: 'jina-aplikace' }).ok, false);
  assert.equal(validateBackup({ ...good(), schemaVersion: -1 }).ok, false);
  assert.equal(validateBackup({ ...good(), schemaVersion: 1.5 }).ok, false);
  assert.equal(validateBackup({ ...good(), stores: [] }).ok, false);
  assert.equal(validateBackup({ ...good(), stores: { kv: 'x' } }).ok, false);
  assert.equal(validateBackup({ ...good(), stores: { kv: [['a']] } }).ok, false);
  assert.equal(validateBackup({ ...good(), stores: { kv: [[{}, 1]] } }).ok, false);
});

test('záloha z novější verze má vlastní chybu', () => {
  assert.deepEqual(validateBackup({ ...good(), schemaVersion: CURRENT_SCHEMA + 1 }), { ok: false, error: 'newer' });
});

test('neznámá úložiště se poznají', () => {
  assert.equal(hasOnlyKnownStores(good()), true);
  assert.equal(hasOnlyKnownStores({ stores: { kv: [], cizi: [] } }), false);
});

test('název souboru zálohy podle jazyka a místního data', () => {
  const d = new Date(2026, 10, 4, 23, 30); // 4. 11. 2026 ve 23:30 místního času
  assert.equal(backupFileName(d, 'cs'), 'struna-zaloha-2026-11-04.json');
  assert.equal(backupFileName(d, 'en'), 'struna-backup-2026-11-04.json');
});
