// Formulář deníku „Co jsem se naučila“. Používá ho oslava po cvičení i záložka Já.
import { esc } from '../ui.js';
import { localDateString } from '../logic/dates.js';

export const FEELINGS = [
  { id: 'sad', face: '🙁' },
  { id: 'meh', face: '😐' },
  { id: 'happy', face: '🙂' },
  { id: 'great', face: '🤩' },
];

export function faceFor(feeling) {
  return FEELINGS.find((f) => f.id === feeling)?.face ?? '';
}

// onDone(saved: boolean) se zavolá po uložení nebo zrušení.
export function journalForm(el, { t, store, toast }, onDone) {
  let feeling = null;
  el.innerHTML = `
    <form class="journal-form" id="journal-form" novalidate>
      <label class="field">
        <span>${esc(t('journal.learned'))}</span>
        <textarea id="j-learned" rows="2" maxlength="500"></textarea>
      </label>
      <label class="field">
        <span>${esc(t('journal.stuck'))}</span>
        <textarea id="j-stuck" rows="2" maxlength="500"></textarea>
      </label>
      <fieldset class="field">
        <legend>${esc(t('journal.feeling'))}</legend>
        <div class="faces">
          ${FEELINGS.map((f) => `
            <button type="button" class="face" data-feeling="${f.id}" aria-pressed="false" aria-label="${esc(t(`journal.feel.${f.id}`))}">
              <span aria-hidden="true">${f.face}</span><small>${esc(t(`journal.feel.${f.id}`))}</small>
            </button>`).join('')}
        </div>
      </fieldset>
      <p class="form-error" id="j-error" hidden></p>
      <div class="row">
        <button type="submit" class="btn primary">${esc(t('journal.save'))}</button>
        <button type="button" class="btn" id="j-cancel">${esc(t('journal.cancel'))}</button>
      </div>
    </form>`;

  el.querySelectorAll('[data-feeling]').forEach((b) => b.addEventListener('click', () => {
    feeling = feeling === b.dataset.feeling ? null : b.dataset.feeling;
    el.querySelectorAll('[data-feeling]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.feeling === feeling)));
  }));
  el.querySelector('#j-cancel').addEventListener('click', () => onDone(false));

  el.querySelector('#journal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const learned = el.querySelector('#j-learned').value.trim();
    const stuck = el.querySelector('#j-stuck').value.trim();
    const error = el.querySelector('#j-error');
    if (!learned && !stuck && !feeling) {
      error.textContent = t('journal.empty');
      error.hidden = false;
      return;
    }
    try {
      const date = localDateString();
      const firstToday = !(await store.listJournal()).some((j) => j.date === date);
      await store.addJournal({ date, learned, stuck, feeling });
      toast(t(firstToday ? 'journal.saved' : 'journal.savedNoXp'), 'ok');
      onDone(true);
    } catch (err) {
      console.error(err);
      toast(t('error.save'), 'error');
    }
  });
}
