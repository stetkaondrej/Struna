# Krok 2 · MVP komplet – specifikace

> Stav: **postaveno ve verzi 0.3.0** (schváleno 4. 11. 2026) · čeká na test na iPhonu a kontrolu prstokladů učitelem · Cílová verze: **0.3.0** · Metaplán v1.1, kap. 8

## Cíl

Po kroku 2 Struna **ví, co cvičit**. Dcera otevře aplikaci a vidí 3 úkoly na dnešek. Úkoly vycházejí z akordů, které se učí, a z domácího úkolu od učitele. Po cvičení si zapíše, co se naučila. Tohle je první verze k opravdovému každodennímu používání.

---

## 1. Kniha akordů (záložka Akordy)

**7 prvních akordů** v pořadí světa „Akordový les“: **Em, Am, E, A, D, G, C**.

| Funkce | Popis |
|---|---|
| Přehled | Mřížka karet: název, prstoklad, hvězdičky ★★☆ |
| Detail akordu | Velký prstoklad s čísly prstů (1 = ukazovák … 4 = malík), ○ = prázdná struna, × = nehraje se, tip („Palec drž za krkem kytary.“) |
| **Učím se** | Přepínač u každého akordu. Z akordů „učím se“ vybírá denní mise. Na začátku: **Em, Am** |
| **Hvězdičky** | Dcera sama hodnotí, jak jí akord jde: |
| | ★ Umím ho chytit |
| | ★★ Všechny struny zní čistě |
| | ★★★ Přehodím na něj rychle z jiného akordu |

Prstoklady a texty jsou v `content/chords.json` (česky i anglicky). Další akord se přidá bez programování.

> 🎓 **Učitel:** prosím o kontrolu prstokladů (hlavně G, ten se hraje několika způsoby). Používáme nejběžnější verze pro začátečníky.

---

## 2. Denní mise (obrazovka Dnes)

Každý den **3 úkoly**. Vyberou se ráno a během dne se nemění.

| # | Úkol | Odkud |
|---|---|---|
| 1 | **Domácí úkol od učitele**, pokud je zadaný. Jinak **rozcvička prstů** | domácí úkol |
| 2 | **Akord:** „Chyť Am a zahraj každou strunu zvlášť. Zní všechny čistě?“ | akord „učím se“ s nejméně hvězdičkami |
| 3 | Střídá se: **přehazování** („Em ↔ Am po dobu 1 minuty“) nebo **brnkání** („D D U U D U na Em“) | dva akordy „učím se“ |

- Úkol se **odškrtne klepnutím**. Dcera ho odškrtne sama: věříme jí.
- **+10 XP** za každý splněný úkol, **+10 XP bonus** za všechny 3 (max. **40 XP** denně z misí).
- Odškrtnutí jde vrátit (omylem klepnutý úkol).
- Mise se počítá i bez spuštěného časovače (např. cvičila u učitele).
- Texty úkolů jsou v `content/quests.json`.

**Nová podoba Dnes:** Pozdrav → **Dnešní mise** (3 úkoly) → kroužek s minutami + Začít cvičit → série → úroveň.

---

## 3. Domácí úkol od učitele (záložka Já)

| Funkce | Popis |
|---|---|
| Zadat úkol | Po lekci: datum lekce + text (např. „Ode to Joy, první řádek. Palec za krkem.“) |
| Kde se ukáže | Na Dnes jako 1. úkol mise, každý den až do splnění |
| Hotovo | Tlačítko „Úkol splněn“. Další lekce = nový úkol |
| Historie | Seznam starších úkolů |

---

## 4. Deník „Co jsem se naučila“ (záložka Já)

| Funkce | Popis |
|---|---|
| Kdy | **Po každém cvičení** nabídka na oslavě: „Zapsat do deníku“ (nepovinné). Taky kdykoli v záložce Já |
| Co | Tři otázky: **Co jsem se naučila** · **Kde jsem se zasekla** · **Jak to šlo** 🙁 😐 🙂 🤩 |
| Délka | Krátké. Stačí jedno slovo nebo jen smajlík |
| Seznam | Záznamy od nejnovějšího, s datem |
| XP | **+5 XP** za zápis, max. jednou denně |

Deník je základ týdenního reportu pro učitele v kroku 4.

---

## 5. Záložka Já (nová podoba)

1. **Domácí úkol**: aktuální + Přidat úkol
2. **Deník**: Zapsat + poslední záznamy
3. **Moje čísla**: minuty celkem, dny cvičení celkem, nejdelší série

---

## Pravidla XP po kroku 2 (souhrn)

| Za co | XP | Strop |
|---|---|---|
| Minuta cvičení | 1 | 30 / den |
| Splněný denní cíl | 20 | 1× denně |
| Úkol mise | 10 | 3 úkoly |
| Všechny 3 úkoly | 10 | 1× denně |
| Zápis do deníku | 5 | 1× denně |
| 7 dní série | 50 | – |

Maximum za den bez bonusu za sérii: **105 XP**. XP se dál počítá z uložené historie (D-008).

---

## Data (co se nově ukládá)

| Úložiště | Záznam | Pole |
|---|---|---|
| `missions` (nové) | mise dne | `date`, `quests[]` (`id`, `type`, `params`, `done`) |
| `homework` (nové) | domácí úkol | `id`, `lessonDate`, `text`, `doneAt` |
| `journal` (nové) | zápis v deníku | `id`, `date`, `learned`, `stuck`, `feeling` |
| `kv` → `chords` | můj pokrok v akordech | `{ Em: { stars, learning }, … }` |

Verze: `DB_VERSION` 2 → 3, `CURRENT_SCHEMA` 2 → 3 (migrace přidá prázdná úložiště a výchozí „učím se Em, Am“). Zálohy z 0.1.0 a 0.2.0 půjdou obnovit.

**Soukromí:** texty domácích úkolů a deníku zůstávají jen v telefonu a v zálohách. Na GitHub se nedostanou (D-006).

## Co krok 2 záměrně neobsahuje

Metronom, mapa světů a samolepky (krok 4), nahrávky a report pro učitele (krok 4), úvodní nastavení (krok 3).

## Hotovo, když

- [ ] Kniha akordů ukazuje 7 akordů se správnými prstoklady (zkontroloval učitel)
- [ ] Hvězdičky a „učím se“ se uloží a přežijí zavření aplikace
- [ ] Na Dnes jsou každý den 3 úkoly, během dne se nemění, odškrtnutí dá XP
- [ ] Domácí úkol se ukáže v misi, dokud není splněný
- [ ] Zápis do deníku po cvičení i ze záložky Já, se smajlíkem
- [ ] Záložka Já ukazuje úkol, deník a čísla
- [ ] Data z 0.2.0 se převedou, zálohy z 0.1.0 i 0.2.0 jdou obnovit
- [ ] Česky i anglicky, offline, všechny testy prošly, ruční checklist na iPhonu prošel

## Co od tebe potřebuju

1. **Schválit** (nebo upravit) hlavně:
   - **XP za mise:** +10 za úkol, +10 bonus za všechny 3, +5 za deník
   - **Hvězdičky hodnotí dcera sama** (podle 3 popsaných úrovní)
   - **Domácí úkol zadává** rodič nebo dcera po lekci (oba můžou)
2. **Poprosit učitele** o kontrolu 7 prstokladů. Ukážu ti je na obrázku, až budou hotové. Stavět můžu i bez toho a případně opravím jen obsah.
