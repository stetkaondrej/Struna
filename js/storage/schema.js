// Popis databáze v telefonu (IndexedDB).
// DB_VERSION zvyš jen tehdy, když přidáváš nebo odebíráš úložiště (store).
// Změny tvaru dat řeší migrace v migrations.js, ne DB_VERSION.
export const DB_NAME = 'struna';
export const DB_VERSION = 5; // 2: sessions (krok 1) · 3: missions, homework, journal (krok 2) · 4: reports, clips (krok 4a) · 5: changes (krok 4c)

// Úložiště s daty uživatele. Ta se zálohují a obnovují.
export const DATA_STORES = ['kv', 'sessions', 'missions', 'homework', 'journal', 'reports', 'changes'];

// Úložiště jen v telefonu: do zálohy se nedávají a obnova zálohy je nemaže (D-017).
// Nahrávky jsou na záložní soubor moc velké.
export const LOCAL_STORES = ['clips'];

// Technické údaje (verze dat, datum poslední zálohy, automatické zálohy).
// Do zálohy se nezahrnují.
export const META_STORE = 'meta';
