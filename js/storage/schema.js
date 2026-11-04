// Popis databáze v telefonu (IndexedDB).
// DB_VERSION zvyš jen tehdy, když přidáváš nebo odebíráš úložiště (store).
// Změny tvaru dat řeší migrace v migrations.js, ne DB_VERSION.
export const DB_NAME = 'struna';
export const DB_VERSION = 2; // 2: přidáno úložiště sessions (krok 1)

// Úložiště s daty uživatele. Ta se zálohují a obnovují.
export const DATA_STORES = ['kv', 'sessions'];

// Technické údaje (verze dat, datum poslední zálohy, automatické zálohy).
// Do zálohy se nezahrnují.
export const META_STORE = 'meta';
