// Kontrola nových samolepek a jejich oslava. Volá se po vykreslení obrazovky a po důležitých akcích.
import { esc } from './ui.js';
import { STICKERS, stickerFacts, evaluateStickers } from './logic/stickers.js';
import { computeProgress } from './logic/progress.js';
import { worldStates } from './logic/worlds.js';
import { localDateString } from './logic/dates.js';
import { loadContent } from './content.js';
import { metronomeDays } from './logic/metronome.js';
import { bestOverall } from './logic/changes.js';
import { clipWeeks } from './logic/diary.js';
import { play } from './sounds.js';

export async function stickerData(store) {
  const [data, chordProgress, clips, reports, seen, content, metronome] = await Promise.all([
    store.loadProgressData(), store.getChordProgress(), store.listClips(), store.listReports(), store.getStickersSeen(), loadContent(),
    store.getMetronome(),
  ]);
  const progress = computeProgress(data.sessions, new Date(), data);
  const worldsDone = worldStates(content.worlds, data.worlds).filter((w) => w.status === 'done').map((w) => w.id);
  const facts = stickerFacts({
    progress, sessions: data.sessions, missions: data.missions, journal: data.journal,
    clips: clips.length, reports: reports.length, chordProgress, worldsDone,
    metronomeDays: metronomeDays(metronome), bestChanges: bestOverall(data.changes), clipWeeks: clipWeeks(clips),
  });
  return { ...evaluateStickers(facts, seen), seen };
}

let running = false;
export async function checkStickers({ t, store }) {
  if (running || document.body.dataset.mode === 'onboarding') return;
  running = true;
  try {
    const { fresh } = await stickerData(store);
    if (!fresh.length) return;
    await store.markStickersSeen(fresh, localDateString());
    showPopup(t, fresh);
  } catch (err) {
    console.warn('Samolepky se nepodařilo zkontrolovat', err);
  } finally {
    running = false;
  }
}

function showPopup(t, ids) {
  document.getElementById('sticker-pop')?.remove();
  const items = ids.map((id) => STICKERS.find((s) => s.id === id));
  const pop = document.createElement('div');
  pop.id = 'sticker-pop';
  pop.className = 'sticker-pop';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', ids.length === 1 ? t('album.new') : t('album.newMany', { n: ids.length }));
  pop.innerHTML = `
    <div class="sticker-pop-card">
      <h2>${esc(ids.length === 1 ? t('album.new') : t('album.newMany', { n: ids.length }))}</h2>
      <div class="sticker-pop-list">
        ${items.map((s) => `<div class="sticker earned"><span aria-hidden="true">${s.emoji}</span><small>${esc(t(`sticker.${s.id}`))}</small></div>`).join('')}
      </div>
      <button type="button" class="btn primary big" id="sticker-close">${esc(t('album.close'))}</button>
    </div>`;
  document.body.append(pop);
  play('level');
  const close = () => pop.remove();
  pop.querySelector('#sticker-close').addEventListener('click', close);
  pop.addEventListener('click', (e) => { if (e.target === pop) close(); });
}
