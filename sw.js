// Service worker: uloží aplikaci do telefonu, aby fungovala i bez internetu.
// Při každém vydání změň VERSION (stejně jako v js/version.js). Telefon pak pozná novou verzi.
const VERSION = '0.1.0';
const CACHE = `struna-${VERSION}`;

// Všechny soubory aplikace. Test tests/unit/sw.test.js hlídá, že tu nic nechybí.
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/i18n.js',
  './js/sw-register.js',
  './js/ui.js',
  './js/version.js',
  './js/logic/dates.js',
  './js/screens/settings.js',
  './js/screens/soon.js',
  './js/screens/today.js',
  './js/storage/db.js',
  './js/storage/format.js',
  './js/storage/migrations.js',
  './js/storage/schema.js',
  './js/storage/store.js',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  // cache: 'reload' obejde mezipaměť serveru, abychom vždy uložili čerstvé soubory.
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('struna-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((hit) => hit || fetch(request).catch(() =>
      request.mode === 'navigate' ? caches.match('./index.html') : Response.error())),
  );
});
