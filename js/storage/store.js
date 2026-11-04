// Jediné místo, přes které aplikace čte a ukládá data.
import * as db from './db.js';
import { META_STORE } from './schema.js';
import { CURRENT_SCHEMA, migrate } from './migrations.js';
import { buildSnapshot, parseBackupText, hasOnlyKnownStores, backupFileName } from './format.js';
import { VERSION } from '../version.js';

const DEFAULT_SETTINGS = { lang: 'cs', dailyGoalMin: 15 };

// Spustí se při startu aplikace: otevře databázi a případně převede data na nový tvar.
export async function init() {
  await db.openDB();
  const version = await db.get(META_STORE, 'schemaVersion');
  if (version === undefined) {
    await db.put(META_STORE, 'schemaVersion', CURRENT_SCHEMA);
    await db.put(META_STORE, 'createdAt', new Date().toISOString());
    return { fresh: true };
  }
  if (version > CURRENT_SCHEMA) throw new Error('DATA_NEWER');
  if (version < CURRENT_SCHEMA) {
    const before = await exportSnapshot(version);
    await db.put(META_STORE, 'preMigrationBackup', before); // pojistka před migrací
    await db.writeSnapshot(migrate(before));
    return { migratedFrom: version };
  }
  return {};
}

async function exportSnapshot(schemaVersion) {
  const v = schemaVersion ?? (await db.get(META_STORE, 'schemaVersion')) ?? CURRENT_SCHEMA;
  return buildSnapshot({ schemaVersion: v, appVersion: VERSION, stores: await db.readStores() });
}

// --- Nastavení ---
export async function getSettings() {
  return { ...DEFAULT_SETTINGS, ...((await db.get('kv', 'settings')) ?? {}) };
}

export async function setSetting(key, value) {
  return db.update('kv', 'settings', (s) => ({ ...DEFAULT_SETTINGS, ...(s ?? {}), [key]: value }));
}

// --- Cvičení ---
export async function listSessions() {
  return (await db.readStores(['sessions'])).sessions.map(([, value]) => value);
}

// Běžící (nebo pozastavený) časovač. Ukládá se, aby přežil zavření aplikace.
export async function getActiveSession() {
  return (await db.get('kv', 'activeSession')) ?? null;
}

export async function setActiveSession(active) {
  await db.put('kv', 'activeSession', active);
}

// Uloží cvičení a zároveň smaže běžící časovač, v jedné transakci.
export async function finishActiveSession(session) {
  await db.replace({ put: session ? [['sessions', session.id, session]] : [], remove: [['kv', 'activeSession']] });
}

// --- Zálohy ---
export async function getLastBackup() {
  const iso = await db.get(META_STORE, 'lastBackupAt');
  return iso ? new Date(iso) : null;
}

export async function markBackedUp(date = new Date()) {
  await db.put(META_STORE, 'lastBackupAt', date.toISOString());
}

export async function createBackupFile(lang) {
  const snapshot = await exportSnapshot();
  const text = JSON.stringify(snapshot, null, 2);
  return new File([text], backupFileName(new Date(), lang), { type: 'application/json' });
}

export async function readBackupFile(file) {
  let text;
  try {
    text = await file.text();
  } catch {
    return { ok: false, error: 'read' };
  }
  return parseBackupText(text);
}

export async function restoreBackup(snapshot) {
  const migrated = migrate(snapshot);
  if (!hasOnlyKnownStores(migrated)) throw new Error('UNKNOWN_STORES');
  await db.put(META_STORE, 'preRestoreBackup', await exportSnapshot()); // pojistka
  await db.writeSnapshot(migrated);
}

// --- Úložiště telefonu ---
export async function requestPersistence() {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export async function storageInfo() {
  try {
    const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : null;
    const estimate = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
    return { persisted, usage: estimate?.usage ?? null, quota: estimate?.quota ?? null };
  } catch {
    return { persisted: null, usage: null, quota: null };
  }
}
