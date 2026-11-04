# Struna 🎸

Hravý pomocník pro cvičení na akustickou kytaru. Webová aplikace pro iPhone.
Doplňuje lekce s učitelem: krátké denní mise, viditelný pokrok a týdenní report pro učitele.

**Aplikace:** https://stetkaondrej.github.io/Struna/

## Instalace na iPhone

1. Otevři odkaz výše v **Safari**.
2. Klepni na **Sdílet** (čtvereček se šipkou nahoru).
3. Vyber **Přidat na plochu** a potvrď **Přidat**.
4. Strunu teď spouštěj z ikony na ploše. Data se ukládají jen v telefonu.

## Stav projektu

| Krok | Obsah | Stav |
|---|---|---|
| 0 · Základy | Kostra, offline, ukládání, zálohy, jazyky | ✅ verze 0.1.0, otestováno na iPhonu |
| 1 · Jádro MVP | Dnes, časovač, streak, XP | 📝 specifikace čeká na schválení |
| 2 · MVP komplet | Akordy, domácí úkol, deník | – |
| 3 · Do telefonu | Úvodní nastavení, finální ikona | – |
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
