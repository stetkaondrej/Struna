# Krok 1 · Jádro MVP – specifikace

> Stav: **postaveno ve verzi 0.2.0** (schváleno 4. 11. 2026, denní mise přesunuty do kroku 2) · čeká na test na iPhonu · Cílová verze: **0.2.0** · Metaplán v1.1, kap. 8

## Cíl

Dcera může **začít denně cvičit**. Otevře Strunu, klepne na **Začít cvičit**, zahraje si a aplikace jí ukáže, kolik minut cvičila, kolik dní v řadě vydržela a kolik bodů (XP) získala.

## Co krok 1 obsahuje

### 1. Časovač cvičení (záložka Cvičení)

| Funkce | Popis |
|---|---|
| Start / Pauza / Pokračovat / Hotovo | Velké tlačítko, dobře se trefí i s kytarou na klíně |
| Kruh s časem | Ukazuje uběhlé minuty a dnešní cíl, např. `08:24 z 15:00` |
| Displej nezhasne | Během cvičení telefon nezamkne obrazovku (Screen Wake Lock) |
| Odolný proti zavření | Čas se počítá z okamžiku startu, ne „tikáním“. Když se aplikace zavře, zamkne nebo telefon spadne do tašky, cvičení **nezmizí**. Po otevření pokračuje |
| Pojistka proti zapomenutí | Když časovač běží déle než 60 minut, aplikace se zeptá: „Pořád cvičíš?“ a nabídne uložit jen prvních 60 minut |
| Krátké cvičení | Méně než 1 minuta se neuloží (např. omylem spuštěný časovač) |
| Po dokončení | Oslava: „+15 XP!“, a pokud splnila dnešní cíl, i „Cíl splněn! +20 XP“ |

### 2. Série dní (streak) s dny volna

| Pravidlo | Návrh |
|---|---|
| Kdy se den počítá | Den, kdy cvičila **aspoň 5 minut** |
| Dny volna | **2 dny volna za týden** (pondělí–neděle) sérii nepřeruší |
| Kdy se série přeruší | Třetí vynechaný den ve stejném týdnu |
| Dnešek | Dokud den neskončí, dnešek sérii nikdy nepřeruší |
| Co se zobrazí | `🔥 5 dní v řadě` a `Volno tento týden: 1 ze 2` |
| Týden v kostce | 7 koleček Po–Ne: zelené = cvičila, žluté = volno, šedé = ještě nebylo |

### 3. Body a úrovně (XP)

| Pravidlo | Návrh |
|---|---|
| Za minutu cvičení | **1 XP** (max. 30 XP za den, aby se nevyplácelo cvičit hodiny) |
| Splněný denní cíl | **+20 XP** jednou za den |
| Každých 7 dní série | **+50 XP** bonus |
| Úrovně | Úroveň 1 od 0 XP, každá další potřebuje o 50 XP víc než předchozí (100, 250, 450, 700, 1000 …) |
| Zobrazení | `Úroveň 3 · 340 / 450 XP` s ukazatelem |

XP se **nikde neukládá jako číslo**. Vždy se spočítá z uložených cvičení. Díky tomu se body nikdy nerozjedou s historií a změna pravidel platí zpětně.

### 4. Obrazovka Dnes (nová podoba)

Shora dolů:
1. Pozdrav podle denní doby („Dobré odpoledne!“)
2. Dnešní pokrok: kruh `6 / 15 min`
3. Velké tlačítko **Začít cvičit**, nebo **Pokračovat** (běží-li časovač)
4. Série 🔥 a týden v kostce
5. Úroveň a XP
6. Připomínka zálohy (jako dosud) a tip na přidání na plochu

### 5. Nastavení

- **Denní cíl:** 10 / 15 / 20 minut (výchozí 15)

### 6. Úklid po kroku 0

- Testovací počitadlo zmizí. Uložené číslo se smaže **migrací dat** (verze dat 1 → 2). Na tom se naučíme, jak migrace funguje v praxi.

## Data (co se nově ukládá)

| Úložiště | Záznam | Pole |
|---|---|---|
| `sessions` (nové) | jedno cvičení | `id`, `date` (RRRR-MM-DD), `startedAt`, `endedAt`, `seconds`, `goalMin` (cíl platný v době cvičení, viz D-009) |
| `kv` → `settings` | nastavení | `lang`, **`dailyGoalMin`** (nové) |
| `kv` → `activeSession` | běžící časovač | `startedAt`, `accumulatedSec`, `runningSince`, `confirmedUntilSec` |

Změny verzí: `DB_VERSION` 1 → 2 (nové úložiště), `CURRENT_SCHEMA` 1 → 2 (migrace). Záloha z verze 0.1.0 půjde obnovit i ve verzi 0.2.0.

## Co krok 1 záměrně neobsahuje

- **Denní mise se 3 úkoly.** Úkoly potřebují obsah (akordy, cviky), proto patří do kroku 2. *Pokud je chceš už teď, napiš.*
- Metronom, akordy, mapa světů, samolepky, nahrávání (kroky 2–4)

## Hotovo, když

- [ ] Časovač jde spustit, pozastavit, dokončit. Uložené cvičení se objeví v dnešním pokroku
- [ ] Při běžícím časovači nezhasne displej
- [ ] Zavření aplikace během cvičení nic neztratí. Po otevření časovač pokračuje se správným časem
- [ ] Série, dny volna a XP odpovídají pravidlům výše (ověřeno automatickými testy, včetně půlnoci a změny času)
- [ ] Denní cíl jde změnit v Nastavení
- [ ] Po aktualizaci z 0.1.0 zmizí testovací počitadlo a ostatní data zůstanou (jazyk, datum zálohy)
- [ ] Záloha z 0.1.0 jde obnovit
- [ ] Vše česky i anglicky, funguje offline, všechny testy prošly
- [ ] Ruční checklist na iPhonu prošel

## Co od tebe potřebuju

1. **Schválit** (nebo upravit) návrhy pravidel v tabulkách: **5 minut** = den se počítá, **2 dny volna**, **XP pravidla**, **výchozí cíl 15 minut**.
2. Rozhodnout: **denní mise** až v kroku 2 (doporučuji), nebo už teď?
3. Je-li to možné, ukázat dceři pravidla. Zdají se jí férová?
