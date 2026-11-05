# Deník rozhodnutí

Každé zásadní rozhodnutí: co, proč, kdy a jaké byly alternativy. Nejnovější nahoře.

---

## D-022 · Metronom a výzva 1 minuta
**Datum:** 5. 11. 2026
**Rozhodnutí:** Metronom 40–160 BPM, výchozí 70 (schválil vlastník), zvuk plánovaný dopředu přes Web Audio, hraje i v tichém režimu (je to nástroj). Obraz šipek se počítá z uplynulého času. Výzva 1 minuta: +5 XP za pokus (max. 3× denně), +10 XP za nový rekord dvojice akordů. Výzva světa 5 se odemkne po 30 s metronomu v rytmu ↓ ↓ ↑ ↑ ↓ ↑ s tempem aspoň 70, svět 6 se splní sám po 20 přechodech. Samolepka Rytmus = metronom 5 různých dní (aspoň minutu denně, upravil vlastník).
**Proč:** Rytmus a přechody brzdí začátečníky nejvíc. Struna neslyší kytaru, proto měří jen čas a klepnutí a poctivost je na dceři (jako u úkolů mise).

## D-021 · Mapa výprav a samolepky
**Datum:** 5. 11. 2026
**Rozhodnutí:** 7 světů v pořadí učitele, obsah v `content/worlds.json`. Lekce +5 XP, výzva +100 XP (schválil vlastník). Další svět se odemkne po výzvě předchozího. Rodič může svět za PINem přeskočit (bez XP). Dcera prochází od začátku. 21 samolepek se počítá z historie; jednou získaná zůstává (`stickersSeen`), i kdyby se třeba smazala nahrávka.
**Proč:** Viditelná cesta a sbírání motivují. Výpočet z historie (D-008) znamená, že se po obnově zálohy vše vrátí.
**Pozn.:** Výzvy světů 5 a 6 zatím dcera potvrdí sama, od kroku 4c je ověří metronom a počítadlo.
**Doplnění 1.2.1:** Hra „Která struna?“ jde z Mapy spustit kdykoli jako trénink (přání vlastníka, hra byla moc schovaná). Výzvu světa 2 splní jen tehdy, když je výzva odemčená.

## D-020 · Report odchází jako jedno sdílení: text + nahrávky
**Datum:** 5. 11. 2026
**Rozhodnutí:** Nahrávky z týdne jsou v reportu předem zaškrtnuté (nejvýš 3). Struna předá iPhonu text i soubory v jednom sdílení. Když to nejde, pošle nahrávky a text dá do schránky. Nahrávky se ukládají jako ArrayBuffer (ne Blob).
**Proč:** Přání vlastníka: učitel má dostat vše v jedné zprávě. Video se na iPhonu neuložilo, protože Safari má potíže s velkými Bloby v IndexedDB.
**Pozn.:** Jak WhatsApp zobrazí text u souborů (popisek, nebo samostatná zpráva), určuje WhatsApp, ne Struna.

## D-019 · Krok 4 ve třech částech
**Datum:** 5. 11. 2026
**Rozhodnutí:** Krok 4 se staví jako 4a Pro učitele (1.1.0) → 4b Hra (1.2.0) → 4c Nástroje (1.3.0). Každá část má vlastní specifikaci a test na iPhonu.
**Proč:** Malé kroky, po každém je aplikace hotová (P6).

## D-018 · Rodičovský PIN
**Datum:** 5. 11. 2026
**Rozhodnutí:** 4 číslice, ukládá se jen otisk SHA-256 v technickém úložišti (nezálohuje se). Po zadání platí 5 minut. Zapomenutý PIN se obnoví početní otázkou (dvojciferné násobení). Chrání report pro učitele a mazání nahrávek.
**Proč:** Jednoduchá pojistka, aby dítě omylem neodeslalo report ani nesmazalo nahrávku. Není to silné zabezpečení, a ani nemá být.

## D-017 · Nahrávky jen v telefonu, mimo zálohu
**Datum:** 5. 11. 2026
**Rozhodnutí:** Nahrávky jsou v úložišti `clips` (`LOCAL_STORES`). Do záložního souboru se nedávají a obnova zálohy je nesmaže. Report jde učiteli přes nabídku Sdílet (WhatsApp, rozhodnutí vlastníka).
**Proč:** Minuta videa má i 100 MB, záložní soubor by byl obrovský a pomalý. Nahrávky k uchování se ukládají do Souborů.

## D-016 · Velikost písma podle iPhonu
**Datum:** 4. 11. 2026
**Rozhodnutí:** Velikosti písma jsou v `rem` a základ se řídí systémovým nastavením iPhonu (`-apple-system-body`).
**Proč:** Když má někdo v iPhonu zapnuté větší písmo (Zpřístupnění), Struna ho respektuje. Test hlídá, že nic nepřetéká přes okraj ani se zvětšeným písmem.

## D-015 · Profil, avatary a zvuky
**Datum:** 4. 11. 2026
**Rozhodnutí:** Přezdívka a avatar (8 emoji vybraných dcerou) jsou jen v telefonu a v zálohách (D-006). Zvuky se generují v aplikaci (Web Audio), jsou zapnuté a jdou vypnout. Ikona aplikace zůstává.
**Proč:** Osobní aplikace víc motivuje. Emoji a generované zvuky fungují offline a nepřidávají soubory ani knihovny (P2).
**Pozn.:** Přezdívka se píše rovnou v 5. pádě („Kytaristko“), protože aplikace neumí česky skloňovat.

## D-014 · Prstoklady potvrdil učitel
**Datum:** 4. 11. 2026
**Rozhodnutí:** Učitel prstoklady potvrdil s dvěma úpravami:
- **G dur** se hraje 3 2 0 0 3 3 s prsty 2 1 – – 3 4: malíček na struně e, prsteníček na struně H (plnější zvuk).
- **E moll** zůstává s prsty 2 a 3 (snadný přechod z Am). Varianta s prsty 1 a 2 je uvedena v tipu.
**Poznámka učitele:** prstoklad vždy záleží i na skladbě. Aplikace ukazuje jednu základní variantu.

## D-013 · Nový domácí úkol se objeví v dnešní misi
**Datum:** 4. 11. 2026
**Rozhodnutí:** Mise se během dne nemění, s jednou výjimkou: když se po lekci zadá nový domácí úkol a první úkol mise (rozcvička nebo starý domácí úkol) ještě není odškrtnutý, nahradí ho nový domácí úkol.
**Proč:** Po lekci chce dcera cvičit nový úkol hned, ne až zítra. Odškrtnuté úkoly a získané XP se nikdy nemění.

## D-012 · Dny před prvním cvičením nejsou dny volna
**Datum:** 4. 11. 2026
**Rozhodnutí:** Série a dny volna se počítají až od prvního dne, kdy dcera cvičila aspoň 5 minut.
**Proč:** Odškrtnutý úkol mise nebo zápis v deníku bez cvičení by jinak „spotřeboval“ den volna, i když žádná série ještě neběží.

## D-011 · Nová instalace prochází všemi migracemi
**Datum:** 4. 11. 2026
**Rozhodnutí:** Při první instalaci se prázdná data převedou všemi migracemi od verze 0 (`store.init`).
**Proč:** Nová instalace a aktualizace pak mají vždy stejná výchozí data (např. akordy „učím se“ Em a Am). Výchozí hodnoty jsou jen na jednom místě: v migracích.

## D-010 · Denní mise až v kroku 2
**Datum:** 4. 11. 2026
**Rozhodnutí:** Denní mise se 3 úkoly se staví v kroku 2 spolu s akordy.
**Proč:** Úkoly potřebují obsah (akordy, cviky), který vzniká v kroku 2.

## D-009 · Denní cíl se ukládá ke každému cvičení
**Datum:** 4. 11. 2026
**Rozhodnutí:** Každé cvičení si pamatuje denní cíl, který platil, když vzniklo (`goalMin`).
**Proč:** Když se cíl později změní (např. z 15 na 10 minut), staré dny zůstanou hodnocené podle cíle, který tehdy platil. Bonusy za minulost se tak zpětně nemění.

## D-008 · Body XP a série se počítají, neukládají
**Datum:** 4. 11. 2026
**Rozhodnutí:** XP, úroveň a série dní se vždy spočítají z uložených cvičení (`js/logic/progress.js`). Nikde se neukládají jako číslo.
**Proč:** Jediný zdroj pravdy jsou cvičení. Čísla nikdy nemůžou „nesedět“, obnova zálohy je automaticky správná a změna pravidel platí jednotně.
**Schválená pravidla:** den od 5 minut, 2 dny volna týdně, 1 XP/min (max. 30 denně), +20 za cíl, +50 za každých 7 dní série, úrovně 100/250/450/700/1000…

## D-007 · Cílové zařízení: iPhone 12 Pro, iOS 26.6.1
**Datum:** 4. 11. 2026
**Rozhodnutí:** Navrhujeme a testujeme pro obrazovku 390 × 844 bodů (iPhone 12 Pro). Aplikace musí fungovat i na menších a větších iPhonech.
**Proč:** Na tomto telefonu bude dcera aplikaci používat. iOS 26 podporuje vše, co potřebujeme: webová aplikace na ploše, IndexedDB, trvalé úložiště, sdílení souborů, nahrávání videa a zvuku, mikrofon.
**Důsledek:** Ruční testy probíhají na tomto telefonu. Automatické testy emulují iPhone 12 Pro.

## D-006 · Veřejný repozitář na GitHubu
**Datum:** 4. 11. 2026
**Rozhodnutí:** Kód bude ve veřejném repozitáři `github.com/stetkaondrej/struna`.
**Proč:** GitHub Pages (hosting zdarma) funguje u bezplatného účtu jen pro veřejné repozitáře.
**Pravidlo:** Do repozitáře **nikdy** nepatří jméno dcery, fotky, nahrávky, data z telefonu ani kontakt na učitele. To vše zůstává jen v telefonu.
**Alternativa:** Soukromý repozitář + hosting Cloudflare Pages (také zdarma, ale o krok složitější).

## D-005 · Název aplikace: Struna
**Datum:** 4. 11. 2026
**Rozhodnutí:** Aplikace se jmenuje **Struna**. Pracovní název „Strum Quest“ se už nepoužívá.

## D-004 · Dva jazyky: čeština a angličtina
**Datum:** 4. 11. 2026
**Rozhodnutí:** Všechny texty jsou ve dvou jazycích. Výchozí je čeština, angličtina se zapne v nastavení.
**Jak:** Texty aplikace jsou v `js/i18n.js`, texty obsahu (světy, akordy, písničky) mají v `content/*.json` pole `cs` a `en`.
**Pravidlo:** Žádný text pro uživatele nesmí být napsaný přímo v kódu obrazovky.

## D-003 · Učitel jako odborný poradce
**Datum:** 4. 11. 2026
**Rozhodnutí:** Učitel souhlasí s týdenním reportem a potvrdil pořadí 7 světů z blueprintu v0.2.

## D-002 · Bez frameworků a knihoven
**Datum:** 4. 11. 2026
**Rozhodnutí:** Čisté HTML, CSS a JavaScript (ES moduly). Žádný build krok, žádné npm balíčky v aplikaci.
**Proč:** Robustnost a udržitelnost (princip P2): nic nezastarává a nic není potřeba aktualizovat kvůli bezpečnosti.
**Výjimka:** Nástroje jen pro testování (Playwright) nejsou součástí aplikace a do telefonu se nedostanou.

## D-001 · Webová aplikace (PWA) místo nativní
**Datum:** 4. 11. 2026
**Rozhodnutí:** Struna je webová aplikace, kterou si dcera přidá na plochu iPhonu.
**Proč:** Zdarma, bez Macu a App Store, aktualizace okamžitě.
**Alternativa:** Nativní aplikace (Swift / React Native), pokud narazíme na limity (např. ladička).
