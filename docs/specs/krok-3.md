# Krok 3 · Do telefonu – specifikace

> Stav: **čeká na schválení** · Cílová verze: **1.0.0** · Metaplán v1.1, kap. 8

## Cíl

Struna je **hotová první verze (1.0)**: osobní, přívětivá od prvního otevření a odladěná na každodenní používání. Kdo ji otevře poprvé, za minutu ví, co dělat. Dcera ji cítí jako „svoji“ aplikaci.

---

## 1. Úvodní průvodce (při prvním otevření)

Krátký průvodce o 5 krocích. Každý krok jde přeskočit.

| # | Obrazovka | Obsah |
|---|---|---|
| 1 | **Vítej ve Struně!** | 3 řádky: denní mise → cvičení → body a série. Tlačítko **Pojďme na to** |
| 2 | **Jak ti máme říkat?** | Přezdívka (nepovinná, max. 20 znaků) |
| 3 | **Vyber si avatara** | 8 obrázků (viz níže). Lze změnit později |
| 4 | **Kolik minut denně?** | 10 / 15 / 20 minut (výchozí 15) |
| 5 | **Přidej si Strunu na plochu** | Jen když aplikace neběží z plochy: obrázkový návod Sdílet → Přidat na plochu |
| ✓ | **Hotovo** | „Ahoj, {přezdívka}! Tvoje první mise čeká.“ → obrazovka Dnes |

**Kdo už Strunu používá** (aktualizace z 0.3.1) uvidí jen krátkou verzi: přezdívka a avatar. Data zůstávají.

### Avatary (návrh, vybere dcera)

Systémové obrázky iPhonu (emoji), takže fungují offline a nic se nestahuje:

🎸 kytara · 🦊 liška · 🐱 kočka · 🦄 jednorožec · 🐼 panda · 🦉 sova · 🐸 žabka · ⭐ hvězda

---

## 2. Osobní Struna

| Kde | Co |
|---|---|
| Dnes | Pozdrav s přezdívkou: „Dobré odpoledne, Kytaristko!“ a avatar vedle |
| Já | Karta profilu nahoře: avatar, přezdívka, úroveň |
| Nastavení | Nová sekce **Profil**: změnit přezdívku a avatara |

Bez přezdívky zůstane pozdrav jako dosud („Dobré odpoledne!“).

---

## 3. Zvuky radosti (nepovinné, návrh)

Krátké veselé zvuky:
- „cink“ za odškrtnutý úkol
- melodie za splněnou misi
- fanfára za novou úroveň

- Zvuky se **generují v aplikaci** (žádné soubory ani internet).
- Hrají jen po klepnutí (iPhone jinak zvuk nepustí). Respektují tichý režim iPhonu.
- **Vypínač v Nastavení**, výchozí: zapnuto.

---

## 4. Doladění pro verzi 1.0

| Oblast | Co |
|---|---|
| Menší iPhony | Kontrola rozložení i na iPhonu SE (375 × 667) a velkých iPhonech (430 × 932). Automatický test se snímky |
| Velké písmo | Aplikace funguje se zvětšeným písmem v iPhonu (Zpřístupnění → Větší text) |
| Prázdné stavy | Všechny obrazovky mají přívětivý text, když ještě nejsou data |
| Chyby | Kontrola všech chybových hlášek: jasně říkají, co se stalo a co udělat |
| Ikona | Zůstává současná (žlutý ozvučný otvor se strunou), pokud si dcera nepřeje jinou |
| O aplikaci | V Nastavení: verze, „Vytvořeno s láskou pro malou kytaristku“, odkaz na nápovědu (README) |
| Dokumentace | README pro uživatele (jak instalovat, zálohovat, obnovit) |

---

## Data (co se nově ukládá)

| Úložiště | Záznam | Pole |
|---|---|---|
| `kv` → `profile` (nové) | profil | `nickname`, `avatar`, `onboardedAt` |
| `kv` → `settings` | nastavení | + `sounds` (zapnuto / vypnuto) |

Verze: `CURRENT_SCHEMA` 3 → 4 (migrace přidá prázdný profil a zapne zvuky). `DB_VERSION` se nemění (žádné nové úložiště). Zálohy ze všech starších verzí půjdou obnovit.

**Soukromí:** přezdívka zůstává jen v telefonu a v zálohách (D-006). Doporučujeme přezdívku místo celého jména.

## Co krok 3 záměrně neobsahuje

Nahrávky, report pro učitele, mapa světů, samolepky a metronom (krok 4). Ladička a rodičovský pohled (krok 5).

## Hotovo, když

- [ ] Nová instalace ukáže průvodce. Po něm je nastavená přezdívka, avatar a cíl
- [ ] Aktualizace z 0.3.1 ukáže krátkého průvodce a všechna data zůstanou
- [ ] Přezdívka a avatar jsou na Dnes, v Já a dají se změnit v Nastavení
- [ ] Zvuky hrají a jdou vypnout (pokud je schválíš)
- [ ] Rozložení je v pořádku na iPhonu SE, 12 Pro a velkém iPhonu, i s větším písmem
- [ ] Všechny testy prošly, ruční checklist na iPhonu prošel
- [ ] **Verze 1.0.0** je vydaná

## Co od tebe potřebuju

1. **Schválit** (nebo upravit) průvodce a profil.
2. **Zvuky:** chceš je? (doporučuji ano, s vypínačem)
3. **Avatary:** ať dcera vybere 8 obrázků (nebo schválí můj návrh). A rozhodne, jestli chce jinou ikonu aplikace.
