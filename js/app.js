// Start aplikace a přepínání obrazovek.
import { t, setLang, getLang } from './i18n.js';
import * as store from './storage/store.js';
import { registerServiceWorker } from './sw-register.js';
import { toast, icon, esc } from './ui.js';
import today from './screens/today.js';
import settings from './screens/settings.js';
import { soonScreen } from './screens/soon.js';

// Adresa obrazovky je v části za # (např. …/#akordy).
const TABS = ['dnes', 'mapa', 'cviceni', 'akordy', 'ja'];
const SCREENS = {
  dnes: today,
  mapa: soonScreen('mapa', 4),
  cviceni: soonScreen('cviceni', 1),
  akordy: soonScreen('akordy', 2),
  ja: soonScreen('ja', '2–4'),
  nastaveni: settings,
};

const main = document.getElementById('main');
const tabbar = document.getElementById('tabbar');
const title = document.getElementById('title');
const topAction = document.getElementById('top-action');

const currentRoute = () => {
  const name = location.hash.slice(1);
  return name in SCREENS ? name : 'dnes';
};

const go = (route) => { location.hash = route; };

const ctx = {
  t,
  store,
  toast,
  go,
  get lang() { return getLang(); },
  rerender: () => render(),
  async setLanguage(lang) {
    await store.setSetting('lang', lang);
    setLang(lang);
    render();
  },
  async reloadSettings() {
    setLang((await store.getSettings()).lang);
    render();
  },
};

function renderChrome(route) {
  tabbar.innerHTML = TABS.map((name) => `
    <a href="#${name}" class="tab" ${name === route ? 'aria-current="page"' : ''}>
      ${icon(name)}<span>${esc(t(`tab.${name}`))}</span>
    </a>`).join('');
  tabbar.setAttribute('aria-label', 'Struna');

  const isSettings = route === 'nastaveni';
  title.textContent = isSettings ? t('nav.settings') : (route === 'dnes' ? 'Struna' : t(`tab.${route}`));
  topAction.innerHTML = isSettings ? icon('back') : icon('settings');
  topAction.setAttribute('aria-label', isSettings ? t('nav.back') : t('nav.settings'));
  topAction.onclick = () => (isSettings ? history.length > 1 ? history.back() : go('dnes') : go('nastaveni'));
  document.title = isSettings ? `${t('nav.settings')} · Struna` : 'Struna';
}

let renderId = 0;
async function render() {
  const id = ++renderId;
  const route = currentRoute();
  renderChrome(route);
  const container = document.createElement('div');
  container.className = 'screen';
  try {
    await SCREENS[route].render(container, ctx);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p class="note warn">${esc(t('error.boot'))}</p>`;
  }
  if (id !== renderId) return; // mezitím uživatel přepnul jinam
  main.replaceChildren(container);
  window.scrollTo(0, 0);
}

function showFatal(key) {
  main.innerHTML = `<p class="note warn">${esc(t(key))}</p>`;
}

async function boot() {
  try {
    await store.init();
    setLang((await store.getSettings()).lang);
  } catch (err) {
    console.error(err);
    renderChrome('dnes');
    showFatal(err.message === 'DATA_NEWER' ? 'error.newerData' : 'error.boot');
    return;
  }
  window.addEventListener('hashchange', render);
  await render();
  store.requestPersistence();
  registerServiceWorker((applyUpdate) => {
    const bar = document.getElementById('update-bar');
    bar.querySelector('p').textContent = t('update.available');
    const btn = bar.querySelector('button');
    btn.textContent = t('update.button');
    btn.onclick = applyUpdate;
    bar.hidden = false;
  });
}

window.addEventListener('unhandledrejection', (e) => console.error('Unhandled', e.reason));
boot();
