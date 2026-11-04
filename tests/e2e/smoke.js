// Test v prohlížeči s emulací iPhonu 12 Pro: spustí aplikaci a projde hlavní scénáře.
// Spuštění: npm run test:e2e   (potřebuje Playwright: npm i -D playwright, nebo globální instalaci)
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'test-results');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

// Malý server, který podává soubory aplikace (jako GitHub Pages).
const server = createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(root, urlPath.endsWith('/') ? `${urlPath}index.html` : urlPath);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
await mkdir(outDir, { recursive: true });

const { defaultBrowserType, ...iphone } = devices['iPhone 12 Pro'];
// Náhradní mikrofon prohlížeče, aby šlo testovat nahrávání zvuku.
const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const context = await browser.newContext({
  ...iphone, deviceScaleFactor: 1, acceptDownloads: true, locale: 'cs-CZ', timezoneId: 'Europe/Prague',
  permissions: ['microphone', 'clipboard-read', 'clipboard-write'],
});
const page = await context.newPage();
// Okno „Nová samolepka!“ se v testu zavře samo, aby nepřekáželo dalším klepnutím.
let stickerPopups = 0;
const autoCloseStickers = (p) => p.addLocatorHandler(p.locator('#sticker-pop'), async () => {
  stickerPopups += 1;
  await p.click('#sticker-close');
});
await autoCloseStickers(page);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

let passed = 0;
async function step(name, fn) {
  await fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const text = (sel) => page.locator(sel).first().textContent();
const waitText = (sel, want) => page.waitForFunction(
  ([s, w]) => document.querySelector(s)?.textContent.includes(w), [sel, want], { timeout: 5000 });
const waitTextOn = (p, sel, want) => p.waitForFunction(
  ([s, w]) => document.querySelector(s)?.textContent.includes(w), [sel, want], { timeout: 5000 });
const tab = async (route) => {
  await page.click(`#tabbar a[href="#${route}"]`);
  await page.waitForSelector(`#main .screen[data-route="${route}"]`);
};
const minutes = (n) => page.clock.fastForward(n * 60 * 1000);
// Projde průvodce co nejrychleji (Přeskočit / Další), až se objeví obrazovka Dnes.
async function skipOnboarding(p = page) {
  await p.waitForSelector('.onb');
  for (let i = 0; i < 10; i++) {
    const step = await p.getAttribute('.onb', 'data-step');
    const skip = p.locator('#onb-skip');
    await (await skip.count() ? skip : p.locator('#onb-next')).click();
    if (step === 'done') break;
    await p.waitForFunction((prev) => document.querySelector('.onb')?.dataset.step !== prev, step);
  }
  await p.waitForSelector('#start');
}
// Text v kroužku časovače musí ležet celý uvnitř vnitřního kruhu (nesmí zasahovat do čáry).
async function assertTextInsideRing(p, label) {
  const bad = await p.evaluate(() => {
    const ring = document.querySelector('.ring-lg');
    const r = ring.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const inner = r.width / 2 - r.width * (18 / 240); // poloměr bez tloušťky čáry
    const out = [];
    for (const el of ring.querySelectorAll('.ring-inner > *')) {
      const range = document.createRange();
      range.selectNodeContents(el);
      for (const b of range.getClientRects()) { // každý řádek textu zvlášť
        for (const [x, y] of [[b.left, b.top], [b.right, b.top], [b.left, b.bottom], [b.right, b.bottom]]) {
          const d = Math.hypot(x - cx, y - cy);
          if (d > inner + 1) out.push(`${el.id || el.className}: ${Math.round(d)} > ${Math.round(inner)}`);
        }
      }
    }
    return out;
  });
  assert.deepEqual(bad, [], `${label}: text přesahuje kroužek`);
}

// Stránka se nesmí posouvat do stran (nic nepřetéká přes okraj displeje).
async function assertNoSideScroll(p, label) {
  const { sw, iw } = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  assert.ok(sw <= iw, `${label}: stránka je širší než displej (${sw} > ${iw})`);
}
const readKv = () => page.evaluate(() => new Promise((res) => {
  const r = indexedDB.open('struna');
  r.onsuccess = () => {
    const os = r.result.transaction('kv').objectStore('kv');
    const keys = os.getAllKeys();
    keys.onsuccess = () => { res(keys.result); r.result.close(); };
  };
}));

try {
  console.log('Struna · test v prohlížeči (iPhone 12 Pro)');

  await step('data z verze 0.1.0 se převedou (testovací počitadlo zmizí, nastavení zůstane)', async () => {
    await page.clock.install({ time: new Date('2026-11-04T17:00:00+01:00') }); // středa 17:00
    await page.goto(`${base}priprava`); // stejná adresa, ale bez aplikace
    await page.evaluate(() => new Promise((res, rej) => {
      const r = indexedDB.open('struna', 1);
      r.onupgradeneeded = () => { r.result.createObjectStore('kv'); r.result.createObjectStore('meta'); };
      r.onsuccess = () => {
        const tx = r.result.transaction(['kv', 'meta'], 'readwrite');
        tx.objectStore('kv').put(5, 'testCounter');
        tx.objectStore('kv').put({ lang: 'cs' }, 'settings');
        tx.objectStore('meta').put(1, 'schemaVersion');
        tx.oncomplete = () => { r.result.close(); res(); };
        tx.onerror = () => rej(tx.error);
      };
    }));
    await page.goto(base);
    await page.waitForSelector('.onb');
    const keys = await readKv();
    assert.ok(!keys.includes('testCounter'), 'testovací počitadlo mělo zmizet');
    assert.ok(keys.includes('settings'));
    assert.ok(keys.includes('profile'));
  });

  await step('úvodní průvodce: vítání, přezdívka, avatar, cíl, návod na plochu', async () => {
    await page.waitForSelector('.onb[data-step="welcome"]');
    assert.equal(await page.isHidden('#tabbar'), true, 'během průvodce se lišta schová');
    await waitText('.onb', 'Krok 1 z 5');
    await page.screenshot({ path: path.join(outDir, 'pruvodce-vitej.png') });
    await page.click('#onb-next');
    await page.fill('#onb-name', 'Kytaristko');
    await page.click('#onb-next');
    await page.click('[data-avatar="fox"]');
    await page.screenshot({ path: path.join(outDir, 'pruvodce-avatar.png') });
    await page.click('#onb-next');
    await page.waitForSelector('.onb[data-step="goal"] [data-goal="15"][aria-pressed="true"]');
    await page.click('#onb-back'); // zpět na avatar: výběr zůstal
    await page.waitForSelector('[data-avatar="fox"][aria-checked="true"]');
    await page.click('#onb-next');
    await page.click('#onb-next');
    await page.waitForSelector('.onb[data-step="install"]');
    await page.click('#onb-next');
    await waitText('.onb[data-step="done"]', 'Ahoj, Kytaristko!');
    await page.screenshot({ path: path.join(outDir, 'pruvodce-hotovo.png') });
    await page.click('#onb-next');
    await page.waitForSelector('#start');
    assert.equal(await page.isVisible('#tabbar'), true);
  });

  await step('Dnes: pozdrav, prázdný pokrok, výzva k sérii', async () => {
    assert.equal(await page.title(), 'Struna');
    assert.equal(await page.locator('#tabbar a').count(), 5);
    assert.equal(await text('.hello'), 'Dobré odpoledne, Kytaristko!');
    assert.equal(await text('.hello-row .avatar-face'), '🦊');
    await waitText('.today-card', '0 z 15 min');
    assert.equal(await text('#streak'), 'Začni sérii ještě dnes!');
    await page.screenshot({ path: path.join(outDir, 'dnes-prazdne.png') });
  });

  await step('časovač běží, přežije přenačtení a pauza ho zastaví', async () => {
    await page.click('#start');
    await page.waitForSelector('#clock');
    await minutes(6);
    await waitText('#clock', '06:00');
    await page.reload();
    await page.waitForSelector('#clock');
    await waitText('#clock', '06:0');
    await page.screenshot({ path: path.join(outDir, 'cviceni.png') });
    await assertTextInsideRing(page, 'iPhone 12 Pro');
    await page.click('#pause');
    await waitText('#status', 'Pozastaveno');
    const paused = await text('#clock');
    await minutes(5);
    assert.equal(await text('#clock'), paused, 'během pauzy čas stojí');
    await page.click('#resume');
    await minutes(1);
    await waitText('#clock', '07:0');
  });

  await step('Hotovo uloží cvičení a ukáže XP', async () => {
    await page.click('#finish');
    await page.waitForSelector('#done');
    assert.equal(await text('.xp-big'), '+7 XP');
    await page.screenshot({ path: path.join(outDir, 'hotovo.png') });
    await page.click('#home');
    await waitText('.today-card', '7 z 15 min');
    assert.equal(await text('#streak'), '🔥 1 den v řadě');
    assert.equal(await text('#level'), 'Úroveň 1');
    assert.equal(await text('.xp-num'), '7 / 100 XP');
  });

  await step('splněný denní cíl dá +20 XP', async () => {
    await page.click('#start');
    await page.waitForSelector('#clock');
    await minutes(9);
    await page.click('#finish');
    await page.waitForSelector('#done');
    assert.equal(await text('.xp-big'), '+29 XP');
    await waitText('#done', 'Dnešní cíl splněn!');
    await page.click('#home');
    await waitText('.today-card', 'Dnešní cíl splněn!');
    await page.screenshot({ path: path.join(outDir, 'dnes-splneno.png') });
  });

  await step('cvičení kratší než minuta se neuloží', async () => {
    await tab('cviceni');
    await page.click('#start');
    await page.clock.fastForward(30 * 1000);
    await page.click('#finish');
    await waitText('#toast', 'kratší než minuta');
    await page.waitForSelector('#start');
  });

  await step('po hodině se zeptá „Pořád cvičíš?“ a uloží jen hodinu (strop 30 XP za den)', async () => {
    await page.click('#start');
    await minutes(61);
    await page.waitForSelector('#check', { timeout: 5000 });
    await page.click('#check-save');
    await page.waitForSelector('#done');
    await waitText('#done', 'Zapsáno: 60 min');
    assert.equal(await text('.xp-big'), '+14 XP', '7 + 9 + 60 min → strop 30 XP, předtím 16');
    await page.click('#home');
  });

  await step('denní cíl jde změnit v Nastavení', async () => {
    await page.click('#top-action');
    await page.click('[data-goal="10"]');
    await page.waitForSelector('[data-goal="10"][aria-pressed="true"]');
    await page.screenshot({ path: path.join(outDir, 'nastaveni.png'), fullPage: true });
    await page.click('#top-action');
    await waitText('.today-card', 'z 10 min');
  });

  await step('angličtina', async () => {
    await page.click('#top-action');
    await page.click('[data-lang="en"]');
    await page.click('#top-action');
    await waitText('#start', 'Start practice');
    assert.equal(await text('#streak'), '🔥 1 day in a row');
    await page.click('#top-action');
    await page.click('[data-lang="cs"]');
    await page.waitForSelector('[data-lang="cs"][aria-pressed="true"]');
  });

  await step('profil a zvuky v Nastavení', async () => {
    await tab('dnes');
    await page.click('#top-action');
    await page.waitForSelector('#profile-settings');
    assert.equal(await page.inputValue('#nickname'), 'Kytaristko');
    await page.fill('#nickname', 'Hvězdo');
    await page.click('#name-form button[type="submit"]');
    await waitText('#toast', 'Profil je uložený');
    await page.click('[data-avatar="star"]');
    await page.waitForSelector('[data-avatar="star"][aria-checked="true"]');
    await page.click('#sounds');
    await page.waitForSelector('#sounds[aria-pressed="false"]');
    await page.reload();
    await page.waitForSelector('#sounds[aria-pressed="false"]');
    await page.waitForSelector('[data-avatar="star"][aria-checked="true"]');
    await page.click('#sounds');
    await page.waitForSelector('#sounds[aria-pressed="true"]');
    await page.click('#top-action');
    await waitText('.hello', 'Hvězdo');
    await tab('ja');
    await waitText('#profile', 'Hvězdo');
  });

  await step('denní mise: 3 úkoly, odškrtnutí dá XP, všechny tři bonus', async () => {
    await tab('dnes');
    await page.waitForSelector('#mission');
    assert.equal(await page.locator('[data-quest]').count(), 3);
    await waitText('[data-quest="q1"]', 'Rozcvička prstů');
    assert.match(await text('[data-quest="q2"]'), /Akord (Em|Am)/);
    await waitText('.xp-num', '50 /'); // 76 min dnes → 30 + cíl 20
    await page.click('[data-quest="q1"]');
    await waitText('#mission .pill', '1 ze 3 · +10 XP');
    await waitText('.xp-num', '60 /');
    await page.click('[data-quest="q2"]');
    await page.waitForSelector('[data-quest="q2"][aria-pressed="true"]');
    await page.click('[data-quest="q3"]');
    await waitText('#toast', 'Mise splněna');
    await waitText('.xp-num', '90 /');
    await page.click('[data-quest="q3"]'); // omyl: vrátit
    await waitText('.xp-num', '70 /');
    await page.click('[data-quest="q3"]');
    await waitText('.xp-num', '90 /');
    await page.screenshot({ path: path.join(outDir, 'dnes-mise.png'), fullPage: true });
  });

  await step('kniha akordů: 7 akordů, hvězdičky a „Učím se“ se uloží', async () => {
    await tab('akordy');
    assert.equal(await page.locator('[data-chord]').count(), 7);
    await page.screenshot({ path: path.join(outDir, 'akordy.png'), fullPage: true });
    await page.click('[data-chord="Am"]');
    await page.waitForSelector('.chord-detail');
    await page.click('[data-stars="2"]');
    await page.waitForSelector('[data-stars="2"][aria-pressed="true"]');
    await page.screenshot({ path: path.join(outDir, 'akord-detail.png'), fullPage: true });
    await page.click('#back');
    await page.click('[data-chord="E"]');
    await page.click('#learning');
    await page.waitForSelector('#learning[aria-pressed="true"]');
    await page.click('#back');
    await page.click('[data-chord="Em"]');
    await page.click('#learning');
    await page.waitForSelector('#learning[aria-pressed="false"]');
    await page.reload();
    await page.waitForSelector('[data-chord="Am"]');
    assert.equal((await text('[data-chord="Am"] .stars')).trim(), '★★☆');
  });

  await step('aspoň jeden akord musí zůstat „Učím se“', async () => {
    for (const id of ['Am', 'E']) {
      await page.click(`[data-chord="${id}"]`);
      if (id === 'Am') {
        await page.click('#learning');
        await page.waitForSelector('#learning[aria-pressed="false"]');
      } else {
        await page.click('#learning');
        await waitText('#toast', 'Aspoň jeden akord');
        assert.equal(await page.getAttribute('#learning', 'aria-pressed'), 'true');
      }
      await page.click('#back');
    }
    await page.click('[data-chord="Am"]');
    await page.click('#learning'); // Am zase zapnout
    await page.waitForSelector('#learning[aria-pressed="true"]');
    await page.click('#back');
  });

  await step('domácí úkol: prázdný se neuloží, nový se uloží', async () => {
    await tab('ja');
    await page.click('#hw-add');
    await page.click('#hw-form button[type="submit"]');
    await waitText('#hw-error', 'Napiš, co máš cvičit');
    await page.fill('#hw-text', 'Ode to Joy, první řádek. Palec za krkem.');
    await page.click('#hw-form button[type="submit"]');
    await waitText('#toast', 'příští denní misi'); // dnešní rozcvička už je odškrtnutá
    await waitText('#homework', 'Ode to Joy, první řádek');
  });

  await step('deník ze záložky Já: +5 XP jen jednou denně', async () => {
    await page.click('#j-add');
    await page.click('#journal-form button[type="submit"]');
    await waitText('#j-error', 'Napiš aspoň slovo');
    await page.fill('#j-learned', 'Em bez koukání na prsty');
    await page.click('[data-feeling="great"]');
    await page.click('#journal-form button[type="submit"]');
    await waitText('#toast', '+5 XP');
    await waitText('#journal', 'Em bez koukání na prsty');
    await page.click('#j-add');
    await page.fill('#j-stuck', 'C akord');
    await page.click('#journal-form button[type="submit"]');
    // druhý zápis téhož dne už XP nedává
    await page.waitForFunction(() => document.getElementById('toast').textContent === 'Zapsáno do deníku.');
    await page.screenshot({ path: path.join(outDir, 'ja.png'), fullPage: true });
  });

  await step('další den: nová mise s domácím úkolem a nejslabším akordem', async () => {
    await page.clock.fastForward(24 * 60 * 60 * 1000);
    await page.goto(`${base}#dnes`);
    await page.reload();
    await page.waitForSelector('#mission');
    await waitText('#mission .pill', '0 ze 3');
    await waitText('[data-quest="q1"]', 'Ode to Joy, první řádek');
    await waitText('[data-quest="q2"]', 'Akord E'); // Am má 2 hvězdičky, E nula, Em se už neučí
  });

  await step('deník po cvičení', async () => {
    await page.click('#start');
    await minutes(2);
    await page.click('#finish');
    await page.waitForSelector('#done');
    await page.click('#journal');
    await page.fill('#j-learned', 'Akord E');
    await page.click('[data-feeling="happy"]');
    await page.click('#journal-form button[type="submit"]');
    await waitText('#toast', '+5 XP');
    await page.waitForSelector('#mission');
    await tab('ja');
    await waitText('#stat-minutes', '78');
  });

  let backupPath;
  await step('nahrávka zvuku ve Struně (název z domácího úkolu)', async () => {
    await tab('ja');
    await page.click('#clip-add');
    await page.click('#rec-audio');
    await page.waitForSelector('#rec-time');
    await page.waitForTimeout(1200); // skutečný čas pro nahrávání
    await page.clock.fastForward(3000);
    await page.click('#rec-stop');
    await page.waitForSelector('#clip-form audio');
    assert.match(await page.inputValue('#clip-title'), /^Ode to Joy/);
    await page.click('#clip-form button[type="submit"]');
    await waitText('#toast', 'Nahrávka je uložená');
    await page.waitForSelector('#clips [data-play]');
    assert.equal(await page.locator('#clips [data-play]').count(), 1);
  });

  await step('video z Fotek, přehrání a přejmenování', async () => {
    await page.click('#clip-add');
    await page.setInputFiles('#rec-pick', { name: 'video.mp4', mimeType: 'video/mp4', buffer: Buffer.from('není to opravdové video') });
    await page.waitForSelector('#clip-form video');
    await page.fill('#clip-title', 'Brnkání video');
    await page.click('#clip-form button[type="submit"]');
    await waitText('#toast', 'Nahrávka je uložená');
    await page.waitForFunction(() => document.querySelectorAll('#clips [data-play]').length === 2);
    const audioRow = page.locator('#clips li', { hasText: 'Ode to Joy' });
    await audioRow.locator('[data-play]').click();
    await audioRow.locator('audio').waitFor();
    await audioRow.locator('[data-rename]').click();
    await audioRow.locator('input').fill('Ode to Joy – 1. řádek');
    await audioRow.locator('button[type="submit"]').click();
    await waitText('#clips', 'Ode to Joy – 1. řádek');
    await waitText('#clips', 'Nahrávky nejsou v záloze');
    await page.screenshot({ path: path.join(outDir, 'nahravky.png'), fullPage: true });
  });

  await step('report pro učitele: vytvoření PINu, náhled, nahrávka, kopie textu', async () => {
    await page.click('#open-report');
    await page.waitForSelector('#pin');
    await page.fill('#pin', '12');
    await page.click('#pin-form button[type="submit"]');
    await waitText('#pin-error', 'přesně 4 číslice');
    await page.fill('#pin', '1234');
    await page.click('#pin-form button[type="submit"]');
    await page.fill('#pin2', '1234');
    await page.click('#pin-form button[type="submit"]');
    await waitText('#toast', 'PIN je nastavený');
    await page.waitForSelector('#report-text');
    const text = await page.textContent('#report-text');
    assert.match(text, /^🎸 Struna · Hvězdo · týden/);
    assert.match(text, /⏱ 78 minut · 2 dní cvičení/);
    assert.match(text, /📝 Domácí úkol \(lekce .*\): Ode to Joy, první řádek\. Palec za krkem\. – ještě se cvičí/);
    assert.match(text, /💡 Co jsem se naučila: Em bez koukání na prsty/);
    assert.match(text, /🤔 Kde jsem se zasekla: C akord/);
    // Nahrávky týdne jsou předem zaškrtnuté a odejdou spolu s textem
    assert.equal(await page.locator('[data-clip]:checked').count(), 2);
    await waitText('#report-text', '🎙 Nahrávky (2)');
    await waitText('#send', 'text + 2 nahrávky');
    await page.screenshot({ path: path.join(outDir, 'report.png'), fullPage: true });

    // Náhradní nabídka Sdílet: zapamatuje si, co dostala
    await page.evaluate(() => {
      window.__shares = [];
      navigator.canShare = () => true;
      navigator.share = async (d) => { window.__shares.push({ text: d.text, files: (d.files || []).map((f) => `${f.name}|${f.type}|${f.size}`) }); };
    });
    await page.click('#send');
    await waitText('#toast', 'Report je odeslaný');
    const shares = await page.evaluate(() => window.__shares);
    assert.equal(shares.length, 1, 'jedno sdílení');
    assert.equal(shares[0].text, await page.textContent('#report-text'), 'text reportu v témže sdílení');
    assert.equal(shares[0].files.length, 2, 'obě nahrávky v témže sdílení');
    assert.ok(shares[0].files.some((f) => f.startsWith('Ode to Joy')), shares[0].files.join(', '));
    assert.ok(shares[0].files.some((f) => f.startsWith('Brnkání video.mp4|video/mp4')), shares[0].files.join(', '));
    await waitText('#main', 'Odesláno');

    // Když iPhone neumí poslat text spolu se soubory: odejdou nahrávky a text je ve schránce
    await page.evaluate(() => { window.__shares = []; navigator.canShare = (d) => !(d.text && d.files); });
    await page.click('#send');
    await waitText('#toast', 'Text reportu je ve schránce');
    assert.equal((await page.evaluate(() => window.__shares))[0].files.length, 2);
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), await page.textContent('#report-text'));

    // Odškrtnutí nahrávky ji ze zprávy vynechá
    await page.uncheck('[data-clip] >> nth=1');
    await waitText('#report-text', '🎙 Nahrávky (1)');
    await waitText('#send', 'text + 1 nahrávka');
    await page.evaluate(() => { delete navigator.share; delete navigator.canShare; });
    await page.click('#prev');
    await waitText('#report-text', 'Tento týden zatím bez cvičení');
    await page.click('#next');
    await waitText('#report-text', '78 minut');
  });

  await step('PIN chrání mazání nahrávek a po 5 minutách se ptá znovu', async () => {
    await page.clock.fastForward(6 * 60 * 1000);
    await tab('ja');
    const row = page.locator('#clips li', { hasText: 'Brnkání video' });
    await row.locator('[data-delete]').click();
    await row.locator('#pin').fill('0000');
    await row.locator('#pin-form button[type="submit"]').click();
    await waitText('#pin-error', 'Špatný PIN');
    await row.locator('#pin').fill('1234');
    await row.locator('#pin-form button[type="submit"]').click();
    await waitText('#toast', 'Nahrávka je smazaná');
    await page.waitForFunction(() => document.querySelectorAll('#clips [data-play]').length === 1);
  });

  await step('zapomenutý PIN: početní otázka a nový PIN', async () => {
    await page.clock.fastForward(6 * 60 * 1000);
    await page.click('#open-report');
    await page.click('#pin-forgot');
    const q = await page.textContent('#pin-form p');
    const [, a, b] = q.match(/(\d+) × (\d+)/);
    await page.fill('#pin-answer', '1');
    await page.click('#pin-form button[type="submit"]');
    await waitText('#pin-error', 'To není správně');
    await page.fill('#pin-answer', String(Number(a) * Number(b)));
    await page.click('#pin-form button[type="submit"]');
    await page.fill('#pin', '5678');
    await page.click('#pin-form button[type="submit"]');
    await page.fill('#pin2', '5678');
    await page.click('#pin-form button[type="submit"]');
    await page.waitForSelector('#report-text');
  });

  await step('mapa: 7 světů, na začátku jen Kytarový tábor', async () => {
    await tab('mapa');
    assert.equal(await page.locator('.map-world').count(), 7);
    assert.deepEqual(await page.$$eval('.map-world', (els) => els.map((e) => e.className.replace('map-world ', ''))),
      ['current', 'locked', 'locked', 'locked', 'locked', 'locked', 'locked']);
    await page.screenshot({ path: path.join(outDir, 'mapa.png'), fullPage: true });
  });

  await step('svět 1: lekce, potom výzva, odemkne se svět 2', async () => {
    await page.click('.map-text[data-world="1"]');
    await waitText('#boss', 'Výzva se odemkne po všech lekcích');
    for (let i = 0; i < 4; i++) await page.click('[data-lesson] >> nth=0');
    await page.click('#boss-confirm');
    await waitText('#toast', 'Kytarový tábor je hotový');
    await page.click('#back');
    await page.waitForSelector('.map-world.done .map-node[data-world="1"]');
    await page.waitForSelector('.map-world.current .map-node[data-world="2"]');
  });

  await step('hra „Která struna?“: chyba vynuluje, 10 správně splní výzvu', async () => {
    await page.click('.map-text[data-world="2"]');
    for (let i = 0; i < 3; i++) await page.click('[data-lesson] >> nth=0');
    await page.click('#boss-quiz');
    await page.waitForSelector('#quiz');
    await page.screenshot({ path: path.join(outDir, 'hra-struna.png'), fullPage: true });
    const answer = async () => Number(await page.getAttribute('#quiz', 'data-answer'));
    await page.click(`[data-answer="${(await answer() + 1) % 6}"]`); // schválně špatně
    await waitText('#quiz-msg', 'Byla to struna');
    await waitText('#quiz-streak', '0 z 10');
    for (let i = 0; i < 10; i++) await page.click(`[data-answer="${await answer()}"]`);
    await waitText('#toast', 'Strunová ulice je hotový');
    await waitText('#boss', 'Výzva splněna');
  });

  await step('rodič přeskočí svět 3 (PIN), Akordový les se splní sám podle hvězdiček', async () => {
    await page.click('#back');
    await page.click('.map-text[data-world="3"]');
    await page.click('#skip');
    if (await page.locator('#pin').count()) {
      await page.fill('#pin', '5678');
      await page.click('#pin-form button[type="submit"]');
    }
    await waitText('#toast', 'označený jako hotový');
    await page.click('#back');
    await page.click('.map-text[data-world="4"]');
    for (let i = 0; i < 3; i++) await page.click('[data-lesson] >> nth=0');
    await waitText('#boss', 'z 3');
    await tab('akordy');
    for (const id of ['E', 'G']) {
      await page.click(`[data-chord="${id}"]`);
      await page.click('[data-stars="2"]');
      await page.waitForSelector('[data-stars="2"][aria-pressed="true"]');
      await page.click('#back');
    }
    await tab('mapa');
    await waitText('#toast', 'Akordový les je hotový');
    await page.waitForSelector('.map-world.done .map-node[data-world="4"]');
    await page.waitForSelector('.map-world.current .map-node[data-world="5"]');
  });

  await step('album samolepek a oslava nových samolepek', async () => {
    await tab('ja');
    await page.waitForSelector('#album');
    const earned = await page.$$eval('#album .sticker.earned', (els) => els.map((e) => e.dataset.sticker));
    for (const id of ['practice1', 'mission1', 'journal1', 'clip1', 'world1', 'world2', 'world3', 'world4']) {
      assert.ok(earned.includes(id), `chybí samolepka ${id} (má: ${earned.join(', ')})`);
    }
    assert.ok(!earned.includes('world5'));
    await waitText('#album', `${earned.length} z 21`);
    assert.ok(stickerPopups > 0, 'oslava nové samolepky se ukázala');
    await page.screenshot({ path: path.join(outDir, 'album.png'), fullPage: true });
  });

  await step('záloha obsahuje cvičení, mise, úkoly a deník', async () => {
    await tab('dnes');
    await page.click('#top-action');
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#backup')]);
    backupPath = path.join(outDir, download.suggestedFilename());
    await download.saveAs(backupPath);
    const data = JSON.parse(await readFile(backupPath, 'utf8'));
    assert.equal(data.schemaVersion, 6);
    const kv = Object.fromEntries(data.stores.kv);
    assert.ok(kv.worlds.bosses[1] && kv.worlds.bosses[2], 'pokrok na mapě je v záloze');
    assert.ok(!('clips' in data.stores), 'nahrávky nejsou v záloze');
    assert.ok(Array.isArray(data.stores.reports));
    assert.equal(data.stores.sessions.length, 4);
    assert.equal(data.stores.missions.length, 2);
    assert.equal(data.stores.homework.length, 1);
    assert.equal(data.stores.journal.length, 3);
  });

  await step('záloha z verze 0.1.0 jde obnovit', async () => {
    const old = { app: 'struna', schemaVersion: 1, appVersion: '0.1.0', exportedAt: '2026-11-04T19:00:00.000Z',
      stores: { kv: [['testCounter', 3], ['settings', { lang: 'cs' }]] } };
    await page.setInputFiles('#restore-file', { name: 'struna-zaloha-2026-11-04.json', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(old)) });
    await page.click('#restore-yes');
    await waitText('#toast', 'obnovená');
    await skipOnboarding(); // stará záloha nemá profil: průvodce se ukáže hned znovu
    await waitText('.today-card', '0 z 15 min');
    await tab('ja');
    await waitText('#clips', 'Ode to Joy – 1. řádek'); // obnova zálohy nahrávky nesmaže (D-017)
  });

  await step('obnova nové zálohy vrátí cvičení', async () => {
    await page.click('#top-action');
    await page.setInputFiles('#restore-file', backupPath);
    await page.click('#restore-yes');
    await waitText('#toast', 'obnovená');
    await tab('ja');
    await waitText('#stat-minutes', '78');
    await waitText('#homework', 'Ode to Joy');
  });

  await step('cizí soubor se odmítne', async () => {
    await page.click('#top-action');
    await page.waitForSelector('#restore-file', { state: 'attached' });
    await page.setInputFiles('#restore-file', { name: 'fotka.json', mimeType: 'application/json', buffer: Buffer.from('nesmysl') });
    await waitText('#toast', 'není záloha');
    assert.equal(await page.locator('#restore-confirm').isHidden(), true);
    await page.click('#top-action');
  });

  await step('aplikace funguje offline', async () => {
    await tab('dnes');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await context.setOffline(true);
    await page.reload();
    await waitText('[data-quest="q1"]', 'Ode to Joy'); // mise i obsah z content/ fungují offline
    await tab('akordy');
    assert.equal(await page.locator('[data-chord]').count(), 7);
    await tab('dnes');
    await context.setOffline(false);
  });

  await step('tmavý režim', async () => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({ path: path.join(outDir, 'dnes-tmavy.png') });
    await page.emulateMedia({ colorScheme: 'light' });
  });

  await step('aktualizace z 0.3.1: krátký průvodce, data zůstanou', async () => {
    const ctx2 = await browser.newContext({ ...iphone, deviceScaleFactor: 1, locale: 'cs-CZ', timezoneId: 'Europe/Prague' });
    const p2 = await ctx2.newPage();
    await autoCloseStickers(p2);
    p2.on('pageerror', (e) => errors.push(e.message));
    await p2.goto(`${base}priprava`);
    await p2.evaluate(() => new Promise((res, rej) => {
      const r = indexedDB.open('struna', 3);
      r.onupgradeneeded = () => ['kv', 'sessions', 'missions', 'homework', 'journal', 'meta'].forEach((n) => r.result.createObjectStore(n));
      r.onsuccess = () => {
        const tx = r.result.transaction(['kv', 'sessions', 'meta'], 'readwrite');
        const today = new Date();
        const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        tx.objectStore('kv').put({ lang: 'cs', dailyGoalMin: 10 }, 'settings');
        tx.objectStore('sessions').put({ id: 'a', date: key, startedAt: today.toISOString(), endedAt: today.toISOString(), seconds: 720, goalMin: 10 }, 'a');
        tx.objectStore('meta').put(3, 'schemaVersion');
        tx.oncomplete = () => { r.result.close(); res(); };
        tx.onerror = () => rej(tx.error);
      };
    }));
    await p2.goto(base);
    await p2.waitForSelector('.onb[data-step="update"]');
    await waitTextOn(p2, '.onb', 'Krok 1 z 3');
    await p2.click('#onb-next');
    await p2.fill('#onb-name', 'Kytaristko');
    await p2.click('#onb-next');
    await p2.click('#onb-skip'); // bez avatara
    await waitTextOn(p2, '.onb[data-step="done"]', 'Ahoj, Kytaristko!');
    await p2.click('#onb-next');
    await waitTextOn(p2, '.today-card', '12 z 10 min');
    await ctx2.close();
  });

  for (const device of ['iPhone SE', 'iPhone 14 Pro Max']) {
    await step(`rozložení na ${device}: nic nepřetéká do stran`, async () => {
      const { defaultBrowserType: _, ...d } = devices[device];
      const ctx3 = await browser.newContext({ ...d, deviceScaleFactor: 1, locale: 'cs-CZ' });
      const p3 = await ctx3.newPage();
      await autoCloseStickers(p3);
      p3.on('pageerror', (e) => errors.push(e.message));
      await p3.goto(base);
      await assertNoSideScroll(p3, `${device} průvodce`);
      await skipOnboarding(p3);
      for (const route of ['dnes', 'cviceni', 'akordy', 'ja', 'nastaveni']) {
        await p3.goto(`${base}#${route}`);
        await p3.waitForSelector(`#main .screen[data-route="${route}"]`);
        await assertNoSideScroll(p3, `${device} #${route}`);
      }
      await p3.goto(`${base}#cviceni`);
      await p3.waitForSelector('#clock');
      await assertTextInsideRing(p3, device);
      await p3.goto(`${base}#dnes`);
      await p3.waitForSelector('#mission');
      await p3.screenshot({ path: path.join(outDir, `velikost-${device.replace(/ /g, '-')}.png`) });
      await ctx3.close();
    });
  }

  await step('větší písmo (Zpřístupnění): nic nepřetéká do stran', async () => {
    const ctx4 = await browser.newContext({ ...iphone, deviceScaleFactor: 1, locale: 'cs-CZ' });
    const p4 = await ctx4.newPage();
    await autoCloseStickers(p4);
    p4.on('pageerror', (e) => errors.push(e.message));
    await p4.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const st = document.createElement('style');
        st.textContent = 'html { font-size: 26px !important; }';
        document.head.append(st);
      });
    });
    await p4.goto(base);
    await assertNoSideScroll(p4, 'velké písmo průvodce');
    await skipOnboarding(p4);
    for (const route of ['dnes', 'cviceni', 'akordy', 'ja', 'nastaveni']) {
      await p4.goto(`${base}#${route}`);
      await p4.waitForSelector(`#main .screen[data-route="${route}"]`);
      await assertNoSideScroll(p4, `velké písmo #${route}`);
      if (route === 'cviceni') await assertTextInsideRing(p4, 'velké písmo');
      await p4.screenshot({ path: path.join(outDir, `velke-pismo-${route}.png`) });
    }
    await ctx4.close();
  });

  await step('žádné chyby v konzoli', async () => {
    assert.deepEqual(errors.filter((e) => !e.includes('404')), []);
  });

  console.log(`\nVšech ${passed} kroků prošlo ✅`);
} catch (err) {
  console.error(`\n✗ Selhalo po ${passed} krocích:\n`, err.message);
  await page.screenshot({ path: path.join(outDir, 'chyba.png') }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
