// Vygeneruje ikony aplikace do assets/icons/ (vývojový nástroj, není součástí aplikace).
// Spuštění: node tools/make-icons.js   (potřebuje Playwright)
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'icons');

// Ozvučný otvor kytary (žlutý kruh) a jedna rozechvělá struna.
const svg = (scale) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#127C7A"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <circle cx="256" cy="256" r="150" fill="#0B5654"/>
    <circle cx="256" cy="256" r="150" fill="none" stroke="#F2B33D" stroke-width="30"/>
    <circle cx="256" cy="256" r="182" fill="none" stroke="#F2B33D" stroke-width="8" stroke-dasharray="4 14" stroke-linecap="round"/>
    <path d="M256 40 C 226 120, 286 176, 256 256 S 226 392, 256 472" fill="none" stroke="#FFF8E8" stroke-width="16" stroke-linecap="round"/>
  </g>
</svg>`;

const targets = [
  ['apple-touch-icon.png', 180, 1],
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  ['icon-maskable-512.png', 512, 0.78], // menší motiv, aby ho Android maska neořízla
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const [name, size, scale] of targets) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg(scale)}`);
  await page.screenshot({ path: path.join(out, name), omitBackground: false });
  console.log('✓', name);
}
await browser.close();
