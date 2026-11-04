# Deník rozhodnutí

Každé zásadní rozhodnutí: co, proč, kdy a jaké byly alternativy. Nejnovější nahoře.

---

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
