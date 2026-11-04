// Obrazovka Cvičení: časovač se Start / Pauza / Hotovo a oslava po dokončení.
import { esc, ring, setRing } from '../ui.js';
import { localDateString } from '../logic/dates.js';
import { computeProgress, levelFor } from '../logic/progress.js';
import * as timer from '../logic/timer.js';
import { keepScreenOn } from '../wakelock.js';
import { journalForm } from './journal-form.js';
import { play } from '../sounds.js';
import { clipRecorder, suggestTitle } from './clip-recorder.js';

export default {
  async render(el, ctx) {
    const { t, store, toast, go } = ctx;
    let [active, data, settings] = await Promise.all([
      store.getActiveSession(), store.loadProgressData(), store.getSettings(),
    ]);
    let { sessions } = data;
    const goal = settings.dailyGoalMin;
    let tick = null;
    let checkShown = false;
    let stopRecorder = null; // při odchodu z obrazovky vypnout mikrofon

    const todaySecBefore = () => computeProgress(sessions).todaySec;
    const fraction = (now) => (todaySecBefore() + timer.elapsedSec(active, now)) / (goal * 60);

    // Uloží stav časovače. Když se uložení nepovede, ukáže chybu a nic nezmění.
    async function save(next) {
      try {
        await store.setActiveSession(next);
        active = next;
        return true;
      } catch (err) {
        console.error(err);
        toast(t('error.save'), 'error');
        return false;
      }
    }

    function draw() {
      const now = new Date();
      const running = timer.isRunning(active);
      const status = !active ? t('practice.ready') : running ? t('practice.running') : t('practice.paused');
      const check = active && timer.needsCheck(active, now);
      const todayMin = Math.floor((todaySecBefore() + timer.elapsedSec(active, now)) / 60);
      checkShown = Boolean(check);

      el.innerHTML = `
        <section class="card practice">
          ${ring(fraction(now), {
            size: 240, stroke: 18, label: status, cls: 'ring-lg',
            inner: `<span class="clock" id="clock">${timer.formatClock(timer.elapsedSec(active, now))}</span>
                    <span class="muted small" id="status">${esc(status)}</span>`,
          })}
          <p class="muted" id="today-total">${esc(t('practice.today', { done: todayMin, goal }))}</p>
          ${check ? `
            <div class="confirm" id="check">
              <h3>${esc(t('practice.check.title'))}</h3>
              <p>${esc(t('practice.check.text', { min: Math.floor(timer.elapsedSec(active, now) / 60) }))}</p>
              <div class="row">
                <button type="button" class="btn primary" id="check-yes">${esc(t('practice.check.yes'))}</button>
                <button type="button" class="btn" id="check-save">${esc(t('practice.check.save', { min: active.confirmedUntilSec / 60 }))}</button>
              </div>
            </div>` : ''}
          <div class="controls">
            ${!active ? `<button type="button" class="btn primary big" id="start">${esc(t('practice.start'))}</button>` : `
              ${running
                ? `<button type="button" class="btn big" id="pause">${esc(t('practice.pause'))}</button>`
                : `<button type="button" class="btn primary big" id="resume">${esc(t('practice.resume'))}</button>`}
              <button type="button" class="btn primary big" id="finish">${esc(t('practice.finish'))}</button>`}
          </div>
        </section>`;

      el.querySelector('#start')?.addEventListener('click', async () => { if (await save(timer.start())) update(); });
      el.querySelector('#pause')?.addEventListener('click', async () => { if (await save(timer.pause(active))) update(); });
      el.querySelector('#resume')?.addEventListener('click', async () => { if (await save(timer.resume(active))) update(); });
      el.querySelector('#finish')?.addEventListener('click', () => finish());
      el.querySelector('#check-yes')?.addEventListener('click', async () => {
        if (await save(timer.confirmStillPracticing(active))) update();
      });
      el.querySelector('#check-save')?.addEventListener('click', () => finish(active.confirmedUntilSec));
    }

    // Překreslí obrazovku a podle stavu zapne/vypne tikání a nezhasínání displeje.
    function update() {
      draw();
      const running = timer.isRunning(active);
      keepScreenOn(running);
      clearInterval(tick);
      tick = running ? setInterval(onTick, 1000) : null;
    }

    function onTick() {
      const now = new Date();
      if (timer.needsCheck(active, now) && !checkShown) { update(); return; }
      const clock = el.querySelector('#clock');
      if (clock) clock.textContent = timer.formatClock(timer.elapsedSec(active, now));
      const total = el.querySelector('#today-total');
      if (total) total.textContent = t('practice.today', { done: Math.floor((todaySecBefore() + timer.elapsedSec(active, now)) / 60), goal });
      setRing(el, fraction(now));
    }

    async function finish(capSec) {
      const now = new Date();
      const session = timer.finish(active, { now, goalMin: goal, capSec, dateOf: localDateString });
      try {
        await store.finishActiveSession(session);
      } catch (err) {
        console.error(err);
        toast(t('error.save'), 'error');
        return;
      }
      active = null;
      clearInterval(tick);
      tick = null;
      keepScreenOn(false);
      if (!session) { toast(t('practice.tooShort')); update(); return; }

      const before = computeProgress(sessions, now, data);
      sessions = [...sessions, session];
      const after = computeProgress(sessions, now, data);
      showDone(session, before, after);
    }

    function showDone(session, before, after) {
      const goalSec = goal * 60;
      const goalNow = before.todaySec < goalSec && after.todaySec >= goalSec;
      const streakBonus = Math.floor(after.streak / 7) > Math.floor(before.streak / 7);
      const levelUp = levelFor(after.xp).level > levelFor(before.xp).level;
      play(levelUp ? 'level' : 'done');
      setTimeout(() => ctx.checkStickers(), 1200); // samolepka až po oslavě
      el.innerHTML = `
        <section class="card done-card" id="done">
          <h2>${esc(t('practice.done.title'))}</h2>
          <p class="xp-big">${esc(t('practice.done.xp', { xp: after.xp - before.xp }))}</p>
          <p>${esc(t('practice.done.minutes', { min: Math.floor(session.seconds / 60) }))}</p>
          ${goalNow ? `<p class="badge">${esc(t('practice.done.goal'))}</p>` : ''}
          ${streakBonus ? `<p class="badge">${esc(t('practice.done.streak'))}</p>` : ''}
          ${levelUp ? `<p class="badge sun">${esc(t('practice.done.level', { n: levelFor(after.xp).level }))}</p>` : ''}
          <div id="journal-slot" class="journal-slot">
            <button type="button" class="btn primary big" id="journal">${esc(t('me.journal.add'))}</button>
          </div>
          <div id="clip-slot" class="journal-slot">
            <button type="button" class="btn big" id="clip-add">${esc(t('clips.add'))}</button>
          </div>
          <div class="controls">
            <button type="button" class="btn big" id="home">${esc(t('practice.done.home'))}</button>
            <button type="button" class="btn big" id="again">${esc(t('practice.done.again'))}</button>
          </div>
        </section>`;
      el.querySelector('#journal').addEventListener('click', () => {
        journalForm(el.querySelector('#journal-slot'), ctx, (saved) => {
          if (saved) go('dnes');
          else el.querySelector('#journal-slot').innerHTML = '';
        });
        el.querySelector('#journal-slot textarea').focus();
      });
      el.querySelector('#clip-add').addEventListener('click', async () => {
        const slot = el.querySelector('#clip-slot');
        const button = slot.innerHTML;
        stopRecorder = clipRecorder(slot, ctx, {
          defaultTitle: await suggestTitle(ctx),
          onDone: () => { slot.innerHTML = button; stopRecorder = null; el.querySelector('#clip-add').hidden = true; },
        });
      });
      el.querySelector('#home').addEventListener('click', () => go('dnes'));
      el.querySelector('#again').addEventListener('click', () => update());
    }

    // Po návratu do aplikace: dopočítat čas a znovu zapnout nezhasínání displeje.
    const onVisible = () => { if (document.visibilityState === 'visible' && el.querySelector('#clock')) update(); };
    document.addEventListener('visibilitychange', onVisible);

    update();

    // Úklid při odchodu z obrazovky.
    return () => {
      stopRecorder?.();
      clearInterval(tick);
      document.removeEventListener('visibilitychange', onVisible);
      keepScreenOn(false);
    };
  },
};
