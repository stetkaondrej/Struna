// Rodičovský PIN. Po zadání platí 5 minut, pak se ptá znovu.
import { esc } from '../ui.js';
import { isValidPin, hashPin, checkPin, resetQuestion } from '../logic/pin.js';

const UNLOCK_MS = 5 * 60 * 1000;
let unlockedUntil = 0;

export const isUnlocked = () => Date.now() < unlockedUntil;
export const lock = () => { unlockedUntil = 0; };

// Vykreslí formulář do el. Vrátí Promise<boolean>: true = PIN v pořádku, false = zrušeno.
export function requirePin(el, { t, store, toast }) {
  if (isUnlocked()) return Promise.resolve(true);
  return new Promise((resolve) => {
    const finish = (ok) => { if (ok) unlockedUntil = Date.now() + UNLOCK_MS; resolve(ok); };

    function form({ text, id = 'pin', button = t('pin.ok'), extra = '' }) {
      el.innerHTML = `
        <form class="pin-form card" id="pin-form" novalidate>
          <h3>🔒 ${esc(t('pin.title'))}</h3>
          <p>${esc(text)}</p>
          <label class="field"><span class="sr">${esc(t('pin.field'))}</span>
            <input type="password" id="${id}" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" class="pin-input"></label>
          <p class="form-error" id="pin-error" hidden></p>
          <div class="row">
            <button type="submit" class="btn primary">${esc(button)}</button>
            <button type="button" class="btn" id="pin-cancel">${esc(t('pin.cancel'))}</button>
          </div>
          ${extra}
        </form>`;
      el.querySelector('#pin-cancel').addEventListener('click', () => finish(false));
      el.querySelector('input').focus();
      return el.querySelector('#pin-form');
    }
    const error = (msg) => { const e = el.querySelector('#pin-error'); e.textContent = msg; e.hidden = false; };

    function create() {
      const f = form({ text: t('pin.create') });
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const first = el.querySelector('#pin').value;
        if (!isValidPin(first)) { error(t('pin.invalid')); return; }
        const g = form({ text: t('pin.repeat'), id: 'pin2' });
        g.addEventListener('submit', async (ev) => {
          ev.preventDefault();
          if (el.querySelector('#pin2').value !== first) { toast(t('pin.mismatch'), 'error'); create(); return; }
          try {
            await store.setPinHash(await hashPin(first));
            toast(t('pin.created'), 'ok');
            finish(true);
          } catch (err) {
            console.error(err);
            toast(t('error.save'), 'error');
          }
        });
      });
    }

    function enter(hash) {
      const f = form({ text: t('pin.enter'), extra: `<button type="button" class="link" id="pin-forgot">${esc(t('pin.forgot'))}</button>` });
      el.querySelector('#pin-forgot').addEventListener('click', forgot);
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (await checkPin(el.querySelector('#pin').value, hash)) finish(true);
        else { el.querySelector('#pin').value = ''; error(t('pin.wrong')); }
      });
    }

    function forgot() {
      const q = resetQuestion();
      el.innerHTML = `
        <form class="pin-form card" id="pin-form" novalidate>
          <h3>🔒 ${esc(t('pin.title'))}</h3>
          <p>${esc(t('pin.question', { a: q.a, b: q.b }))}</p>
          <label class="field"><span>${esc(t('pin.answer'))}</span>
            <input type="text" id="pin-answer" inputmode="numeric" autocomplete="off"></label>
          <p class="form-error" id="pin-error" hidden></p>
          <div class="row">
            <button type="submit" class="btn primary">${esc(t('pin.reset'))}</button>
            <button type="button" class="btn" id="pin-cancel">${esc(t('pin.cancel'))}</button>
          </div>
        </form>`;
      el.querySelector('#pin-cancel').addEventListener('click', () => finish(false));
      el.querySelector('#pin-form').addEventListener('submit', (e) => {
        e.preventDefault();
        if (Number(el.querySelector('#pin-answer').value) === q.answer) create();
        else error(t('pin.wrongAnswer'));
      });
    }

    store.getPinHash().then((hash) => (hash ? enter(hash) : create()), () => create());
  });
}
