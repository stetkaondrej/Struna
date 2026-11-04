// Záložka Já: domácí úkol od učitele, deník a moje čísla.
import { esc } from '../ui.js';
import { formatDate } from '../i18n.js';
import { localDateString, parseLocalDate } from '../logic/dates.js';
import { computeProgress, levelFor } from '../logic/progress.js';
import { activeHomework } from '../logic/mission.js';
import { journalForm, faceFor } from './journal-form.js';
import { avatarEmoji } from '../avatars.js';

export default {
  async render(el, ctx) {
    const { t, store, toast, rerender, go } = ctx;
    const [homework, data, profile] = await Promise.all([store.listHomework(), store.loadProgressData(), store.getProfile()]);
    const progress = computeProgress(data.sessions, new Date(), data);
    const current = activeHomework(homework);
    const history = homework.filter((h) => h.doneAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
    const journal = [...data.journal].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
    const lessonDate = (h) => formatDate(parseLocalDate(h.lessonDate));

    el.innerHTML = `
      <section class="card profile-card" id="profile">
        <span class="avatar-face big" aria-hidden="true">${avatarEmoji(profile.avatar) || '🎵'}</span>
        <div class="profile-text">
          <h2>${esc(profile.nickname || t('me.profile.noName'))}</h2>
          <p class="muted">${esc(t('level.title', { n: levelFor(progress.xp).level }))} · ${progress.xp} XP</p>
        </div>
        <button type="button" class="link" id="edit-profile">${esc(t('me.profile.edit'))}</button>
      </section>

      <section class="card" id="homework">
        <h3>${esc(t('me.homework'))}</h3>
        ${current ? `
          <div class="homework-now">
            <p class="muted small">${esc(t('me.homework.from', { date: lessonDate(current) }))}</p>
            <p class="hw-text">${esc(current.text)}</p>
            <button type="button" class="btn primary" id="hw-done">${esc(t('me.homework.done'))}</button>
          </div>` : `<p class="muted">${esc(t('me.homework.none'))}</p>`}
        <button type="button" class="btn" id="hw-add">${esc(t('me.homework.add'))}</button>
        <form id="hw-form" class="journal-form" hidden novalidate>
          <label class="field"><span>${esc(t('me.homework.date'))}</span>
            <input type="date" id="hw-date" value="${localDateString()}" max="${localDateString()}"></label>
          <label class="field"><span>${esc(t('me.homework.text'))}</span>
            <textarea id="hw-text" rows="3" maxlength="500" placeholder="${esc(t('me.homework.placeholder'))}"></textarea></label>
          <p class="form-error" id="hw-error" hidden></p>
          <div class="row">
            <button type="submit" class="btn primary">${esc(t('me.homework.save'))}</button>
            <button type="button" class="btn" id="hw-cancel">${esc(t('journal.cancel'))}</button>
          </div>
        </form>
        ${history.length ? `
          <details class="history"><summary>${esc(t('me.homework.history'))}</summary>
            <ul>${history.map((h) => `<li><span class="muted small">${esc(lessonDate(h))}</span> ${esc(h.text)}</li>`).join('')}</ul>
          </details>` : ''}
      </section>

      <section class="card" id="journal">
        <h3>${esc(t('me.journal'))}</h3>
        <button type="button" class="btn primary" id="j-add">${esc(t('me.journal.add'))}</button>
        <div id="j-form"></div>
        ${journal.length ? `<ul class="journal-list">${journal.map((j) => `
          <li>
            <div class="row-between"><span class="muted small">${esc(formatDate(parseLocalDate(j.date)))}</span><span class="face-big" aria-label="${j.feeling ? esc(t(`journal.feel.${j.feeling}`)) : ''}">${faceFor(j.feeling)}</span></div>
            ${j.learned ? `<p><strong>${esc(t('journal.learned'))}:</strong> ${esc(j.learned)}</p>` : ''}
            ${j.stuck ? `<p><strong>${esc(t('journal.stuck'))}:</strong> ${esc(j.stuck)}</p>` : ''}
          </li>`).join('')}</ul>` : `<p class="muted">${esc(t('me.journal.none'))}</p>`}
      </section>

      <section class="card">
        <h3>${esc(t('me.stats'))}</h3>
        <dl class="stats">
          <div><dt>${esc(t('me.stats.minutes'))}</dt><dd id="stat-minutes">${Math.floor(progress.totalSec / 60)}</dd></div>
          <div><dt>${esc(t('me.stats.days'))}</dt><dd>${progress.practiceDays}</dd></div>
          <div><dt>${esc(t('me.stats.best'))}</dt><dd>${progress.bestStreak}</dd></div>
          <div><dt>${esc(t('me.stats.level'))}</dt><dd>${levelFor(progress.xp).level}</dd></div>
        </dl>
      </section>`;

    el.querySelector('#edit-profile').addEventListener('click', () => go('nastaveni'));

    const safely = (fn) => async (...args) => {
      try { await fn(...args); } catch (err) { console.error(err); toast(t('error.save'), 'error'); }
    };

    el.querySelector('#hw-done')?.addEventListener('click', safely(async () => {
      await store.completeHomework(current.id);
      toast(t('me.homework.doneMsg'), 'ok');
      rerender();
    }));

    const form = el.querySelector('#hw-form');
    el.querySelector('#hw-add').addEventListener('click', () => { form.hidden = false; el.querySelector('#hw-add').hidden = true; el.querySelector('#hw-text').focus(); });
    el.querySelector('#hw-cancel').addEventListener('click', () => { form.hidden = true; el.querySelector('#hw-add').hidden = false; });
    form.addEventListener('submit', safely(async (e) => {
      e.preventDefault();
      const text = el.querySelector('#hw-text').value.trim();
      const date = el.querySelector('#hw-date').value || localDateString();
      if (!text) {
        const err = el.querySelector('#hw-error');
        err.textContent = t('me.homework.empty');
        err.hidden = false;
        return;
      }
      // Starý nesplněný úkol nahradí nový (další lekce = nový úkol).
      if (current) await store.completeHomework(current.id);
      const item = await store.addHomework({ lessonDate: date, text });
      const today = await store.putHomeworkIntoMission(localDateString(), {
        id: 'q1', type: 'homework', params: { homeworkId: item.id, text: item.text }, done: false,
      });
      toast(t(today ? 'me.homework.savedToday' : 'me.homework.savedNext'), 'ok');
      rerender();
    }));

    const jForm = el.querySelector('#j-form');
    const jAdd = el.querySelector('#j-add');
    jAdd.addEventListener('click', () => {
      jAdd.hidden = true;
      journalForm(jForm, ctx, (saved) => { if (saved) rerender(); else { jForm.innerHTML = ''; jAdd.hidden = false; } });
      jForm.querySelector('textarea').focus();
    });
  },
};
