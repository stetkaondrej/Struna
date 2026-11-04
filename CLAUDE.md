# Struna – instrukce pro Clauda

Struna je webová aplikace (PWA) pro iPhone, která pomáhá 11leté dívce cvičit na akustickou kytaru.
Vlastník projektu je začátečník ve vibe codingu: **vysvětluj každý krok jednoduše, česky**, a nauč ho při tom něco nového.

## Než začneš cokoli dělat

1. Přečti `docs/metaplan.md` (jak stavíme) a `docs/decisions.md` (co je rozhodnuté).
2. Zjisti aktuální krok v `README.md` (tabulka Stav projektu) a jeho specifikaci v `docs/specs/`.
3. Nová práce začíná **specifikací** `docs/specs/krok-N.md`, kterou vlastník schválí. Teprve pak kód.

## Neměnná pravidla

- **Žádné knihovny ani frameworky** v aplikaci (D-002). Čisté HTML, CSS, JS (ES moduly), žádný build.
- **Nic z cizích serverů** (fonty, skripty, obrázky). Aplikace musí fungovat offline.
- **Data jen přes `js/storage/store.js`.** Obrazovky nikdy nesahají na IndexedDB přímo.
- **Změna tvaru dat = nový migrační krok** v `js/storage/migrations.js` + zvýšit `CURRENT_SCHEMA` + test. Existující kroky nikdy neměň.
- **Nové úložiště (store)** = přidat do `DATA_STORES` a zvýšit `DB_VERSION` v `js/storage/schema.js`.
- **Všechny texty v `js/i18n.js`**, česky i anglicky. Obsah (akordy, písně, světy) v `content/*.json` s poli `cs` a `en`.
- **Nový soubor aplikace** = přidat do seznamu `ASSETS` v `sw.js` (hlídá test).
- **Soukromí (D-006):** do repozitáře nikdy jméno dítěte, fotky, nahrávky, kontakty.
- Cílové zařízení: iPhone 12 Pro, iOS 26 (390 × 844 bodů). Dotykové prvky min. 44 × 44 bodů.

## Vydání nové verze

1. Zvyš verzi na **čtyřech** místech: `js/version.js`, `sw.js`, `package.json`, `CHANGELOG.md`.
2. `npm test` a `npm run test:e2e` musí projít.
3. Commit a push na `main`. GitHub Pages nasadí aplikaci automaticky.
4. Vlastník projde `docs/test-checklist.md` na iPhonu.
5. Aktualizuj tabulku stavu v `README.md`. Na Google Drive (`Vibe Coding/01 Projects/Strum Quest`) vytvoř nový dokument „Struna - stav projektu“ s aktuálním stavem a starý přejmenuj na „(zastaralé)“. Obsah souborů na Drive měnit nejde. Aktuální dokumenty jsou vždy na GitHubu.

## Příkazy

```bash
npm test             # unit testy (node --test)
npm run test:e2e     # Playwright, emulace iPhonu 12 Pro
node tools/make-icons.js  # přegeneruje ikony
```
