// Formát záložního souboru. Čisté funkce bez prohlížeče, takže jdou testovat v Node.js.
import { DATA_STORES } from './schema.js';
import { CURRENT_SCHEMA } from './migrations.js';
import { localDateString } from '../logic/dates.js';

export const APP_ID = 'struna';

export function buildSnapshot({ schemaVersion, appVersion, stores, now = new Date() }) {
  return { app: APP_ID, schemaVersion, appVersion, exportedAt: now.toISOString(), stores };
}

const isKey = (k) => typeof k === 'string' || typeof k === 'number';

// Zkontroluje, že objekt je záloha Struny, kterou umíme načíst.
// Vrací { ok: true } nebo { ok: false, error: 'invalid' | 'newer' }.
export function validateBackup(obj) {
  const bad = { ok: false, error: 'invalid' };
  if (!obj || typeof obj !== 'object' || obj.app !== APP_ID) return bad;
  if (!Number.isInteger(obj.schemaVersion) || obj.schemaVersion < 0) return bad;
  if (obj.schemaVersion > CURRENT_SCHEMA) return { ok: false, error: 'newer' };
  if (!obj.stores || typeof obj.stores !== 'object' || Array.isArray(obj.stores)) return bad;
  for (const records of Object.values(obj.stores)) {
    if (!Array.isArray(records)) return bad;
    if (!records.every((r) => Array.isArray(r) && r.length === 2 && isKey(r[0]))) return bad;
  }
  return { ok: true };
}

// Po migraci smí záloha obsahovat jen úložiště, která aplikace zná.
export function hasOnlyKnownStores(snapshot) {
  return Object.keys(snapshot.stores).every((name) => DATA_STORES.includes(name));
}

export function parseBackupText(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    return { ok: false, error: 'invalid' };
  }
  const result = validateBackup(obj);
  return result.ok ? { ok: true, snapshot: obj } : result;
}

export function backupFileName(date = new Date(), lang = 'cs') {
  const prefix = lang === 'en' ? 'struna-backup-' : 'struna-zaloha-';
  return `${prefix}${localDateString(date)}.json`;
}
