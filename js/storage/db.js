// Nízkoúrovňová práce s IndexedDB (databáze v telefonu).
// Žádná obrazovka tento soubor nevolá přímo, jen přes store.js.
import { DB_NAME, DB_VERSION, DATA_STORES, LOCAL_STORES, META_STORE } from './schema.js';

let dbPromise;

export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of [...DATA_STORES, ...LOCAL_STORES, META_STORE]) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      // Když se otevře novější verze aplikace, starou spojení uvolníme.
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('DB_BLOCKED'));
  });
  dbPromise.catch(() => { dbPromise = undefined; });
  return dbPromise;
}

const asPromise = (req) => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const finished = (tx) => new Promise((resolve, reject) => {
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error || new Error('TX_ABORTED'));
});

export async function get(store, key) {
  const db = await openDB();
  return asPromise(db.transaction(store).objectStore(store).get(key));
}

export async function put(store, key, value) {
  const db = await openDB();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).put(value, key);
  return finished(tx);
}

// Přečte hodnotu, změní ji funkcí fn a uloží, vše v jedné transakci,
// takže se dvě rychlá klepnutí nikdy nepřepíšou.
export async function update(store, key, fn) {
  const db = await openDB();
  const tx = db.transaction(store, 'readwrite');
  const os = tx.objectStore(store);
  let next;
  const req = os.get(key);
  req.onsuccess = () => {
    next = fn(req.result);
    os.put(next, key);
  };
  await finished(tx);
  return next;
}

// Více zápisů a mazání najednou: buď se provede všechno, nebo nic.
export async function replace({ put: puts = [], remove = [] }) {
  const db = await openDB();
  const names = [...new Set([...puts, ...remove].map(([store]) => store))];
  const tx = db.transaction(names, 'readwrite');
  for (const [store, key, value] of puts) tx.objectStore(store).put(value, key);
  for (const [store, key] of remove) tx.objectStore(store).delete(key);
  return finished(tx);
}

export async function remove(store, key) {
  const db = await openDB();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).delete(key);
  return finished(tx);
}

export async function readStores(names = DATA_STORES) {
  const db = await openDB();
  const tx = db.transaction(names);
  const out = {};
  await Promise.all(names.map(async (name) => {
    const os = tx.objectStore(name);
    const [keys, values] = await Promise.all([asPromise(os.getAllKeys()), asPromise(os.getAll())]);
    out[name] = keys.map((k, i) => [k, values[i]]);
  }));
  return out;
}

// Přepíše všechna data snapshotem, v JEDNÉ transakci.
// Když cokoli selže, nezmění se nic (stará data zůstanou).
export async function writeSnapshot(snapshot) {
  const db = await openDB();
  const tx = db.transaction([...DATA_STORES, META_STORE], 'readwrite');
  for (const name of DATA_STORES) {
    const os = tx.objectStore(name);
    os.clear();
    for (const [key, value] of snapshot.stores[name] ?? []) os.put(value, key);
  }
  tx.objectStore(META_STORE).put(snapshot.schemaVersion, 'schemaVersion');
  return finished(tx);
}
