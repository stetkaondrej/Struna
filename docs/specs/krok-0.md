# Krok 0 · Základy – specifikace

> Stav: **✅ hotovo** · schváleno, postaveno a otestováno na iPhonu 4. 11. 2026 · Cílová verze: **0.1.0** · Metaplán v1.1, kap. 8

## Cíl

Prázdná, ale „neprůstřelná“ aplikace Struna na ploše iPhonu. Zatím neumí nic z kytary. Umí ale všechno, na čem budou stát další kroky: ukládat data, zálohovat je, obnovit je, fungovat offline, přepnout jazyk a aktualizovat se na novou verzi.

## Co krok 0 obsahuje

| # | Část | Co dcera / rodič uvidí |
|---|---|---|
| 1 | **Kostra aplikace** se 5 záložkami (Dnes, Mapa, Cvičení, Akordy, Já) | Záložky se přepínají, na každé text „Brzy tu bude…“ |
| 2 | **Ikona a název na ploše** (`manifest.webmanifest`) | Po „Přidat na plochu“ se objeví ikona Struna a aplikace se otevře na celou obrazovku |
| 3 | **Offline režim** (service worker) | Aplikace se otevře i v režimu letadlo |
| 4 | **Ukládání dat** (IndexedDB + žádost o trvalé úložiště) | Testovací počitadlo „Klepnutí: 7“ přežije zavření aplikace i restart telefonu |
| 5 | **Záloha a obnova** | V Nastavení tlačítka „Zálohovat“ (uloží soubor `struna-zaloha-2026-11-04.json` do Souborů) a „Obnovit ze zálohy“ |
| 6 | **Migrace dat** | Neviditelné. Data nesou `schemaVersion`, budoucí verze je umí bezpečně převést |
| 7 | **Čeština / angličtina** | Přepínač jazyka v Nastavení |
| 8 | **Aktualizace** | Když vyjde nová verze, objeví se lišta „Je k dispozici nová verze · Aktualizovat“ |
| 9 | **Číslo verze** | V Nastavení „Verze 0.1.0“ |
| 10 | **Dokumentace** | `README.md`, `CLAUDE.md`, `CHANGELOG.md`, `docs/test-checklist.md` |
| 11 | **Automatické testy** | `node --test` pro data, zálohy a migrace. Playwright test s emulací iPhonu 12 Pro |
| 12 | **Zveřejnění** | Aplikace běží na `https://stetkaondrej.github.io/struna/` |

## Co krok 0 záměrně neobsahuje

Časovač, streak, XP, akordy, úkoly, nahrávání. To jsou kroky 1–4.

## Hotovo, když

- [ ] Aplikace je na ploše iPhonu 12 Pro s vlastní ikonou a otevírá se na celou obrazovku
- [ ] Otevře se v režimu letadlo
- [ ] Testovací počitadlo přežije zavření aplikace a restart telefonu
- [ ] Záloha vytvoří soubor, který jde uložit do Souborů nebo na Google Drive
- [ ] Po smazání dat a obnovení ze zálohy je počitadlo zpět na původní hodnotě
- [ ] Přepnutí jazyka změní všechny texty a volba se pamatuje
- [ ] Nová verze nabídne aktualizaci a data po ní zůstanou
- [ ] Všechny automatické testy prošly
- [ ] V repozitáři nejsou žádné osobní údaje (D-006)

## Co od tebe potřebuju

1. **Schválit tuto specifikaci** (nebo napsat, co změnit).
2. **Založit prázdný repozitář** na GitHubu: `struna`, veřejný, bez README.
3. Na konci kroku: **otestovat na iPhonu** podle `docs/test-checklist.md` (cca 10 minut).
