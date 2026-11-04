// Záložka Akordy: přehled 7 akordů a detail s prstokladem, hvězdičkami a „Učím se“.
import { esc } from '../ui.js';
import { loadContent } from '../content.js';
import { chordDiagram } from '../chord-diagram.js';

const starsText = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

export default {
  async render(el, ctx) {
    const { t, store, toast, lang } = ctx;
    const { chords } = await loadContent();
    let progress = await store.getChordProgress();
    let openId = null;
    const strings = t('chords.strings').split(',');
    const info = (id) => ({ stars: 0, learning: false, ...progress[id] });

    function drawList() {
      el.innerHTML = `
        <p class="muted">${esc(t('chords.intro'))}</p>
        <div class="chord-grid">
          ${chords.map((c) => {
            const p = info(c.id);
            return `
              <button type="button" class="chord-card" data-chord="${c.id}" aria-label="${esc(`${c.id}, ${c[lang].label}, ${t('chords.stars', { n: p.stars })}`)}">
                <span class="chord-name">${esc(c.id)}</span>
                ${chordDiagram(c, { width: 96, numbers: false })}
                <span class="stars" aria-hidden="true">${starsText(p.stars)}</span>
                ${p.learning ? `<span class="pill small">${esc(t('chords.learning'))}</span>` : '<span class="pill small ghost" aria-hidden="true">&nbsp;</span>'}
              </button>`;
          }).join('')}
        </div>
        <p class="muted small">${esc(t('chords.inMission'))}</p>`;
      el.querySelectorAll('[data-chord]').forEach((b) => b.addEventListener('click', () => { openId = b.dataset.chord; drawDetail(); }));
    }

    function drawDetail() {
      const c = chords.find((x) => x.id === openId);
      const p = info(c.id);
      el.innerHTML = `
        <button type="button" class="link back" id="back">‹ ${esc(t('chords.back'))}</button>
        <section class="card chord-detail">
          <h2>${esc(c.id)} <span class="muted">· ${esc(c[lang].label)}</span></h2>
          <div class="chord-big">${chordDiagram(c, { width: 230, strings, label: `${c.id} ${c[lang].label}` })}</div>
          <p>${esc(c[lang].tip)}</p>
          <p class="muted small">${esc(t('chords.legend'))}</p>
          <button type="button" class="toggle" id="learning" aria-pressed="${p.learning}">
            <span class="switch" aria-hidden="true"></span>${esc(t('chords.learning'))}
          </button>
        </section>
        <section class="card">
          <h3>${esc(t('chords.howWell'))}</h3>
          <div class="star-levels" role="group" aria-label="${esc(t('chords.howWell'))}">
            ${[1, 2, 3].map((n) => `
              <button type="button" class="star-level" data-stars="${n}" aria-pressed="${p.stars >= n}">
                <span class="stars" aria-hidden="true">${starsText(n)}</span>
                <span>${esc(t(`chords.star${n}`))}</span>
              </button>`).join('')}
          </div>
        </section>`;

      el.querySelector('#back').addEventListener('click', () => { openId = null; drawList(); });
      el.querySelector('#learning').addEventListener('click', async () => {
        const turningOff = info(c.id).learning;
        const othersLearning = chords.some((x) => x.id !== c.id && info(x.id).learning);
        if (turningOff && !othersLearning) { toast(t('chords.keepOne')); return; }
        await save(c.id, { learning: !turningOff });
      });
      el.querySelectorAll('[data-stars]').forEach((b) => b.addEventListener('click', async () => {
        const n = Number(b.dataset.stars);
        // Klepnutí na už vybranou úroveň ji zruší (o hvězdičku níž).
        await save(c.id, { stars: info(c.id).stars === n ? n - 1 : n });
      }));
    }

    async function save(id, patch) {
      try {
        progress = await store.setChordProgress(id, patch);
        drawDetail();
        ctx.checkStickers();
      } catch (err) {
        console.error(err);
        toast(t('error.save'), 'error');
      }
    }

    drawList();
  },
};
