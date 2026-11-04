# Krok 4 · Verze 2 – specifikace

> Stav: **4a ✅ hotovo** (verze 1.1.1, otestováno na iPhonu) · schváleno 5. 11. 2026: rozdělení 4a → 4b → 4c, zvuk i video, PIN ano, report přes WhatsApp, nahrávky mimo zálohu (D-017) · 4b: `docs/specs/krok-4b.md` · 4c čeká na vlastní specifikaci

## Návrh: rozdělit krok 4 na 3 menší části

Krok 4 v metaplánu obsahuje 6 funkcí. Na jeden krok je to moc (princip P6: malé kroky, pořád funkční). Navrhuji rozdělení na 3 části. Po každé je aplikace hotová a dcera ji může používat:

| Část | Obsah | Verze |
|---|---|---|
| **4a · Pro učitele** | Nahrávky cvičení, týdenní report pro učitele, rodičovský PIN | **1.1.0** |
| **4b · Hra** | Mapa 7 světů, odemykání, výzva na konci světa, samolepky | 1.2.0 |
| **4c · Nástroje** | Metronom s rytmem brnkání, výzva „1 minuta střídání akordů“ | 1.3.0 |

Pořadí jde změnit. Navrhuji začít **4a**: učitel souhlasil s reportem a spojení s ním má největší vliv na pokrok. Tato specifikace podrobně popisuje jen **4a**. Části 4b a 4c dostanou vlastní specifikaci.

---

# 4a · Pro učitele (verze 1.1.0)

## Cíl

Učitel vidí před lekcí, jak dcera cvičila: kolik, co se naučila, kde se zasekla, a **slyší ji**. Lekce se tak věnuje tomu, co opravdu potřebuje.

## 1. Nahrávky cvičení

| Funkce | Popis |
|---|---|
| Kde | Na oslavě po cvičení: **Nahrát ukázku**. A v záložce Já → Nahrávky |
| 🎙️ **Zvuk** | Nahrává se přímo ve Struně (mikrofon). Tlačítka Nahrát / Stop, max. **60 s**, přehrát a uložit nebo zahodit |
| 🎥 **Video** | Otevře kameru iPhonu, nebo výběr z Fotek. Doporučeno max. **30 s** |
| Popisek | Krátký text k nahrávce, např. „Ode to Joy, 1. řádek“. Předvyplní se z domácího úkolu |
| Seznam | Já → Nahrávky: přehrát, přejmenovat, smazat |
| Místo v telefonu | U každé nahrávky velikost. Upozornění, když jsou nahrávky dohromady větší než 200 MB |

**Doporučení: hlavně zvuk.** Minuta zvuku má asi 1 MB, minuta videa z iPhonu 100 MB i víc. Učiteli pro posouzení hry obvykle stačí slyšet.

**Mikrofon:** iPhone se při první nahrávce zeptá na povolení. Když ho odmítneš, Struna vysvětlí, jak ho zapnout v Nastavení iPhonu.

## 2. Týdenní report pro učitele

| Funkce | Popis |
|---|---|
| Kde | Já → **Report pro učitele** (za rodičovským PINem) |
| Období | Týden Po–Ne. Lze přepnout na předchozí týdny |
| Obsah | Minuty a dny cvičení · série · splněné úkoly mise · domácí úkol a jestli je splněný · zápisy z deníku (co se naučila, kde se zasekla, smajlík) · akordy a hvězdičky · vybrané nahrávky |
| Náhled | Rodič vidí přesně to, co odejde |
| Výběr nahrávek | Nahrávky z týdne jsou předem zaškrtnuté (nejvýš 3 nejnovější), jdou odškrtnout (verze 1.1.1, D-020) |
| Odeslání | **Odeslat učiteli · text + N nahrávek** otevře nabídku Sdílet → WhatsApp. Text i nahrávky odejdou **v jednom sdílení** |
| Historie | Struna si pamatuje, kdy byl report odeslán („Odesláno 9. 11.“) |

Ukázka textu reportu:

```
🎸 Struna · týden 3.–9. 11. 2026
⏱ 74 minut · 5 dní cvičení · série 🔥 5 dní
✅ Mise: 13 z 15 úkolů
📝 Domácí úkol (lekce 2. 11.): Ode to Joy, 1. řádek – splněno
💡 Naučila jsem se: Em bez koukání na prsty
🤔 Zasekla jsem se: C akord, struna H drnčí
🎼 Akordy: Em ★★★ · Am ★★☆ · E ★☆☆
🎙 Nahrávky: 1 (Ode to Joy, 0:42)
```

## 3. Rodičovský PIN

| Funkce | Popis |
|---|---|
| Co chrání | Report pro učitele a mazání nahrávek |
| Nastavení | Při prvním otevření reportu rodič zvolí 4 číslice |
| Zapomenutý PIN | Obnova přes zálohu není možná (PIN se nezálohuje). Místo toho: „Zapomněl jsem PIN“ → otázka, kterou dítě nezná (např. výsledek 17 × 23) a nový PIN |
| Bezpečnost | PIN se neukládá čitelně (jen jeho otisk, SHA-256) |

## Data (co se nově ukládá)

| Úložiště | Záznam | Pole |
|---|---|---|
| `clips` (nové) | nahrávka | `id`, `date`, `kind` (audio/video), `mime`, `seconds`, `bytes`, `title`, `blob` |
| `reports` (nové) | odeslaný report | `week` (pondělí), `sentAt`, `clipIds` |
| `kv` → `parentPin` | PIN | otisk (hash) |

Verze: `DB_VERSION` 3 → 4 (nová úložiště), `CURRENT_SCHEMA` 4 → 5.

**Zálohy a nahrávky:** nahrávky jsou velké, proto **nejsou v záložním souboru** (soubor by měl stovky MB). Záloha obsahuje jen jejich seznam. Nahrávky, které chceš uchovat, ulož tlačítkem **Uložit do Souborů** u nahrávky. *Pokud chceš nahrávky v záloze mít, napiš. Udělám zálohu ve dvou souborech.*

**Soukromí:** nahrávky a report opouštějí telefon jen tehdy, když je rodič odešle (D-006, P7).

## Co 4a záměrně neobsahuje

Mapa světů a samolepky (4b), metronom a výzva 1 minuta (4c), automatické odesílání nebo cloud (krok 5).

## Hotovo, když

- [ ] Zvuk se nahraje ve Struně, přehraje se a uloží. Funguje i bez internetu
- [ ] Video z kamery i z Fotek se uloží a přehraje
- [ ] Nahrávky přežijí zavření aplikace i restart telefonu
- [ ] Report ukazuje správná čísla týdne (ověřeno automatickými testy)
- [ ] Odeslání otevře nabídku Sdílet s textem a vybranými nahrávkami. Učitel je opravdu dostane (test s učitelem přes WhatsApp)
- [ ] PIN chrání report a mazání nahrávek
- [ ] Data z 1.0.0 se převedou, zálohy ze všech verzí jdou obnovit
- [ ] Česky i anglicky, všechny testy prošly, ruční checklist na iPhonu prošel

## Co od tebe potřebuju

1. **Rozdělení** kroku 4 na 4a → 4b → 4c: souhlasíš? A v tomto pořadí?
2. **Nahrávky:** zvuk i video, nebo jen zvuk? (doporučuji obojí, s doporučením zvuku)
3. **PIN:** chceš ho? (doporučuji ano, je jednoduchý)
4. **Zálohy:** nahrávky mimo zálohu (doporučuji), nebo v záloze?
5. **Učitel:** přes co chce report dostávat (WhatsApp, Zprávy, e-mail)?
