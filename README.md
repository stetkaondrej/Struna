# Struna 🎸

Hravý pomocník pro cvičení na akustickou kytaru. Webová aplikace pro iPhone.
Doplňuje lekce s učitelem: krátké denní mise, viditelný pokrok a týdenní report pro učitele.

**Aplikace:** https://stetkaondrej.github.io/Struna/

## Nápověda

### Instalace na iPhone
1. Otevři odkaz výše v **Safari**.
2. Klepni na **Sdílet** (čtvereček se šipkou nahoru).
3. Vyber **Přidat na plochu** a potvrď **Přidat**.
4. Strunu teď spouštěj z ikony na ploše. Data se ukládají jen v telefonu.

### Jak Struna funguje
- **Dnes**: denní mise se 3 úkoly, tlačítko **Začít cvičit**, série dní 🔥 a úroveň.
- **Cvičení**: časovač. Displej během cvičení nezhasne. Když aplikaci zavřeš, časovač běží dál.
- **Akordy**: prstoklady 7 akordů. Zapni **Učím se** a dávej si hvězdičky ★.
- **Já**: domácí úkol od učitele, deník „Co jsem se naučila“, profil a čísla.

### Body XP
1 XP za minutu (max. 30 denně) · +20 za splněný denní cíl · +10 za úkol mise (+10 za všechny tři) · +5 za zápis do deníku · +50 za každých 7 dní série. Den se počítá od 5 minut cvičení, 2 dny volna týdně sérii nepřeruší.

### Záloha (doporučujeme jednou týdně)
1. **Nastavení → Zálohovat**.
2. V nabídce vyber **Uložit do Souborů** nebo **Drive**.
3. Struna sama připomene zálohu, když je starší než 14 dní.

### Obnova ze zálohy (nový telefon, smazaná aplikace)
1. Nainstaluj Strunu podle návodu výše.
2. **Nastavení → Obnovit ze zálohy** → vyber soubor `struna-zaloha-….json` → **Obnovit**.
3. Vrátí se všechna cvičení, mise, úkoly, deník i profil.

### Aktualizace
Když vyjde nová verze, Struna ukáže lištu **„Je k dispozici nová verze“**. Klepni na **Aktualizovat**. Data zůstanou.

## Stav projektu

| Krok | Obsah | Stav |
|---|---|---|
| 0 · Základy | Kostra, offline, ukládání, zálohy, jazyky | ✅ verze 0.1.0, otestováno na iPhonu |
| 1 · Jádro MVP | Dnes, časovač, streak, XP | ✅ verze 0.2.0, otestováno na iPhonu |
| 2 · MVP komplet | Akordy, denní mise, domácí úkol, deník | ✅ verze 0.3.1, otestováno na iPhonu |
| 3 · Do telefonu | Úvodní průvodce, profil, zvuky, doladění | 🧪 verze 1.0.0, čeká na test na iPhonu |
| 4 · Verze 2 | Nahrávky, report pro učitele, mapa, metronom | – |
| 5 · Verze 3 | Ladička, zvukový deník, rodičovský pohled | – |

Podrobnosti: [docs/metaplan.md](docs/metaplan.md) · rozhodnutí: [docs/decisions.md](docs/decisions.md) · změny: [CHANGELOG.md](CHANGELOG.md)

## Pro vývojáře

Čisté HTML, CSS a JavaScript. Žádné knihovny, žádný build.

```bash
npm test            # automatické testy (Node.js 22+)
npm run test:e2e    # test v prohlížeči (potřebuje Playwright)
npm run serve       # spustí aplikaci na http://localhost:8080
```

Struktura složek a pravidla jsou v [docs/metaplan.md](docs/metaplan.md), kapitola 5.

## Soukromí

Repozitář je veřejný. Nikdy do něj nepatří jméno dítěte, fotky, nahrávky ani kontakty (rozhodnutí D-006).
