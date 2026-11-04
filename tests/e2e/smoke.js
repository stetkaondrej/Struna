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
const context = await browser.newContext({ ...iphone, deviceScaleFactor: 1, acceptDownloads: true });
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

// Ukládání je asynchronní: počkáme, až se na tlačítku objeví očekávané číslo.
const expectCounter = (n) => page.waitForFunction(
  (want) => document.getElementById('counter')?.textContent === want, `Klepnutí: ${n}`, { timeout: 5000 });
const toastText = () => page.locator('#toast').textContent();

try {
  console.log('Struna · test v prohlížeči (iPhone 12 Pro)');

  await step('aplikace se spustí s 5 záložkami', async () => {
    await page.goto(base);
    await page.waitForSelector('#counter');
    assert.equal(await page.title(), 'Struna');
    assert.equal(await page.locator('#tabbar a').count(), 5);
    await page.screenshot({ path: path.join(outDir, 'dnes.png') });
  });

  await step('počitadlo se uloží a přežije přenačtení', async () => {
    for (let i = 0; i < 3; i++) await page.click('#counter');
    await expectCounter(3);
    await page.reload();
    await expectCounter(3);
  });

  await step('všechny záložky se otevřou', async () => {
    for (const [route, label] of [['mapa', 'Mapa'], ['cviceni', 'Cvičení'], ['akordy', 'Akordy'], ['ja', 'Já'], ['dnes', 'Struna']]) {
      await page.click(`#tabbar a[href="#${route}"]`);
      await page.waitForFunction((l) => document.getElementById('title').textContent === l, label);
    }
  });

  await step('přepnutí na angličtinu se pamatuje', async () => {
    await page.click('#top-action');
    await page.waitForSelector('[data-lang="en"]');
    await page.screenshot({ path: path.join(outDir, 'nastaveni.png'), fullPage: true });
    await page.click('[data-lang="en"]');
    await page.waitForFunction(() => document.querySelector('#tabbar a').textContent.includes('Today'));
    await page.reload();
    await page.waitForSelector('[data-lang="en"][aria-pressed="true"]');
    assert.equal(await page.getAttribute('html', 'lang'), 'en');
    await page.click('[data-lang="cs"]');
    await page.waitForSelector('[data-lang="cs"][aria-pressed="true"]');
  });

  let backupPath;
  await step('záloha vytvoří platný soubor', async () => {
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#backup')]);
    assert.match(download.suggestedFilename(), /^struna-zaloha-\d{4}-\d{2}-\d{2}\.json$/);
    backupPath = path.join(outDir, download.suggestedFilename());
    await download.saveAs(backupPath);
    const data = JSON.parse(await readFile(backupPath, 'utf8'));
    assert.equal(data.app, 'struna');
    assert.deepEqual(data.stores.kv.find(([k]) => k === 'testCounter'), ['testCounter', 3]);
    await page.waitForFunction(() => document.body.textContent.includes('Poslední záloha: 4'));
  });

  await step('obnova ze zálohy vrátí data', async () => {
    await page.click('#tabbar a[href="#dnes"]');
    await page.waitForSelector('#counter');
    await page.click('#counter');
    await page.click('#counter');
    await expectCounter(5);
    await page.click('#top-action');
    await page.setInputFiles('#restore-file', backupPath);
    await page.click('#restore-yes');
    await page.waitForFunction(() => document.getElementById('toast').textContent.includes('obnovená'));
    await page.click('#tabbar a[href="#dnes"]');
    await expectCounter(3);
  });

  await step('cizí soubor se odmítne a data zůstanou', async () => {
    await page.click('#top-action');
    await page.setInputFiles('#restore-file', { name: 'fotka.json', mimeType: 'application/json', buffer: Buffer.from('nesmysl') });
    await page.waitForFunction(() => document.getElementById('toast').textContent.includes('není záloha'));
    assert.equal(await page.locator('#restore-confirm').isHidden(), true);
    await page.click('#tabbar a[href="#dnes"]');
    await expectCounter(3);
  });

  await step('aplikace funguje offline', async () => {
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); // teď stránku řídí service worker
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await context.setOffline(true);
    await page.reload();
    await expectCounter(3);
    await context.setOffline(false);
  });

  await step('tmavý režim', async () => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({ path: path.join(outDir, 'dnes-tmavy.png') });
    await page.emulateMedia({ colorScheme: 'light' });
  });

  await step('žádné chyby v konzoli', async () => {
    assert.deepEqual(errors, []);
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
