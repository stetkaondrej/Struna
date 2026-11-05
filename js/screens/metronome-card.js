// Metronom na obrazovce Cvičení: tempo, rytmus brnkání, svítící šipky.
import { esc } from '../ui.js';
import { PATTERNS, clampBpm, logRun, BPM_MIN, BPM_MAX } from '../logic/metronome.js';
import { localDateString } from '../logic/dates.js';
import { startMetronome, stopMetronome, isMetronomeRunning, metronomePosition } from '../metronome-audio.js';
import { keepScreenOn } from '../wakelock.js';

const ARROW = { down: '↓', up: '↑' };

export async function metronomeCard(el, ctx) {
  const { t, store, toast } = ctx;
  let settings = await store.getMetronome();
  let anim = null;

  // Uloží, jak dlouho metronom běžel (kvůli výzvě světa 5 a samolepce Rytmus).
  async function logSegment() {
    if (!isMetronomeRunning()) return;
    const seconds = stopMetronome();
    try {
      settings = await store.updateMetronome((m) => logRun(m, { date: localDateString(), seconds, bpm: settings.bpm, pattern: settings.pattern }));
    } catch (err) { console.error(err); }
  }

  async function saveSettings(patch) {
    settings = { ...settings, ...patch };
    try { await store.updateMetronome((m) => ({ ...m, ...patch })); } catch (err) { console.error(err); toast(t('error.save'), 'error'); }
  }

  function draw() {
    const running = isMetronomeRunning();
    const slots = PATTERNS[settings.pattern].slots;
    el.innerHTML = `
      <section class="card metro" id="metronome">
        <h3>🥁 ${esc(t('metro.title'))}</h3>
        <div class="metro-tempo">
          <button type="button" class="icon-btn big-icon" id="metro-slower" aria-label="${esc(t('metro.slower'))}">−</button>
          <div class="metro-bpm"><strong id="metro-bpm">${settings.bpm}</strong><span class="muted small">BPM</span></div>
          <button type="button" class="icon-btn big-icon" id="metro-faster" aria-label="${esc(t('metro.faster'))}">+</button>
        </div>
        <label class="field"><span class="sr">${esc(t('metro.tempo'))}</span>
          <input type="range" id="metro-range" min="${BPM_MIN}" max="${BPM_MAX}" step="1" value="${settings.bpm}" aria-label="${esc(t('metro.tempo'))}"></label>
        <div class="segmented" role="group" aria-label="${esc(t('metro.pattern'))}">
          ${Object.keys(PATTERNS).map((p) => `<button type="button" data-pattern="${p}" aria-pressed="${p === settings.pattern}">${esc(t(`metro.pattern.${p}`))}</button>`).join('')}
        </div>
        <div class="metro-slots" id="metro-slots" aria-hidden="true">
          ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<span class="slot ${i % 2 ? 'and' : 'beat'}" data-slot="${i}"><b>${slots[i] ? ARROW[slots[i]] : ''}</b><small>${i % 2 ? (ctx.lang === 'en' ? '&' : 'a') : i / 2 + 1}</small></span>`).join('')}
        </div>
        <button type="button" class="btn ${running ? '' : 'primary'} big" id="metro-toggle">${esc(running ? t('metro.stop') : t('metro.start'))}</button>
        <p class="muted small">${esc(t('metro.hint'))}</p>
      </section>`;

    el.querySelector('#metro-toggle').addEventListener('click', toggle);
    const setBpm = async (bpm) => {
      const value = clampBpm(bpm);
      if (value === settings.bpm) return;
      const wasRunning = isMetronomeRunning();
      if (wasRunning) await logSegment();
      await saveSettings({ bpm: value });
      if (wasRunning) startMetronome(value);
      el.querySelector('#metro-bpm').textContent = String(value);
      el.querySelector('#metro-range').value = String(value);
    };
    el.querySelector('#metro-slower').addEventListener('click', () => setBpm(settings.bpm - 5));
    el.querySelector('#metro-faster').addEventListener('click', () => setBpm(settings.bpm + 5));
    el.querySelector('#metro-range').addEventListener('change', (e) => setBpm(e.target.value));
    el.querySelectorAll('[data-pattern]').forEach((b) => b.addEventListener('click', async () => {
      const wasRunning = isMetronomeRunning();
      if (wasRunning) await logSegment();
      await saveSettings({ pattern: b.dataset.pattern });
      if (wasRunning) startMetronome(settings.bpm);
      draw();
    }));
  }

  async function toggle() {
    if (isMetronomeRunning()) {
      await logSegment();
      clearInterval(anim);
      keepScreenOn(false, 'metronome');
      draw();
      ctx.checkStickers?.();
      return;
    }
    startMetronome(settings.bpm);
    keepScreenOn(true, 'metronome');
    draw();
    clearInterval(anim);
    anim = setInterval(() => {
      const pos = metronomePosition();
      if (!pos) return;
      el.querySelectorAll('.slot').forEach((s) => s.classList.toggle('on', Number(s.dataset.slot) === pos.slot));
    }, 30);
  }

  draw();

  // Úklid při odchodu z obrazovky: metronom se zastaví a čas se uloží.
  return async () => {
    clearInterval(anim);
    if (isMetronomeRunning()) await logSegment();
    keepScreenOn(false, 'metronome');
  };
}
