# Změny ve Struně

Formát: každá verze má vlastní nadpis `## X.Y.Z · datum`. Nejnovější nahoře.

## 1.0.1 · 2026-11-04 · Oprava kroužku časovače

- Čas a text v kroužku na obrazovce Cvičení přetékaly přes kroužek, když měl iPhone větší písmo. Písmo uvnitř kroužku se teď řídí velikostí kroužku a kroužek roste spolu s písmem. Totéž pro kroužek na obrazovce Dnes
- Test v prohlížeči nově kontroluje, že text leží celý uvnitř kroužku (iPhone 12 Pro, SE, 14 Pro Max i s velkým písmem)

## 1.0.0 · 2026-11-04 · Krok 3: Do telefonu 🎉

První hotová verze Struny.

- **Úvodní průvodce** při prvním otevření: vítání, přezdívka, avatar, denní cíl, návod „Přidat na plochu“
  - po aktualizaci ze starší verze jen krátký průvodce (přezdívka a avatar), všechna data zůstávají
- **Profil**: přezdívka a avatar (🎸 🦊 🐱 🦄 🐼 🦉 🐸 ⭐) v pozdravu na Dnes, karta v záložce Já, úprava v Nastavení
- **Zvuky radosti** (generované v aplikaci, bez souborů): úkol, splněná mise, dokončené cvičení, nová úroveň; vypínač v Nastavení
- **Větší písmo**: velikost textu se řídí nastavením iPhonu (Zpřístupnění → Větší text)
- Kontrola rozložení na iPhonu SE, 12 Pro a 14 Pro Max
- Nastavení → O aplikaci: odkaz na nápovědu
- Migrace dat 3 → 4 (profil, zvuky)
- Nápověda v README: instalace, body XP, záloha, obnova, aktualizace
- Testy: 69 automatických testů, 29 kroků v prohlížeči (průvodce, aktualizace z 0.3.1, iPhone SE, 14 Pro Max, velké písmo)

## 0.3.1 · 2026-11-04 · Prstoklady podle učitele

- **G dur**: malíček (4) na strunu e a prsteníček (3) na strunu H, oba ve 3. pražci (plnější zvuk)
- **E moll**: tip doplněn o variantu s prsty 1 a 2; prsty 2 a 3 zůstávají kvůli snadnému přechodu z Am

## 0.3.0 · 2026-11-04 · Krok 2: MVP komplet

- **Kniha akordů** (záložka Akordy): Em, Am, E, A, D, G, C s prstoklady, čísly prstů a tipy
  - přepínač „Učím se“ (výchozí Em a Am) a hvězdičky ★ ★★ ★★★ podle toho, jak akord jde
- **Denní mise** na Dnes: 3 úkoly (domácí úkol nebo rozcvička, akord, přehazování nebo brnkání)
  - mise se vybere jednou za den a nemění se; +10 XP za úkol, +10 XP za všechny tři
- **Domácí úkol od učitele** (záložka Já): zadání po lekci, ukáže se v misi do splnění
- **Deník „Co jsem se naučila“**: po cvičení nebo v záložce Já; 3 otázky a smajlík; +5 XP jednou denně
- **Záložka Já**: domácí úkol, deník, minuty celkem, dny cvičení, nejdelší série, úroveň
- Obsah (akordy, úkoly) je v `content/*.json`, odděleně od kódu
- Migrace dat 2 → 3. Nová instalace prochází všemi migracemi, takže má stejná výchozí data jako aktualizace
- Dny před prvním cvičením se nepočítají jako dny volna
- Testy: 62 automatických testů (včetně kontroly prstokladů), 23 kroků v prohlížeči

## 0.2.0 · 2026-11-04 · Krok 1: Jádro MVP

- **Časovač cvičení** (záložka Cvičení): Start, Pauza, Pokračovat, Hotovo
  - čas se počítá z okamžiků, takže přežije zavření aplikace i zamčení telefonu
  - během cvičení nezhasne displej
  - po hodině se zeptá „Pořád cvičíš?“; cvičení kratší než minuta se neuloží
- **Oslava po cvičení**: získané XP, splněný cíl, bonus za sérii, nová úroveň
- **Nová obrazovka Dnes**: pozdrav, kroužek s dnešními minutami, Začít cvičit, série dní, týden v kostce, úroveň a XP
- **Série dní**: den se počítá od 5 minut, 2 dny volna týdně sérii nepřeruší
- **XP a úrovně**: 1 XP za minutu (max. 30 denně), +20 za splněný cíl, +50 za každých 7 dní série
- **Denní cíl** 10 / 15 / 20 minut v Nastavení
- Migrace dat 1 → 2: zmizelo testovací počitadlo, přibylo úložiště cvičení. Zálohy z 0.1.0 jdou obnovit
- Testy: 45 automatických testů, 16 kroků v prohlížeči (včetně posouvání hodin a převodu dat z 0.1.0)

## 0.1.0 · 2026-11-04 · Krok 0: Základy

Zatím bez kytarových funkcí. Pevné základy pro všechny další kroky.

- Kostra aplikace s 5 záložkami (Dnes, Mapa, Cvičení, Akordy, Já) a Nastavením
- Ikona a název „Struna“ na ploše iPhonu, otevírá se na celou obrazovku
- Offline režim: aplikace funguje i bez internetu
- Ukládání dat v telefonu (IndexedDB) a žádost o ochranu před automatickým smazáním
- Záloha dat do souboru a obnova ze zálohy, s potvrzením a pojistnou kopií
- Migrace dat: budoucí verze bezpečně převedou stará data
- Čeština a angličtina s přepínačem v Nastavení
- Nabídka „Aktualizovat“, když vyjde nová verze
- Testovací počitadlo na obrazovce Dnes (v kroku 1 se odstraní)
- Automatické testy (21 testů) a test v prohlížeči s emulací iPhonu 12 Pro
