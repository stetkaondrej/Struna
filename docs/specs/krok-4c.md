# Krok 4c · Nástroje – specifikace

> Stav: **postaveno ve verzi 1.3.0** · schváleno 5. 11. 2026: tempo 70, body ano, samolepka Rytmus = metronom 5 různých dní (aspoň minutu) · čeká na test na iPhonu · Cílová verze: **1.3.0** · Rozdělení kroku 4: D-019

## Cíl

Struna pomáhá cvičit **rytmus** a **rychlé přehazování akordů**, dvě věci, které začátečníky brzdí nejvíc. Díky tomu se výzvy světů 5 a 6 na mapě ověří samy, ne jen potvrzením.

---

## 1. Metronom (záložka Cvičení, pod časovačem)

| Funkce | Popis |
|---|---|
| Tempo | **40–160 úderů za minutu** (BPM), výchozí **70**. Tlačítka −5 / +5 a posuvník |
| Takt | 4 doby, **první doba zní výš** (ať dcera ví, kde začíná takt) |
| Vidět i slyšet | Doba bliká, číslo doby 1-2-3-4 |
| Rytmus brnkání | Volba: **↓ ↓ ↓ ↓** (jen dolů) nebo **↓ ↓ ↑ ↑ ↓ ↑**. Šipka, která se má právě hrát, svítí v rytmu |
| Spolu s časovačem | Metronom jde zapnout samostatně, nebo během cvičení. Displej nezhasne |
| Pamatuje si | Poslední tempo a rytmus |
| Přesnost | Zvuk se plánuje dopředu (Web Audio), takže tempo neuteče ani při zatížení telefonu |

Rytmus ↓ ↓ ↑ ↑ ↓ ↑ ve 4 dobách: **1 · 2 · 2a · 3a · 4 · 4a** (dolů na čísla, nahoru na „a“).

## 2. Výzva „1 minuta střídání akordů“ (záložka Cvičení)

Známé cvičení kytaristů: kolikrát za minutu čistě přehodíš mezi dvěma akordy?

| Krok | Popis |
|---|---|
| Výběr | Dva akordy, předvyplněné z akordů „Učím se“ (např. Em ↔ Am) |
| Start | Odpočet 3 – 2 – 1, pak běží **60 sekund** |
| Počítání | Velké tlačítko **„Přechod!“**: dcera klepne po každém čistém přechodu. Klepnout jde i loktem nebo nosem 🙂, tlačítko je přes půl obrazovky |
| Konec | Výsledek, **osobní rekord** pro tuto dvojici akordů a oslava při novém rekordu |
| Historie | Posledních 10 pokusů pro každou dvojici akordů |

## 3. Napojení na mapu a misi

| Kde | Co se změní |
|---|---|
| Svět 5 · výzva „30 s v rytmu“ | Splní se, když dcera nechá metronom běžet **30 s v rytmu ↓ ↓ ↑ ↑ ↓ ↑ s tempem aspoň 70** a pak potvrdí, že hrála |
| Svět 6 · výzva „20 přechodů za minutu“ | Splní se **sama**, jakmile má výsledek výzvy 1 minuta aspoň **20** |
| Denní mise | U úkolu **Přehazování** je tlačítko **„Spustit 1 minutu“**, u úkolu **Brnkání** tlačítko **„Metronom“** |

## Body a samolepky (návrh)

| Za co | XP |
|---|---|
| Dokončená výzva 1 minuta | **+5** (nejvýš 3× denně) |
| Nový osobní rekord | **+10** |

Nové samolepky (album bude mít **23**):
- 🥁 **Rytmus**: metronom 5 různých dní, aspoň minutu denně (upraveno vlastníkem)
- ⚡ **Rychlé prsty**: 20 přechodů za minutu

## Data

| Úložiště | Záznam | Pole |
|---|---|---|
| `changes` (nové) | pokus výzvy 1 minuta | `id`, `date`, `a`, `b`, `count` |
| `kv` → `metronome` | nastavení a čas | `bpm`, `pattern`, `totalSec` (kvůli samolepce), `steadySec` (kvůli výzvě světa 5) |

Verze: `DB_VERSION` 4 → 5, `CURRENT_SCHEMA` 6 → 7. Výsledky jsou v záloze.

## Co 4c záměrně neobsahuje

Ladička přes mikrofon (krok 5, technicky náročnější). Poznávání, jestli dcera opravdu hraje v rytmu (Struna neslyší kytaru, jen počítá čas a klepnutí).

## Hotovo, když

- [ ] Metronom drží tempo 40–160, první doba zní jinak, šipky rytmu svítí v čase
- [ ] Metronom hraje i během časovače a displej nezhasne
- [ ] Výzva 1 minuta: odpočet, 60 s, počítání klepnutí, výsledek, rekord a historie se uloží
- [ ] Výzvy světů 5 a 6 se splní podle metronomu a výsledku výzvy
- [ ] Tlačítka u úkolů mise otevřou správný nástroj
- [ ] Body a nové samolepky podle schválených pravidel
- [ ] Data z 1.2.2 se převedou, zálohy jdou obnovit
- [ ] Česky i anglicky, všechny testy prošly, ruční checklist na iPhonu prošel

## Co od tebe potřebuju

1. **Schválit** metronom a výzvu 1 minuta.
2. **Tempo:** výchozí 70, rozsah 40–160?
3. **Body:** +5 za výzvu 1 minuta (max. 3× denně), +10 za nový rekord?
4. **Samolepky:** přidat 🥁 Rytmus a ⚡ Rychlé prsty?
5. **Učitel:** jaké tempo doporučuje dceři teď? (podle toho nastavím výchozí)
