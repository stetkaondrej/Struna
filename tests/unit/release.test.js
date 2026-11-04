// Kontroly před vydáním: verze všude stejná, offline seznam úplný, žádné soubory zvenku.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { VERSION } from '../../js/version.js';

const read = (f) => readFileSync(f, 'utf8');
const sw = read('sw.js');
const listFiles = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? listFiles(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);

test('číslo verze souhlasí v js/version.js, sw.js, package.json a CHANGELOG.md', () => {
  assert.match(VERSION, /^\d+\.\d+\.\d+$/);
  assert.equal(sw.match(/const VERSION = '([^']+)'/)[1], VERSION, 'sw.js');
  assert.equal(JSON.parse(read('package.json')).version, VERSION, 'package.json');
  assert.ok(read('CHANGELOG.md').includes(`## ${VERSION}`), 'CHANGELOG.md nemá záznam pro tuto verzi');
});

test('service worker ukládá všechny soubory aplikace a jen existující soubory', () => {
  const assets = [...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);
  for (const a of assets) assert.ok(existsSync(a), `sw.js odkazuje na neexistující ${a}`);
  const appFiles = [...listFiles('js'), ...listFiles('css'), ...listFiles('assets'),
    ...(existsSync('content') ? listFiles('content') : []), 'index.html', 'manifest.webmanifest'];
  for (const f of appFiles) assert.ok(assets.includes(f), `sw.js nemá v seznamu ${f} (offline by chyběl)`);
});

test('aplikace nenačítá nic z cizích serverů (funguje offline)', () => {
  for (const f of ['index.html', ...listFiles('js'), ...listFiles('css')]) {
    assert.doesNotMatch(read(f), /(src|href)=["']https?:|@import\s+url\(["']?https?:|import\s.*from\s+['"]https?:/, f);
  }
});

test('manifest má název a ikony, které existují', () => {
  const m = JSON.parse(read('manifest.webmanifest'));
  assert.equal(m.name, 'Struna');
  assert.equal(m.display, 'standalone');
  for (const i of m.icons) assert.ok(existsSync(i.src), i.src);
});
