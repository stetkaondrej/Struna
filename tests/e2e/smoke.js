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
const browser = await chromium.launch();
const context = await browser.newContext({
  ...iphone, deviceScaleFactor: 1, acceptDownloads: true, locale: 'cs-CZ', timezoneId: 'Europe/Prague',
});
const page = await context.newPage();
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
const tab = async (route) => {
  await page.click(`#tabbar a[href="#${route}"]`);
  await page.waitForSelector(`#main .screen[data-route="${route}"]`);
};
const minutes = (n) => page.clock.fastForward(n * 60 * 1000);
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
    await page.waitForSelector('#start');
    const keys = await readKv();
    assert.ok(!keys.includes('testCounter'), 'testovací počitadlo mělo zmizet');
    assert.ok(keys.includes('settings'));
  });

  await step('Dnes: pozdrav, prázdný pokrok, výzva k sérii', async () => {
    assert.equal(await page.title(), 'Struna');
    assert.equal(await page.locator('#tabbar a').count(), 5);
    assert.equal(await text('.hello'), 'Dobré odpoledne!');
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
  await step('záloha obsahuje cvičení, mise, úkoly a deník', async () => {
    await page.click('#top-action');
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#backup')]);
    backupPath = path.join(outDir, download.suggestedFilename());
    await download.saveAs(backupPath);
    const data = JSON.parse(await readFile(backupPath, 'utf8'));
    assert.equal(data.schemaVersion, 3);
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
    await tab('dnes');
    await waitText('.today-card', '0 z 15 min');
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
