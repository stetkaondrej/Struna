import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { TEXTS, LANGS, t, setLang } from '../../js/i18n.js';

test('oba jazyky mají přesně stejné klíče', () => {
  const cs = Object.keys(TEXTS.cs).sort();
  for (const lang of LANGS) assert.deepEqual(Object.keys(TEXTS[lang]).sort(), cs, `jazyk ${lang}`);
});

test('žádný text není prázdný a zástupná místa {x} souhlasí', () => {
  const holes = (s) => (s.match(/\{\w+\}/g) ?? []).sort();
  for (const key of Object.keys(TEXTS.cs)) {
    for (const lang of LANGS) assert.ok(TEXTS[lang][key].trim(), `${lang}: ${key} je prázdný`);
    assert.deepEqual(holes(TEXTS.en[key]), holes(TEXTS.cs[key]), `zástupná místa v ${key}`);
  }
});

test('doplnění hodnoty a přepnutí jazyka', () => {
  setLang('cs');
  assert.equal(t('today.counter.button', { n: 7 }), 'Klepnutí: 7');
  setLang('en');
  assert.equal(t('today.counter.button', { n: 7 }), 'Taps: 7');
  setLang('xx');
  assert.equal(t('tab.dnes'), 'Dnes', 'neznámý jazyk → čeština');
});

test('každý klíč použitý v kódu existuje', () => {
  const files = [];
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).forEach((e) =>
    e.isDirectory() ? walk(`${dir}/${e.name}`) : e.name.endsWith('.js') && files.push(`${dir}/${e.name}`));
  walk('js');
  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    for (const [, key] of src.matchAll(/\bt\('([\w.]+)'/g)) assert.ok(key in TEXTS.cs, `${file}: chybí text ${key}`);
  }
});
