# Krok 4b · Hra – specifikace

> Stav: **postaveno ve verzi 1.2.0** · schváleno 5. 11. 2026: XP +5/+100, dcera projde mapu od začátku · čeká na test na iPhonu · melodie pro světy 3 a 7 doplní učitel · Cílová verze: **1.2.0** · Rozdělení kroku 4: D-019

## Cíl

Učení se stane **výpravou**. Dcera vidí na mapě, kde je, co ji čeká a co už zvládla. Za pokroky sbírá **samolepky**. Pořadí 7 světů potvrdil učitel (D-003).

---

## 1. Mapa výprav (záložka Mapa)

Cesta se 7 světy odshora dolů. Každý svět je kolečko se stavem:

| Stav | Vzhled |
|---|---|
| ✅ Hotovo | zelené kolečko s fajfkou |
| ⭐ Právě tady | žluté, větší, s avatarem |
| 🔒 Zamčeno | šedé se zámkem |

| # | Svět | Lekce (karty) | Výzva na konci světa | Jak se výzva ověří |
|---|---|---|---|---|
| 1 | **Kytarový tábor** | Části kytary · Jak sedět a držet kytaru · Jak držet trsátko · Ladění | Nalaď všech 6 strun sama | dcera potvrdí |
| 2 | **Strunová ulice** | Jména strun E A D G H e · Pražce · Čísla prstů | **Hra „Která struna?“**: 10 správně za sebou | **automaticky** ve Struně |
| 3 | **Rybníček prvních tónů** | Tóny na strunách e a H · Melodie po jednom tónu | Zahraj 1. řádek melodie bez zastavení | potvrzení + **nahrávka** |
| 4 | **Akordový les** | Em · Am · E · D · G · C (odkazy do knihy akordů) | 3 akordy s ★★ a víc | **automaticky** z hvězdiček |
| 5 | **Řeka rytmu** | Údery dolů · ↓ ↓ ↑ ↑ ↓ ↑ · Počítání nahlas | 30 s brnkání v rytmu | dcera potvrdí (od 4c: s metronomem) |
| 6 | **Kaňon přechodů** | Em ↔ G · Am ↔ C · D ↔ G | 20 čistých přechodů za minutu | dcera potvrdí (od 4c: počítadlo) |
| 7 | **Velké pódium** | Písnička se 2–4 akordy · Hrát a zpívat | Celá písnička | potvrzení + **nahrávka** |

### Detail světa
- **Lekce**: krátká karta (2–4 věty, česky i anglicky), tlačítko **Hotovo** (+5 XP jednou).
- **Výzva**: odemkne se po všech lekcích světa. Po splnění: **+100 XP**, samolepka světa, fanfára a další svět se odemkne.

### Kde dcera je teď
Dcera už chodí na lekce, takže svět 1 a 2 nejspíš umí. **Rodič může (za PINem) označit světy jako hotové.** Doporučuji s ní projít svět 1 a 2 v aplikaci, je to krátké a dostane za to samolepky.

### Melodie a písničky
Jen **lidové a volné** písně (bez autorských práv): např. Óda na radost, Skákal pes, Prší, prší. **Konkrétní výběr nechám na učiteli.** Do té doby jsou v lekcích obecné texty („melodie od učitele“).

---

## 2. Samolepky (záložka Já → Album)

Samolepky se **počítají z historie** (jako XP, D-008), takže se nikdy neztratí a obnova zálohy je vrátí.

| Skupina | Samolepky |
|---|---|
| Cvičení | 🎸 První cvičení · ⏱️ 100 minut · 🕐 500 minut · 🏆 1000 minut |
| Série | 🔥 3 dny v řadě · 🌟 7 dní · 💎 30 dní |
| Mise | ✅ První splněná mise · 🎯 10 splněných misí |
| Akordy | ⭐ První akord ★★★ · 🌈 3 akordy ★★★ |
| Pro učitele | 📝 První zápis v deníku · 🎙️ První nahrávka · 📨 První report učiteli |
| Světy | 7 samolepek, jedna za každý svět |

Celkem **21 samolepek**. V albu jsou nezískané samolepky jako šedá „?“ s nápovědou, jak je získat.

**Nová samolepka:** po akci (cvičení, úkol, hvězdička…) se ukáže oslava „Nová samolepka!“ se zvukem.

---

## Body XP (doplnění)

| Za co | XP |
|---|---|
| Lekce na mapě | +5 (jednou za lekci) |
| Výzva světa | +100 |

Ostatní pravidla zůstávají (D-008, krok 2).

## Data

| Úložiště | Záznam | Pole |
|---|---|---|
| `kv` → `worlds` (nové) | pokrok na mapě | `lessons` {id: datum}, `bosses` {svět: datum}, `skipped` [světy označené rodičem] |
| `kv` → `stickersSeen` (nové) | už ukázané samolepky | {id: datum} (jen kvůli oslavě, samotné samolepky se počítají) |
| `content/worlds.json` (nové) | obsah mapy | světy, lekce, výzvy (česky i anglicky) |

Verze: `CURRENT_SCHEMA` 5 → 6. Zálohy ze všech verzí jdou obnovit.

## Co 4b záměrně neobsahuje

Metronom a počítadlo přechodů (4c, potom se výzvy 5 a 6 ověří automaticky). Denní mise zatím z mapy nečerpá (můžeme přidat později).

## Hotovo, když

- [ ] Mapa ukazuje 7 světů se správným stavem
- [ ] Lekce jde odškrtnout (+5 XP), výzva se odemkne po lekcích
- [ ] Hra „Která struna?“ funguje a po 10 správných za sebou splní výzvu světa 2
- [ ] Výzva světa 4 se splní sama, když má dcera 3 akordy s ★★ a víc
- [ ] Rodič může za PINem označit světy jako hotové
- [ ] Album ukazuje 21 samolepek, nové samolepky mají oslavu
- [ ] Data z 1.1.1 se převedou, zálohy jdou obnovit, samolepky se po obnově vrátí
- [ ] Česky i anglicky, všechny testy prošly, ruční checklist na iPhonu prošel

## Co od tebe potřebuju

1. **Schválit** mapu a samolepky, nebo napsat, co změnit.
2. **XP:** +5 za lekci, +100 za výzvu světa?
3. **Kde dcera je:** které světy jí mám označit jako hotové? Nebo projde od začátku?
4. **Učitel:** které lidové melodie a písničky učí (pro svět 3 a 7)? Můžu je doplnit i později.
5. **Dcera:** ať se podívá na seznam samolepek. Chce nějakou přidat nebo změnit?
