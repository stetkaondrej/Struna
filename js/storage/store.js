// Jediné místo, přes které aplikace čte a ukládá data.
import * as db from './db.js';
import { META_STORE } from './schema.js';
import { CURRENT_SCHEMA, migrate } from './migrations.js';
import { buildSnapshot, parseBackupText, hasOnlyKnownStores, backupFileName } from './format.js';
import { VERSION } from '../version.js';

const DEFAULT_SETTINGS = { lang: 'cs', dailyGoalMin: 15, sounds: true };
const DEFAULT_PROFILE = { nickname: '', avatar: null, onboardedAt: null };

// Spustí se při startu aplikace: otevře databázi a případně převede data na nový tvar.
export async function init() {
  await db.openDB();
  const version = await db.get(META_STORE, 'schemaVersion');
  if (version === undefined) {
    // Nová instalace projde všemi migracemi od nuly, takže má stejná výchozí data jako aktualizace.
    await db.writeSnapshot(migrate({ schemaVersion: 0, stores: {} }));
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

// Všechny záznamy z jednoho úložiště.
async function listAll(store) {
  return (await db.readStores([store]))[store].map(([, value]) => value);
}

// --- Cvičení ---
export const listSessions = () => listAll('sessions');

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

// --- Profil (přezdívka a avatar zůstávají jen v telefonu, D-006) ---
export async function getProfile() {
  return { ...DEFAULT_PROFILE, ...((await db.get('kv', 'profile')) ?? {}) };
}

export async function setProfile(patch) {
  return db.update('kv', 'profile', (p) => ({ ...DEFAULT_PROFILE, ...(p ?? {}), ...patch }));
}

// --- Akordy: hvězdičky a „učím se“ ---
export async function getChordProgress() {
  return (await db.get('kv', 'chords')) ?? {};
}

export async function setChordProgress(chordId, patch) {
  return db.update('kv', 'chords', (all) => {
    const current = all ?? {};
    return { ...current, [chordId]: { stars: 0, learning: false, ...current[chordId], ...patch } };
  });
}

// --- Denní mise ---
export const listMissions = () => listAll('missions');

// Vrátí misi dne. Když ještě neexistuje, uloží „built“, takže se během dne nemění.
export async function getOrCreateMission(date, built) {
  return db.update('missions', date, (existing) => existing ?? built);
}

export async function toggleQuest(date, questId) {
  return db.update('missions', date, (m) => ({
    ...m,
    quests: m.quests.map((q) => (q.id === questId ? { ...q, done: !q.done } : q)),
  }));
}

// Nový domácí úkol nahradí v dnešní misi rozcvičku (nebo starý domácí úkol), pokud ještě není odškrtnutý.
// Vrací true, když se dnešní mise změnila.
export async function putHomeworkIntoMission(date, quest) {
  let changed = false;
  const existing = await db.get('missions', date);
  if (!existing) return false;
  await db.update('missions', date, (m) => ({
    ...m,
    quests: m.quests.map((q) => {
      if (q.id === 'q1' && !q.done && (q.type === 'warmup' || q.type === 'homework')) { changed = true; return quest; }
      return q;
    }),
  }));
  return changed;
}

// --- Domácí úkoly ---
export const listHomework = () => listAll('homework');

export async function addHomework({ lessonDate, text }) {
  const now = new Date().toISOString();
  const item = { id: now, lessonDate, text, createdAt: now, doneAt: null };
  await db.put('homework', item.id, item);
  return item;
}

export async function completeHomework(id) {
  return db.update('homework', id, (h) => ({ ...h, doneAt: new Date().toISOString() }));
}

// --- Deník ---
export const listJournal = () => listAll('journal');

export async function addJournal({ date, learned, stuck, feeling }) {
  const now = new Date().toISOString();
  const entry = { id: now, date, learned, stuck, feeling, createdAt: now };
  await db.put('journal', entry.id, entry);
  return entry;
}

// Vše, co potřebuje výpočet bodů a série (js/logic/progress.js).
export async function loadProgressData() {
  const [sessions, missions, journal] = await Promise.all([listSessions(), listMissions(), listJournal()]);
  return { sessions, missions, journal };
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
