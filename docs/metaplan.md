# Struna – Metaplán stavby aplikace

> Verze 1.1 · 4. 11. 2026 · rozhodnutí z kap. 13 zapracována
> (Pracovní název v blueprintu byl „Strum Quest“.)
> Tento dokument popisuje, **jak** budeme aplikaci stavět. Co aplikace umí, je v blueprintu:
> https://claude.ai/artifact/RVcu5CcYL2JgHQPtY3jmZV (v0.2)

---

## 1. Proč metaplán

Metaplán je plán, podle kterého se plánuje a staví. Určuje:

- jaká technická rozhodnutí platí pro celý projekt a proč,
- v jakém pořadí stavíme a co musí být hotové, než jdeme dál,
- jak hlídáme kvalitu, data a bezpečnost,
- jak aplikaci udržet funkční i za rok nebo za dva.

Každá další práce (každý krok roadmapy) se musí řídit tímto dokumentem. Když se něco změní, upravíme nejdřív metaplán, teprve pak kód.

---

## 2. Cíl a principy

**Cíl:** Hravá aplikace na iPhone, která 11leté dceři pomáhá denně cvičit na akustickou kytaru (10–15 min), ukazuje její pokrok a předává učiteli týdenní přehled.

**Principy robustnosti a udržitelnosti**

| # | Princip | Co to znamená v praxi |
|---|---|---|
| P1 | **Data se nikdy neztratí** | Ukládání po každé změně, zálohy, export, verzovaný formát dat. |
| P2 | **Jednoduchost před chytrostí** | Čisté HTML, CSS a JavaScript. Žádný framework, žádný „build“ krok, minimum knihoven. Co není, nemůže se rozbít ani zastarat. |
| P3 | **Funguje bez internetu** | Aplikace se načte a uloží data i offline (v autě, na chatě). |
| P4 | **Obsah odděleně od kódu** | Světy, akordy, písničky a úkoly jsou v datových souborech (JSON). Přidat písničku nesmí vyžadovat programování. |
| P5 | **Každá změna je vratná** | Veškerý kód je v Gitu na GitHubu. Každá verze má číslo a jde se k ní vrátit. |
| P6 | **Malé kroky, pořád funkční** | Po každém kroku je aplikace použitelná. Nikdy nestavíme týdny „do šuplíku“. |
| P7 | **Soukromí dítěte** | Žádné účty, reklamy, analytika ani sledování. Nic neodchází z telefonu bez rodiče. |
| P8 | **Projekt si pamatuje sám sebe** | Dokumentace (README, CLAUDE.md, deník rozhodnutí) je v repozitáři. Každá nová session s Claudem naváže bez vysvětlování. |

---

## 3. Role

| Kdo | Role | Odpovědnost |
|---|---|---|
| **Ty (tatínek)** | Product owner | Rozhoduje *co* a *proč*, schvaluje každý krok, vydává verze. |
| **Dcera** | Hlavní uživatelka a testerka | Zkouší každou verzi a říká, co ji baví a co ne. Spolurozhoduje o vzhledu. |
| **Učitel kytary** | Odborný poradce | Potvrdí pořadí učení (7 světů), akordy a podobu týdenního reportu. |
| **Claude** | Vývojář | Navrhuje, programuje, testuje, dokumentuje a vysvětluje každý krok. |

---

## 4. Technická architektura (rozhodnutí)

| Oblast | Rozhodnutí | Proč | Alternativa později |
|---|---|---|---|
| Typ aplikace | **Webová aplikace (PWA)** přidaná na plochu iPhonu | Zdarma, bez Macu a App Store, okamžité aktualizace | Nativní iOS app (Swift / React Native) |
| Jazyky | HTML + CSS + JavaScript (ES moduly) | Standard webu, nezastarává, Claude ho umí dobře vysvětlit | – |
| Knihovny | Žádné. Výjimka jen se zdůvodněním v deníku rozhodnutí | Méně závislostí znamená méně oprav a bezpečnostních děr | – |
| Uložení dat | **IndexedDB** v telefonu a žádost o trvalé úložiště (`navigator.storage.persist`) | Spolehlivější a větší než localStorage. Zvládne i video klipy | Cloudová synchronizace (verze 3) |
| Offline | **Service worker** ukládá aplikaci do telefonu | Funguje bez signálu | – |
| Hosting | **GitHub Pages** (zdarma, HTTPS) | Kód i web na jednom místě, historie všech verzí | Cloudflare Pages / Netlify |
| Zdroj pravdy | **GitHub repozitář** | Cloudový počítač Clauda je dočasný, GitHub ne | – |
| Dokumenty a zálohy | **Google Drive** · `Vibe Coding/01 Projects/Strum Quest` | Snadno dostupné z telefonu, sdílení s učitelem | – |
| Sdílení reportu | Systémové sdílení iPhonu (`navigator.share` se soubory) | WhatsApp / Zprávy / e-mail bez vlastního serveru | Sdílená složka na Drive |
| Jazyk aplikace | **Čeština + angličtina**, přepínač v nastavení, výchozí čeština | Dcera se učí česky, angličtina jako bonus | Další jazyky přes `i18n.js` |
| Cílové zařízení | **iPhone 12 Pro, iOS 26.6** (obrazovka 390 × 844 bodů) | Podporuje vše potřebné: PWA na ploše, IndexedDB, trvalé úložiště, sdílení souborů, mikrofon, nahrávání videa | – |
| Viditelnost kódu | **Veřejný repozitář** `github.com/stetkaondrej/struna` | GitHub Pages je zdarma jen pro veřejné repozitáře. V kódu nejsou žádné osobní údaje; jméno a data dcery zůstávají jen v telefonu | Soukromý repozitář + Cloudflare Pages |

Každé nové zásadní rozhodnutí se zapíše do `docs/decisions.md` (co, proč, kdy, jaké byly alternativy).

---

## 5. Struktura repozitáře

```
struna/
├── index.html              # vstup do aplikace
├── manifest.webmanifest    # ikona a název na ploše iPhonu
├── sw.js                   # service worker (offline)
├── css/
│   └── app.css
├── js/
│   ├── app.js              # spuštění a navigace mezi obrazovkami
│   ├── screens/            # jedna obrazovka = jeden soubor
│   ├── logic/              # čistá logika: streak, XP, levely (bez UI → snadno testovatelná)
│   ├── storage/            # jediné místo, které sahá na data (IndexedDB, zálohy, migrace)
│   └── i18n.js             # všechny texty aplikace na jednom místě
├── content/                # obsah oddělený od kódu (P4)
│   ├── worlds.json
│   ├── chords.json
│   ├── songs.json
│   └── quests.json
├── assets/                 # ikony, zvuky, obrázky
├── tests/                  # automatické testy logiky a dat
├── docs/
│   ├── metaplan.md         # tento dokument
│   ├── blueprint.md        # funkce a obrazovky
│   ├── decisions.md        # deník rozhodnutí
│   ├── test-checklist.md   # ruční test na iPhonu
│   └── specs/              # specifikace jednotlivých kroků
├── CHANGELOG.md            # co se změnilo v každé verzi
├── CLAUDE.md               # instrukce a kontext pro budoucí sessions s Claudem
└── README.md               # co to je a jak to spustit
```

**Pravidlo vrstev:** obrazovky (`screens`) nikdy nepracují s daty napřímo, jen přes `storage`. Logika (`logic`) nezná obrazovky. Díky tomu jde každá část změnit nebo otestovat zvlášť.

---

## 6. Data a jejich ochrana (P1)

**Datový model** (z blueprintu v0.2): `Player`, `PracticeSession`, `Skill`, `Homework`, `LearningLog`.

| Riziko | Ochrana |
|---|---|
| iPhone smaže data webu | Aplikace běží z plochy (tam iOS data nemaže po 7 dnech jako u webů v Safari). Žádáme o trvalé úložiště. |
| Smazání ikony z plochy smaže data | **Týdenní záloha**: tlačítko „Zálohovat“ vytvoří soubor `.json` a uloží ho do Souborů / na Google Drive. Aplikace sama připomene, když záloha chybí déle než 14 dní. |
| Obnova na novém telefonu | Funkce „Obnovit ze zálohy“, otestovaná před každým vydáním. |
| Nová verze změní formát dat | Každý záznam nese `schemaVersion`. Při spuštění proběhne **migrace** na nový formát. Před migrací se vytvoří automatická záloha. |
| Videa zaplní paměť | Limit délky klipu (60 s) a ukazatel místa. Po odeslání učiteli nabídka „smazat klip, ponechat zápis“. |
| Poškozená data / chyba v kódu | Ukládání v transakcích. Chyba se zobrazí srozumitelně a nikdy tiše nezahodí data. |

---

## 7. Pracovní postup pro každý krok

Každý krok roadmapy prochází stejnými šesti fázemi:

| Fáze | Výstup | Kdo schvaluje |
|---|---|---|
| **1. Spec** | `docs/specs/krok-N.md`: co krok umí, co ne, kdy je hotový | Ty |
| **2. Plan** | Seznam malých úkolů (obrazovka, data, logika, testy) | Ty (rychlé OK) |
| **3. Build** | Kód v repozitáři, malé commity s popisem | – |
| **4. Test** | Automatické testy prošly + ruční checklist na iPhonu | Claude + ty |
| **5. Review** | Dcera aplikaci používá 3–7 dní. Zapíšeme postřehy | Dcera |
| **6. Ship** | Nová verze na GitHub Pages, záznam v CHANGELOG, kopie dokumentů na Drive | Ty |

**Definition of Done** (krok je hotový, jen když platí vše):

- [ ] Funguje na iPhonu z plochy, i v režimu letadlo
- [ ] Data přežijí zavření aplikace, restart telefonu i aktualizaci na novou verzi
- [ ] Automatické testy prošly
- [ ] Ruční checklist na iPhonu prošel
- [ ] Texty jsou v `i18n.js`, obsah v `content/`
- [ ] Aktualizovaný README, CHANGELOG a případně `decisions.md`
- [ ] Ty jsi krok schválil

---

## 8. Fáze a milníky

> Fáze 0 je nová a zásadní pro robustnost: nejdřív postavíme základy, teprve potom funkce.

| Fáze | Obsah | Výsledek (milník) | Verze |
|---|---|---|---|
| **0 · Základy** | GitHub účet a repozitář, GitHub Pages, struktura složek, CLAUDE.md, README, prázdná aplikace na ploše iPhonu, vrstva `storage` se zálohou, obnovou a migracemi, testovací nástroj, offline režim | Prázdná, ale „neprůstřelná“ aplikace na telefonu | 0.1.0 |
| **1 · Jádro MVP** | Obrazovka Dnes, časovač cvičení, streak (se 2 dny volna týdně) a XP | Dcera může začít denně cvičit | 0.2.0 |
| **2 · MVP komplet** | Akordy s diagramy, domácí úkol od učitele, deník „Co jsem se naučila“ | První verze k reálnému používání | 0.3.0 |
| **3 · Do telefonu** | Ikona, název, úvodní nastavení (jméno, avatar, denní cíl), test na reálném iPhonu | Hotové MVP | **1.0.0** |
| **4 · Verze 2** | Nahrát cvičení (video/audio), týdenní report pro učitele, mapa výprav, samolepky, metronom, 1minutové střídání akordů | Motivace + spojení s učitelem | 1.x |
| **5 · Verze 3** | Ladička (mikrofon), zvukový deník, rodičovský pohled na druhém telefonu (cloud) | Plná verze | 2.0.0 |

Mezi fázemi je **brána**: další fáze začne, až předchozí splní Definition of Done a dcera ji alespoň 3 dny používala.

---

## 9. Testování

| Úroveň | Co | Jak |
|---|---|---|
| Automatické testy logiky | Streak, dny volna, XP, levely, odemykání světů, migrace dat | Vestavěný testovací nástroj Node.js, bez knihoven (`node --test`) |
| Test obsahu | Všechny JSON soubory mají správný tvar (např. každý akord má 6 strun) | Automatický test |
| Test v prohlížeči | Aplikace se spustí, obrazovky se přepínají, data se uloží | Playwright s emulací iPhonu |
| Ruční test na iPhonu | Plocha, offline, záloha a obnova, zvuk, video | `docs/test-checklist.md`, před každým vydáním |
| Uživatelský test | Baví to? Rozumí tomu? | Dcera, 3–7 dní, krátký rozhovor |

Hraniční případy, které testujeme vždy: první spuštění, 3 dny bez cvičení, cvičení přes půlnoc, změna času (letní/zimní), plná paměť, žádný internet.

---

## 10. Vydávání a verze

- **Číslování verzí:** `HLAVNÍ.VEDLEJŠÍ.OPRAVA` (např. 1.2.0). Oprava chyby zvyšuje poslední číslo, nová funkce prostřední.
- **Postup vydání:** testy → ruční checklist → záloha dat v telefonu → nasazení → kontrola na iPhonu → zápis do CHANGELOG → kopie dokumentů na Drive.
- **Návrat zpět:** když nová verze nefunguje, vrátíme v Gitu předchozí verzi. Data jsou díky migracím a zálohám v bezpečí.
- **Aktualizace v telefonu:** aplikace pozná novou verzi a nabídne „Aktualizovat“. Nikdy se nepřepne uprostřed cvičení.

---

## 11. Údržba (udržitelný provoz)

| Kdy | Co |
|---|---|
| Každý týden | Aplikace sama připomene zálohu. Rodič odešle report učiteli. |
| Každý měsíc | Krátká kontrola: funguje vše? Místo v telefonu? Postřehy dcery. |
| Po každé lekci s novým učivem | Doplnit obsah (písnička, akord) do `content/`, bez programování. |
| Po velké aktualizaci iOS | Projít ruční checklist na iPhonu. |
| Každého půl roku | Projít `decisions.md` a roadmapu: co dál, co už nepotřebujeme. |

Protože aplikace nemá žádné knihovny ani server, **nevyžaduje bezpečnostní aktualizace závislostí**. To je hlavní důvod principu P2.

---

## 12. Rizika

| Riziko | Pravděpodobnost | Dopad | Opatření |
|---|---|---|---|
| Ztráta dat v telefonu | Střední | Vysoký | Kap. 6: zálohy, připomínky, test obnovy |
| Dceru to přestane bavit | Střední | Vysoký | Krátké mise, dny volna, odměny, spolurozhodování, rychlé reakce na její postřehy |
| Aplikace nesedí na výuku | Nízká | Střední | Učitel potvrdí pořadí světů před fází 1 |
| iOS omezí webové aplikace | Nízká | Střední | Standardní webové technologie. Plán B: nativní aplikace |
| Ztráta kontextu mezi sessions s Claudem | Vysoká | Střední | CLAUDE.md, README, decisions.md v repozitáři (P8) |
| Projekt se rozroste a zkomplikuje | Střední | Střední | Brány mezi fázemi, MVP nejdřív, princip P2 |

---

## 13. Rozhodnutí (4. 11. 2026)

| # | Otázka | Rozhodnutí |
|---|---|---|
| 1 | Jazyk aplikace | Čeština + angličtina (přepínač), výchozí čeština |
| 2 | GitHub účet | `github.com/stetkaondrej`, repozitář `struna` |
| 3 | Název aplikace | **Struna** |
| 4 | Týdenní report učiteli | Učitel souhlasí |
| 5 | Pořadí 7 světů | Učitel potvrdil |
| 6 | Telefon dcery | iPhone 12 Pro, iOS 26.6.1 |

Podrobnosti a důvody jsou v `docs/decisions.md`.

---

## 14. Další krok

**Fáze 0 · Základy** je hotová a otestovaná na iPhonu (verze 0.1.0). **Krok 1 · Jádro MVP**: specifikace `docs/specs/krok-1.md` čeká na schválení.
