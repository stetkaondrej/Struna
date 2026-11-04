// Obrazovka Dnes. V kroku 0 obsahuje jen test ukládání dat.
import { esc, isStandalone } from '../ui.js';
import { daysBetween } from '../logic/dates.js';

export default {
  async render(el, { t, store, toast, go }) {
    const [count, lastBackup] = await Promise.all([store.getCounter(), store.getLastBackup()]);
    const backupNote = !lastBackup
      ? (count > 0 ? t('today.backupReminder') : null)
      : (daysBetween(lastBackup, new Date()) > 14 ? t('today.backupOld') : null);

    el.innerHTML = `
      <h2 class="hello">${esc(t('today.hello'))}</h2>
      <p class="muted">${esc(t('today.intro'))}</p>
      ${isStandalone() ? '' : `<p class="note">${esc(t('today.install'))}</p>`}
      ${backupNote ? `<div class="note warn"><p>${esc(backupNote)}</p><button type="button" class="link" id="go-settings">${esc(t('today.backupGo'))}</button></div>` : ''}
      <section class="card">
        <h3>${esc(t('today.counter.title'))}</h3>
        <p class="muted">${esc(t('today.counter.text'))}</p>
        <button type="button" class="btn primary" id="counter">${esc(t('today.counter.button', { n: count }))}</button>
      </section>`;

    el.querySelector('#go-settings')?.addEventListener('click', () => go('nastaveni'));

    const button = el.querySelector('#counter');
    button.addEventListener('click', async () => {
      try {
        const n = await store.incrementCounter();
        button.textContent = t('today.counter.button', { n });
      } catch (err) {
        console.error(err);
        toast(t('error.save'), 'error');
      }
    });
  },
};
