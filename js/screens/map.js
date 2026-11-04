// Záložka Mapa: 7 světů výpravy, lekce, výzvy a hra „Která struna?“.
import { esc } from '../ui.js';
import { loadContent } from '../content.js';
import { localDateString } from '../logic/dates.js';
import { worldStates, chordsBossMet, nextString, QUIZ_TARGET } from '../logic/worlds.js';
import { play } from '../sounds.js';
import { requirePin } from './pin-gate.js';
import { clipRecorder } from './clip-recorder.js';
import { avatarEmoji } from '../avatars.js';

export default {
  async render(el, ctx) {
    const { t, store, toast, go, lang } = ctx;
    const [{ worlds }, profile] = await Promise.all([loadContent(), store.getProfile()]);
    let progress = await store.getWorlds();
    let chordProgress = await store.getChordProgress();
    let openId = null;
    let stopRecorder = null;
    const today = () => localDateString();
    const states = () => worldStates(worlds, progress);
    const worldOf = (id) => worlds.find((w) => w.id === id);

    // Výzva Akordového lesa se splní sama, když jsou splněné podmínky.
    async function autoBosses() {
      for (const s of states()) {
        const w = worldOf(s.id);
        if (s.bossAvailable && w.boss.type === 'chords' && chordsBossMet(w.boss, chordProgress)) await finishBoss(w, false);
      }
    }

    async function finishBoss(w, redraw = true) {
      progress = await store.completeBoss(w.id, today());
      play('level');
      toast(t('map.worldDone', { name: w[lang].name }), 'ok');
      ctx.checkStickers();
      if (redraw) (openId ? drawDetail() : drawList());
    }

    function drawList() {
      const st = states();
      el.innerHTML = `
        <p class="muted">${esc(t('map.intro'))}</p>
        <ol class="map-path">
          ${worlds.map((w, i) => {
            const s = st[i];
            const label = s.status === 'done' ? t('map.done') : s.status === 'locked' ? t('map.locked') : t('map.here');
            return `
              <li class="map-world ${s.status}">
                <button type="button" class="map-node" data-world="${w.id}" aria-label="${esc(`${w[lang].name}: ${label}`)}">
                  <span class="node-emoji" aria-hidden="true">${s.status === 'locked' ? '🔒' : s.status === 'done' ? '✓' : w.emoji}</span>
                </button>
                <button type="button" class="map-text" data-world="${w.id}">
                  <strong>${w.id}. ${esc(w[lang].name)}</strong>
                  <span class="muted small">${esc(w[lang].desc)}</span>
                  <span class="pill small">${s.status === 'current' && profile.avatar ? `${avatarEmoji(profile.avatar)} ` : ''}${esc(label)}${s.status !== 'locked' && s.status !== 'done' ? ` · ${esc(t('map.lessons', { done: s.lessonsDone, total: s.lessonsTotal }))}` : ''}</span>
                </button>
              </li>`;
          }).join('')}
        </ol>`;
      el.querySelectorAll('[data-world]').forEach((b) => b.addEventListener('click', () => { openId = Number(b.dataset.world); drawDetail(); }));
    }

    function drawDetail() {
      stopRecorder?.();
      stopRecorder = null;
      const w = worldOf(openId);
      const s = states().find((x) => x.id === w.id);
      const prev = worldOf(w.id - 1);
      const canLearn = s.status !== 'locked';
      el.innerHTML = `
        <button type="button" class="link back" id="back">‹ ${esc(t('map.back'))}</button>
        <section class="card world-head ${s.status}">
          <span class="world-emoji" aria-hidden="true">${w.emoji}</span>
          <div><h2>${w.id}. ${esc(w[lang].name)}</h2><p class="muted">${esc(w[lang].desc)}</p></div>
        </section>
        ${s.status === 'locked' ? `<p class="note warn">${esc(t('map.lockedText', { name: prev[lang].name }))}</p>` : ''}
        <h3 class="section-title">${esc(t('map.lessonsTitle'))}</h3>
        <ul class="lessons">
          ${w.lessons.map((l) => {
            const done = Boolean(progress.lessons[l.id]);
            return `
              <li class="card lesson ${done ? 'done' : ''}">
                <h3>${esc(l[lang].title)}</h3>
                <p>${esc(l[lang].text)}</p>
                ${done ? `<span class="pill small">${esc(t('map.lessonDoneMark'))}</span>`
                  : canLearn ? `<button type="button" class="btn" data-lesson="${l.id}">${esc(t('map.lessonDone'))}</button>` : ''}
              </li>`;
          }).join('')}
        </ul>
        <section class="card boss ${s.bossDone ? 'done' : ''}" id="boss">
          <span class="eyebrow">🏆 ${esc(t('map.boss'))}</span>
          <h3>${esc(w.boss[lang].title)}</h3>
          <p>${esc(w.boss[lang].text)}</p>
          <div id="boss-slot">${bossAction(w, s)}</div>
        </section>
        ${s.status !== 'done' ? `<div id="skip-slot"><button type="button" class="link" id="skip">${esc(t('map.skip'))}</button></div>` : ''}`;

      el.querySelector('#back').addEventListener('click', () => { stopRecorder?.(); openId = null; drawList(); });
      el.querySelectorAll('[data-lesson]').forEach((b) => b.addEventListener('click', async () => {
        try {
          progress = await store.completeLesson(b.dataset.lesson, today());
          play('tick');
          await autoBosses();
          drawDetail();
          ctx.checkStickers();
        } catch (err) { console.error(err); toast(t('error.save'), 'error'); }
      }));
      wireBoss(w, s);
      el.querySelector('#skip')?.addEventListener('click', async () => {
        const slot = el.querySelector('#skip-slot');
        if (!(await requirePin(slot, ctx))) { drawDetail(); return; }
        progress = await store.skipWorld(w.id);
        toast(t('map.skipped'), 'ok');
        drawDetail();
      });
      window.scrollTo(0, 0);
    }

    function bossAction(w, s) {
      if (s.bossDone || s.skipped) return `<p class="badge">${esc(t('map.bossDone'))}</p>`;
      if (!s.bossAvailable) return `<p class="muted small">${esc(t('map.bossLocked'))}</p>`;
      switch (w.boss.type) {
        case 'quiz': return `<button type="button" class="btn primary big" id="boss-quiz">${esc(t('map.bossStartQuiz'))}</button>`;
        case 'record': return `<button type="button" class="btn primary big" id="boss-record">${esc(t('map.bossRecord'))}</button>`;
        case 'chords': {
          const n = Object.values(chordProgress).filter((c) => (c.stars ?? 0) >= (w.boss.stars ?? 2)).length;
          return `<p>${esc(t('map.bossChordsProgress', { n: Math.min(n, w.boss.count), total: w.boss.count }))}</p>
            <button type="button" class="btn" id="boss-chords">${esc(t('map.bossChordsOpen'))}</button>`;
        }
        default: return `<button type="button" class="btn primary big" id="boss-confirm">${esc(t('map.bossConfirm'))}</button>`;
      }
    }

    function wireBoss(w) {
      el.querySelector('#boss-confirm')?.addEventListener('click', () => finishBoss(w));
      el.querySelector('#boss-chords')?.addEventListener('click', () => go('akordy'));
      el.querySelector('#boss-record')?.addEventListener('click', () => {
        stopRecorder = clipRecorder(el.querySelector('#boss-slot'), ctx, {
          defaultTitle: w.boss[lang].title,
          onDone: (saved) => { stopRecorder = null; if (saved) finishBoss(w); else drawDetail(); },
        });
      });
      el.querySelector('#boss-quiz')?.addEventListener('click', () => quiz(w));
    }

    // Hra „Která struna?“
    function quiz(w) {
      const names = t('quiz.strings').split(',');
      let streak = 0;
      let current = -1;
      function round(message = '') {
        current = nextString(current);
        const order = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5); // tlačítka v náhodném pořadí
        el.querySelector('#boss-slot').innerHTML = `
          <div class="quiz" id="quiz">
            <p class="quiz-msg ${message ? 'show' : ''}" id="quiz-msg" aria-live="polite">${esc(message)}</p>
            ${stringsSvg(current)}
            <p><strong>${esc(t('quiz.question'))}</strong></p>
            <div class="quiz-buttons">${order.map((i) => `<button type="button" class="btn" data-answer="${i}">${esc(names[i])}</button>`).join('')}</div>
            <p class="muted" id="quiz-streak">${esc(t('quiz.streak', { n: streak, total: QUIZ_TARGET }))}</p>
            <div class="bar"><i style="width:${(streak / QUIZ_TARGET) * 100}%"></i></div>
            <button type="button" class="link" id="quiz-close">${esc(t('quiz.close'))}</button>
          </div>`;
        el.querySelector('#quiz').dataset.answer = String(current);
        el.querySelectorAll('[data-answer]').forEach((b) => b.addEventListener('click', async () => {
          if (Number(b.dataset.answer) === current) {
            streak += 1;
            if (streak >= QUIZ_TARGET) { toast(t('quiz.done'), 'ok'); await finishBoss(w); return; }
            play('tick');
            round(t('quiz.right'));
          } else {
            const right = names[current];
            streak = 0;
            round(t('quiz.wrong', { name: right }));
          }
        }));
        el.querySelector('#quiz-close').addEventListener('click', () => drawDetail());
      }
      round();
    }

    await autoBosses();
    drawList();
    return () => stopRecorder?.();
  },
};

// 6 strun zepředu (vlevo nejtlustší E), zvýrazněná struna je oranžová.
function stringsSvg(highlight) {
  const w = 240;
  const h = 150;
  const x = (i) => 30 + i * 36;
  let svg = `<svg class="quiz-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="">`;
  svg += `<rect x="10" y="20" width="${w - 20}" height="${h - 40}" rx="10" fill="var(--wood-soft, var(--sun-soft))"/>`;
  for (let f = 1; f <= 3; f++) svg += `<line x1="14" y1="${20 + f * 28}" x2="${w - 14}" y2="${20 + f * 28}" stroke="var(--line)" stroke-width="2"/>`;
  for (let i = 0; i < 6; i++) {
    const on = i === highlight;
    svg += `<line x1="${x(i)}" y1="8" x2="${x(i)}" y2="${h - 8}" stroke="${on ? 'var(--pick)' : 'var(--muted)'}" stroke-width="${(on ? 3 : 1) + (5 - i) * 0.6}" stroke-linecap="round"/>`;
  }
  return `${svg}</svg>`;
}
