// Report pro učitele (za rodičovským PINem): náhled týdne, výběr nahrávek, odeslání přes WhatsApp.
import { esc } from '../ui.js';
import { formatDate, tn } from '../i18n.js';
import { localDateString, addDays, mondayOf } from '../logic/dates.js';
import { buildWeekReport, reportText, weekRange, shortDate } from '../logic/report.js';
import { loadContent } from '../content.js';
import { requirePin } from './pin-gate.js';
import { clipFile } from './clip-recorder.js';

const MAX_CLIPS = 3;

export default {
  async render(el, ctx) {
    const { t, store, toast, go, lang } = ctx;
    // Formulář PINu se musí ukázat hned, proto se na něj nečeká uvnitř render().
    requirePin(el, ctx).then((ok) => (ok ? show() : go('ja')));

    async function show() {
      const [content, data, homework, chordProgress, profile, allClips] = await Promise.all([
        loadContent(), store.loadProgressData(), store.listHomework(), store.getChordProgress(), store.getProfile(), store.listClips(),
      ]);
      let reports = await store.listReports();
      const thisMonday = mondayOf(new Date());
      let monday = thisMonday;
      let selected = null; // null = výchozí výběr: všechny nahrávky týdne (nejvýš 3 nejnovější)

      function draw() {
        const w = weekRange(monday);
        const weekClips = allClips.filter((c) => c.date >= w.startKey && c.date <= w.endKey);
        selected ??= new Set(weekClips.slice(0, MAX_CLIPS).map((c) => c.id));
        const chosen = weekClips.filter((c) => selected.has(c.id));
        const report = buildWeekReport({
          monday, sessions: data.sessions, missions: data.missions, homework, journal: data.journal,
          chords: content.chords, chordProgress, clips: chosen,
        });
        const text = reportText(report, { t, lang, nickname: profile.nickname });
        const sent = reports.find((r) => r.week === w.startKey);
        const isCurrent = localDateString(monday) === localDateString(thisMonday);

        el.innerHTML = `
          <div class="week-nav">
            <button type="button" class="icon-btn" id="prev" aria-label="${esc(t('report.prev'))}">‹</button>
            <strong id="week-label">${esc(t('report.week', { from: shortDate(w.startKey, lang), to: `${shortDate(w.endKey, lang)} ${w.end.getFullYear()}` }))}</strong>
            <button type="button" class="icon-btn" id="next" aria-label="${esc(t('report.next'))}" ${isCurrent ? 'disabled' : ''}>›</button>
          </div>
          ${sent ? `<p class="note">✔ ${esc(t('report.sentOn', { date: formatDate(new Date(sent.sentAt)) }))}</p>` : ''}

          <section class="card">
            <h3>${esc(t('report.preview'))}</h3>
            <pre class="report-preview" id="report-text">${esc(text)}</pre>
          </section>

          <section class="card">
            <h3>${esc(t('report.pickClips'))}</h3>
            ${weekClips.length ? `<ul class="clip-pick">${weekClips.map((c) => `
              <li><label class="check-row">
                <input type="checkbox" data-clip="${esc(c.id)}" ${selected.has(c.id) ? 'checked' : ''}>
                <span>${c.kind === 'audio' ? '🎙️' : '🎥'} ${esc(c.title)} <span class="muted small">${Math.round(c.seconds)} s</span></span>
              </label></li>`).join('')}</ul>` : `<p class="muted">${esc(t('report.noClips'))}</p>`}
          </section>

          <button type="button" class="btn primary big" id="send">${esc(chosen.length ? tn('report.sendWith', chosen.length) : t('report.send'))}</button>
          <p class="muted small">${esc(t('report.sendHint'))}</p>
          <button type="button" class="btn" id="copy">${esc(t('report.copy'))}</button>`;

        el.querySelector('#prev').addEventListener('click', () => { monday = addDays(monday, -7); selected = null; draw(); });
        el.querySelector('#next').addEventListener('click', () => { if (!isCurrent) { monday = addDays(monday, 7); selected = null; draw(); } });
        el.querySelectorAll('[data-clip]').forEach((box) => box.addEventListener('change', () => {
          if (box.checked && selected.size >= MAX_CLIPS) { box.checked = false; toast(t('report.maxClips')); return; }
          if (box.checked) selected.add(box.dataset.clip); else selected.delete(box.dataset.clip);
          draw();
        }));
        el.querySelector('#copy').addEventListener('click', () => copyText(text, true));
        el.querySelector('#send').addEventListener('click', () => send(text, chosen, w.startKey));
      }

      async function copyText(text, announce) {
        try {
          await navigator.clipboard.writeText(text);
          if (announce) toast(t('report.copied'), 'ok');
          return true;
        } catch {
          const range = document.createRange();
          range.selectNodeContents(el.querySelector('#report-text'));
          getSelection().removeAllRanges();
          getSelection().addRange(range);
          return false;
        }
      }

      async function send(text, clips, week) {
        // WhatsApp občas text u souborů vynechá, proto je text vždy i ve schránce.
        const clipboardPromise = copyText(text, false);
        if (!navigator.share) {
          await clipboardPromise;
          toast(t('report.copied'), 'ok');
          return;
        }
        // Text i nahrávky v jednom sdílení. Když to iPhone neumí, zkusí jen nahrávky (text je ve schránce),
        // a nakonec jen text.
        const files = clips.map(clipFile);
        const can = (p) => !navigator.canShare || navigator.canShare(p);
        const options = files.length ? [{ text, files }, { files }, { text }] : [{ text }];
        const payload = options.find(can) ?? { text };
        try {
          await navigator.share(payload);
          if (files.length && !payload.files) toast(t('report.filesFailed'), 'error');
          else if (!payload.text) toast(t('report.textInClipboard'), 'ok');
          await store.markReportSent(week, payload.files ? clips.map((c) => c.id) : []);
          reports = await store.listReports();
          ctx.checkStickers();
          if (payload.text && (payload.files || !files.length)) toast(t('report.sent'), 'ok');
          draw();
        } catch (err) {
          if (err?.name === 'AbortError') toast(t('report.cancelled'));
          else { console.error(err); toast(t('report.copied'), 'ok'); }
        }
      }

      draw();
    }
  },
};
