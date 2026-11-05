// Výzva „1 minuta střídání akordů“: odpočet, 60 s, klepání po každém čistém přechodu, rekord.
import { esc } from '../ui.js';
import { loadContent } from '../content.js';
import { localDateString } from '../logic/dates.js';
import { learningChords } from '../logic/mission.js';
import { bestFor, pairKey, CHALLENGE_SEC, COUNTDOWN_SEC } from '../logic/changes.js';
import { play } from '../sounds.js';
import { keepScreenOn } from '../wakelock.js';

export default {
  async render(el, ctx) {
    const { t, store, toast } = ctx;
    const [{ chords }, chordProgress] = await Promise.all([loadContent(), store.getChordProgress()]);
    let results = await store.listChanges();
    const learning = learningChords(chords, chordProgress);
    const preset = ctx.handoff?.pair;
    ctx.handoff = null;
    let a = preset?.a ?? learning[0] ?? 'Em';
    let b = preset?.b ?? learning.find((id) => id !== a) ?? 'Am';
    let ticker = null;

    const stop = () => { clearInterval(ticker); ticker = null; keepScreenOn(false, 'challenge'); };

    function setup(message = '') {
      stop();
      const best = bestFor(results, a, b);
      const options = (sel) => chords.map((c) => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${c.id}</option>`).join('');
      const history = results.filter((r) => pairKey(r.a, r.b) === pairKey(a, b)).sort((x, y) => y.id.localeCompare(x.id)).slice(0, 10);
      el.innerHTML = `
        <section class="card" id="challenge">
          <p class="muted">${esc(t('change.intro'))}</p>
          <div class="pair-pick">
            <label class="field"><span>${esc(t('change.pickA'))}</span><select id="pick-a">${options(a)}</select></label>
            <span class="pair-arrow" aria-hidden="true">↔</span>
            <label class="field"><span>${esc(t('change.pickB'))}</span><select id="pick-b">${options(b)}</select></label>
          </div>
          <p class="form-error" id="pair-error" ${message ? '' : 'hidden'}>${esc(message)}</p>
          <p id="best">${esc(best ? t('change.best', { a, b, n: best }) : t('change.noBest', { a, b }))}</p>
          <button type="button" class="btn primary big" id="change-start">${esc(t('change.start'))}</button>
        </section>
        ${history.length ? `
          <section class="card">
            <h3>${esc(t('change.history'))}</h3>
            <ul class="history-list">${history.map((r) => `<li><span class="muted small">${esc(r.date)}</span><strong>${r.count}</strong></li>`).join('')}</ul>
          </section>` : ''}`;
      el.querySelector('#pick-a').addEventListener('change', (e) => { a = e.target.value; setup(); });
      el.querySelector('#pick-b').addEventListener('change', (e) => { b = e.target.value; setup(); });
      el.querySelector('#change-start').addEventListener('click', () => (a === b ? setup(t('change.same')) : run()));
    }

    function run() {
      const startedAt = Date.now();
      let count = 0;
      keepScreenOn(true, 'challenge');
      el.innerHTML = `
        <section class="card challenge-run" id="challenge">
          <h3>${esc(a)} ↔ ${esc(b)}</h3>
          <p class="challenge-time" id="change-time" aria-live="polite">${esc(t('change.ready'))} ${COUNTDOWN_SEC}</p>
          <button type="button" class="change-tap" id="change-tap" disabled>
            <span>${esc(t('change.tap'))}</span><strong id="change-count">0</strong>
          </button>
          <button type="button" class="link" id="change-cancel">${esc(t('change.cancel'))}</button>
        </section>`;
      const tap = el.querySelector('#change-tap');
      const time = el.querySelector('#change-time');
      tap.addEventListener('click', () => {
        if (tap.disabled) return;
        count += 1;
        el.querySelector('#change-count').textContent = String(count);
      });
      el.querySelector('#change-cancel').addEventListener('click', () => setup());
      ticker = setInterval(() => {
        const sec = (Date.now() - startedAt) / 1000;
        if (sec < COUNTDOWN_SEC) { time.textContent = `${t('change.ready')} ${Math.ceil(COUNTDOWN_SEC - sec)}`; return; }
        if (tap.disabled) { tap.disabled = false; play('tick'); }
        const left = Math.ceil(COUNTDOWN_SEC + CHALLENGE_SEC - sec);
        if (left > 0) { time.textContent = t('change.left', { sec: left }); return; }
        stop();
        finish(count);
      }, 100);
    }

    async function finish(count) {
      const prevBest = bestFor(results, a, b);
      try {
        await store.addChange({ date: localDateString(), a, b, count });
        results = await store.listChanges();
      } catch (err) {
        console.error(err);
        toast(t('error.save'), 'error');
      }
      const record = count > prevBest && count > 0;
      play(record ? 'level' : 'done');
      el.innerHTML = `
        <section class="card done-card" id="change-result">
          <h2>${esc(t('change.result', { n: count }))}</h2>
          <p class="xp-big">${count}</p>
          ${record ? `<p class="badge sun">${esc(t('change.record'))}</p>` : `<p class="muted">${esc(t('change.best', { a, b, n: prevBest }))}</p>`}
          <button type="button" class="btn primary big" id="change-again">${esc(t('change.again'))}</button>
        </section>`;
      el.querySelector('#change-again').addEventListener('click', () => setup());
      ctx.checkStickers?.();
    }

    setup();
    return stop;
  },
};
