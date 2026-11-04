// Nahrání ukázky: zvuk přímo ve Struně (mikrofon), video kamerou iPhonu nebo z Fotek.
import { esc } from '../ui.js';
import { localDateString } from '../logic/dates.js';
import { formatBytes } from '../i18n.js';

export const MAX_AUDIO_SEC = 60;
const AUDIO_TYPES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];

const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

// Délka videa (když ji nejde zjistit, vrátí 0).
function mediaDuration(blob, kind) {
  return new Promise((resolve) => {
    const el = document.createElement(kind);
    const url = URL.createObjectURL(blob);
    const done = (v) => { URL.revokeObjectURL(url); resolve(Number.isFinite(v) ? Math.round(v) : 0); };
    el.preload = 'metadata';
    el.onloadedmetadata = () => done(el.duration);
    el.onerror = () => done(0);
    setTimeout(() => done(0), 4000);
    el.src = url;
  });
}

// onDone(saved) se zavolá po uložení nebo zrušení.
export function clipRecorder(el, ctx, { defaultTitle, onDone }) {
  const { t, store, toast } = ctx;
  let stream = null;
  let recorder = null;
  let ticker = null;
  let previewUrl = null;

  const stopAll = () => {
    clearInterval(ticker);
    stream?.getTracks().forEach((tr) => tr.stop());
    stream = null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  };

  function drawStart() {
    el.innerHTML = `
      <div class="recorder" id="recorder">
        <p class="muted small">${esc(t('clips.tip'))}</p>
        <div class="rec-buttons">
          <button type="button" class="btn primary" id="rec-audio">${esc(t('clips.audio'))}</button>
          <label class="btn" for="rec-video">${esc(t('clips.video'))}</label>
          <input type="file" id="rec-video" accept="video/*" capture="environment" hidden>
          <label class="btn" for="rec-pick">${esc(t('clips.pick'))}</label>
          <input type="file" id="rec-pick" accept="video/*" hidden>
        </div>
        <button type="button" class="link" id="rec-cancel">${esc(t('pin.cancel'))}</button>
      </div>`;
    el.querySelector('#rec-audio').addEventListener('click', startAudio);
    for (const id of ['#rec-video', '#rec-pick']) {
      const input = el.querySelector(id);
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;
        const seconds = await mediaDuration(file, 'video');
        drawPreview(file, 'video', seconds);
      });
    }
    el.querySelector('#rec-cancel').addEventListener('click', () => { stopAll(); onDone(false); });
  }

  async function startAudio() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.warn(err);
      toast(t(err?.name === 'NotAllowedError' ? 'clips.micDenied' : 'clips.micError'), 'error');
      return;
    }
    try {
      const mimeType = AUDIO_TYPES.find((m) => window.MediaRecorder?.isTypeSupported?.(m));
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch (err) {
      console.warn(err);
      stopAll();
      toast(t('clips.micError'), 'error');
      return;
    }
    const chunks = [];
    const started = Date.now();
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      const seconds = Math.min(MAX_AUDIO_SEC, Math.round((Date.now() - started) / 1000));
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/mp4' });
      stream?.getTracks().forEach((tr) => tr.stop());
      clearInterval(ticker);
      drawPreview(blob, 'audio', seconds);
    };
    recorder.start(250);
    el.innerHTML = `
      <div class="recorder recording" id="recorder">
        <p class="rec-time" id="rec-time" aria-live="polite">${esc(t('clips.recording', { time: '0:00' }))}</p>
        <button type="button" class="btn danger big" id="rec-stop">⏹ ${esc(t('clips.stop'))}</button>
      </div>`;
    el.querySelector('#rec-stop').addEventListener('click', () => recorder.state !== 'inactive' && recorder.stop());
    ticker = setInterval(() => {
      const sec = (Date.now() - started) / 1000;
      const label = el.querySelector('#rec-time');
      if (label) label.textContent = t('clips.recording', { time: clock(sec) });
      if (sec >= MAX_AUDIO_SEC && recorder.state !== 'inactive') recorder.stop();
    }, 250);
  }

  function drawPreview(blob, kind, seconds) {
    previewUrl = URL.createObjectURL(blob);
    el.innerHTML = `
      <form class="recorder" id="clip-form" novalidate>
        ${kind === 'audio'
          ? `<audio controls src="${previewUrl}" class="clip-media"></audio>`
          : `<video controls playsinline src="${previewUrl}" class="clip-media"></video>`}
        <label class="field"><span>${esc(t('clips.name'))}</span>
          <input type="text" id="clip-title" maxlength="60" value="${esc(defaultTitle)}"></label>
        <div class="row">
          <button type="submit" class="btn primary">${esc(t('clips.save'))}</button>
          <button type="button" class="btn" id="clip-discard">${esc(t('clips.discard'))}</button>
        </div>
      </form>`;
    el.querySelector('#clip-discard').addEventListener('click', () => { stopAll(); drawStart(); });
    el.querySelector('#clip-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await store.addClip({
          date: localDateString(), kind, mime: blob.type || (kind === 'audio' ? 'audio/mp4' : 'video/mp4'),
          seconds, title: el.querySelector('#clip-title').value.trim() || defaultTitle, blob,
        });
        stopAll();
        toast(t('clips.saved'), 'ok');
        onDone(true);
        ctx.checkStickers?.();
      } catch (err) {
        console.error(err);
        toast(t('clips.saveFailed', { size: formatBytes(blob.size) }), 'error');
      }
    });
  }

  drawStart();
  return stopAll;
}

// Navržený název nahrávky: z aktuálního domácího úkolu, jinak „Cvičení 5. 11.“
export async function suggestTitle({ t, store }) {
  const hw = (await store.listHomework()).filter((h) => !h.doneAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (hw) return hw.text.split(/[.,;\n]/)[0].slice(0, 40).trim();
  const d = new Date();
  return t('clips.defaultTitle', { date: `${d.getDate()}. ${d.getMonth() + 1}.` });
}

export function fileExtension(mime = '') {
  if (mime.startsWith('audio/mp4') || mime === 'audio/x-m4a') return 'm4a';
  if (mime.startsWith('audio/webm')) return 'webm';
  if (mime.startsWith('video/quicktime')) return 'mov';
  if (mime.startsWith('video/webm')) return 'webm';
  if (mime.startsWith('video/')) return 'mp4';
  return 'bin';
}

export function clipFile(clip) {
  const safe = (clip.title || 'struna').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 40) || 'struna';
  return new File([clip.blob], `${safe}.${fileExtension(clip.mime)}`, { type: clip.mime });
}
