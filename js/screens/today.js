// Obrazovka Dnes: dnešní pokrok, začátek cvičení, série dní a úroveň.
import { esc, isStandalone, ring } from '../ui.js';
import { tn } from '../i18n.js';
import { daysBetween } from '../logic/dates.js';
import { computeProgress, weekView, restUsedThisWeek, levelFor, RULES } from '../logic/progress.js';
import * as timer from '../logic/timer.js';

function greeting(t, now) {
  const h = now.getHours();
  return t(h >= 4 && h < 11 ? 'greet.morning' : h < 18 && h >= 11 ? 'greet.afternoon' : 'greet.evening');
}

export default {
  async render(el, { t, store, toast, go }) {
    const now = new Date();
    const [sessions, settings, active, lastBackup] = await Promise.all([
      store.listSessions(), store.getSettings(), store.getActiveSession(), store.getLastBackup(),
    ]);
    const progress = computeProgress(sessions, now);
    const goal = settings.dailyGoalMin;
    const doneMin = Math.floor(progress.todaySec / 60);
    const level = levelFor(progress.xp);
    const rest = restUsedThisWeek(progress, now);
    const dayNames = t('week.days').split(',');

    const backupNote = !lastBackup
      ? (sessions.length ? t('today.backupReminder') : null)
      : (daysBetween(lastBackup, now) > 14 ? t('today.backupOld') : null);

    const startLabel = active ? t('today.continue', { time: timer.formatClock(timer.elapsedSec(active, now)) }) : t('today.start');

    el.innerHTML = `
      <h2 class="hello">${esc(greeting(t, now))}</h2>

      <section class="card today-card">
        ${ring(progress.todaySec / (goal * 60), {
          size: 132, label: t('today.progressLabel'),
          inner: `<strong>${esc(t('today.progress', { done: doneMin, goal }))}</strong>`,
        })}
        <div class="today-text">
          <h3>${esc(t('today.progressLabel'))}</h3>
          <p class="muted">${esc(doneMin >= goal ? t('today.goalDone') : t('today.goalLeft', { n: goal - doneMin }))}</p>
        </div>
        <button type="button" class="btn primary big" id="start">${esc(startLabel)}</button>
      </section>

      <section class="card">
        <h3 id="streak">${esc(progress.streak ? tn('streak', progress.streak) : t('streak.zero'))}</h3>
        <ol class="week" aria-label="${esc(t('week.days'))}">
          ${weekView(progress, now).map((d) => `
            <li class="day ${d.status}">
              <span class="dot" aria-hidden="true"></span>
              <span class="dname">${esc(dayNames[d.index])}</span>
              <span class="sr">${esc(t(`week.${d.status}`))}</span>
            </li>`).join('')}
        </ol>
        <p class="muted small">${esc(t('streak.rest', { n: rest, max: RULES.restDaysPerWeek }))}</p>
        <p class="muted small">${esc(t('streak.rule'))}</p>
      </section>

      <section class="card">
        <div class="row-between">
          <h3 id="level">${esc(t('level.title', { n: level.level }))}</h3>
          <span class="xp-num">${esc(t('level.xp', { xp: progress.xp, next: level.nextXp }))}</span>
        </div>
        <div class="bar" role="img" aria-label="${esc(t('level.toNext', { n: level.nextXp - progress.xp }))}">
          <i style="width:${((progress.xp - level.floorXp) / (level.nextXp - level.floorXp)) * 100}%"></i>
        </div>
        <p class="muted small">${esc(t('level.toNext', { n: level.nextXp - progress.xp }))}</p>
      </section>

      ${backupNote ? `<div class="note warn"><p>${esc(backupNote)}</p><button type="button" class="link" id="go-settings">${esc(t('today.backupGo'))}</button></div>` : ''}
      ${isStandalone() ? '' : `<p class="note">${esc(t('today.install'))}</p>`}`;

    el.querySelector('#go-settings')?.addEventListener('click', () => go('nastaveni'));
    el.querySelector('#start').addEventListener('click', async () => {
      try {
        if (!active) await store.setActiveSession(timer.start());
        go('cviceni');
      } catch (err) {
        console.error(err);
        toast(t('error.save'), 'error');
      }
    });
  },
};
