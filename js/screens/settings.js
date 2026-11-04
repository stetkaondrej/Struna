// Nastavení: jazyk, záloha a obnova, stav úložiště, verze.
import { esc } from '../ui.js';
import { LANGS, TEXTS, formatDate, formatBytes } from '../i18n.js';
import { VERSION } from '../version.js';
import { avatarPicker, wireAvatarPicker, NICKNAME_MAX } from './onboarding.js';
import { play } from '../sounds.js';

const HELP_URL = 'https://github.com/stetkaondrej/Struna#readme';

const GOALS = [10, 15, 20];

export default {
  async render(el, ctx) {
    const { t, store, toast, lang, setLanguage, rerender } = ctx;
    const [lastBackup, info, settings, profile] = await Promise.all([
      store.getLastBackup(), store.storageInfo(), store.getSettings(), store.getProfile(),
    ]);

    const storageText = info.persisted === true ? t('settings.storage.persisted')
      : info.persisted === false ? t('settings.storage.notPersisted')
      : t('settings.storage.unknown');

    el.innerHTML = `
      <section class="card" id="profile-settings">
        <h3>${esc(t('settings.profile'))}</h3>
        <form id="name-form" class="name-form" novalidate>
          <label class="field"><span>${esc(t('settings.profile.name'))}</span>
            <input type="text" id="nickname" maxlength="${NICKNAME_MAX}" autocomplete="nickname"
              placeholder="${esc(t('onb.name.placeholder'))}" value="${esc(profile.nickname)}"></label>
          <button type="submit" class="btn">${esc(t('settings.profile.save'))}</button>
        </form>
        <p class="field-label">${esc(t('settings.profile.avatar'))}</p>
        ${avatarPicker(t, profile.avatar)}
      </section>

      <section class="card">
        <h3>${esc(t('settings.sounds'))}</h3>
        <p class="muted">${esc(t('settings.sounds.text'))}</p>
        <button type="button" class="toggle" id="sounds" aria-pressed="${settings.sounds}">
          <span class="switch" aria-hidden="true"></span>${esc(t('settings.sounds.toggle'))}
        </button>
      </section>

      <section class="card">
        <h3>${esc(t('settings.language'))}</h3>
        <div class="segmented" role="group" aria-label="${esc(t('settings.language'))}">
          ${LANGS.map((l) => `<button type="button" data-lang="${l}" aria-pressed="${l === lang}">${esc(TEXTS[l]['lang.name'])}</button>`).join('')}
        </div>
      </section>

      <section class="card">
        <h3>${esc(t('settings.goal'))}</h3>
        <p class="muted">${esc(t('settings.goal.text'))}</p>
        <div class="segmented three" role="group" aria-label="${esc(t('settings.goal'))}">
          ${GOALS.map((n) => `<button type="button" data-goal="${n}" aria-pressed="${n === settings.dailyGoalMin}">${esc(t('settings.goal.option', { n }))}</button>`).join('')}
        </div>
      </section>

      <section class="card">
        <h3>${esc(t('settings.backup'))}</h3>
        <p class="muted">${esc(t('settings.backup.text'))}</p>
        <p><strong>${esc(lastBackup ? t('settings.backup.last', { date: formatDate(lastBackup) }) : t('settings.backup.never'))}</strong></p>
        <div class="row">
          <button type="button" class="btn primary" id="backup">${esc(t('settings.backup.make'))}</button>
          <label class="btn" for="restore-file">${esc(t('settings.restore.pick'))}</label>
          <input type="file" id="restore-file" accept="application/json,.json" hidden>
        </div>
        <div id="restore-confirm" class="confirm" hidden></div>
      </section>

      <section class="card">
        <h3>${esc(t('settings.storage'))}</h3>
        <p class="muted">${esc(storageText)}</p>
        ${info.usage != null && info.quota != null ? `<p class="muted small">${esc(t('settings.storage.usage', { used: formatBytes(info.usage), quota: formatBytes(info.quota) }))}</p>` : ''}
      </section>

      <section class="card">
        <h3>${esc(t('settings.about'))}</h3>
        <p class="muted" id="version">${esc(t('settings.version', { v: VERSION }))}</p>
        <p>${esc(t('settings.about.made'))} 🎸</p>
        <a class="link" href="${HELP_URL}" target="_blank" rel="noopener">${esc(t('settings.about.help'))}</a>
      </section>`;

    el.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', async () => {
      try {
        await setLanguage(b.dataset.lang);
      } catch (err) {
        console.error(err);
        toast(t('error.save'), 'error');
      }
    }));

    const saveProfile = async (patch) => {
      try {
        await store.setProfile(patch);
        toast(t('settings.profile.saved'), 'ok');
      } catch (err) {
        console.error(err);
        toast(t('error.save'), 'error');
      }
    };
    el.querySelector('#name-form').addEventListener('submit', (e) => {
      e.preventDefault();
      el.querySelector('#nickname').blur();
      saveProfile({ nickname: el.querySelector('#nickname').value.trim() });
    });
    wireAvatarPicker(el, (avatar) => saveProfile({ avatar }));

    const soundsBtn = el.querySelector('#sounds');
    soundsBtn.addEventListener('click', async () => {
      const on = soundsBtn.getAttribute('aria-pressed') !== 'true';
      try {
        await ctx.setSounds(on);
        soundsBtn.setAttribute('aria-pressed', String(on));
        if (on) play('tick');
      } catch (err) {
        console.error(err);
        toast(t('error.save'), 'error');
      }
    });

    el.querySelectorAll('[data-goal]').forEach((b) => b.addEventListener('click', async () => {
      try {
        await store.setSetting('dailyGoalMin', Number(b.dataset.goal));
        rerender();
      } catch (err) {
        console.error(err);
        toast(t('error.save'), 'error');
      }
    }));

    el.querySelector('#backup').addEventListener('click', async () => {
      try {
        const file = await store.createBackupFile(lang);
        const saved = await saveFile(file);
        if (!saved) { toast(t('settings.backup.cancelled')); return; }
        await store.markBackedUp();
        toast(t('settings.backup.done'), 'ok');
        rerender();
      } catch (err) {
        console.error(err);
        toast(t('error.save'), 'error');
      }
    });

    const input = el.querySelector('#restore-file');
    const confirmBox = el.querySelector('#restore-confirm');
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      const result = await store.readBackupFile(file);
      if (!result.ok) { toast(t(`error.backup.${result.error}`), 'error'); return; }

      const when = new Date(result.snapshot.exportedAt);
      const dateText = Number.isNaN(when.getTime()) ? file.name : formatDate(when);
      confirmBox.innerHTML = `
        <p>${esc(t('settings.restore.ask', { date: dateText }))}</p>
        <div class="row">
          <button type="button" class="btn danger" id="restore-yes">${esc(t('settings.restore.yes'))}</button>
          <button type="button" class="btn" id="restore-no">${esc(t('settings.restore.no'))}</button>
        </div>`;
      confirmBox.hidden = false;
      confirmBox.querySelector('#restore-no').addEventListener('click', () => { confirmBox.hidden = true; });
      confirmBox.querySelector('#restore-yes').addEventListener('click', async () => {
        try {
          await store.restoreBackup(result.snapshot);
          toast(t('settings.restore.done'), 'ok');
          await ctx.reloadSettings();
        } catch (err) {
          console.error(err);
          toast(t(err.message === 'DATA_NEWER' ? 'error.backup.newer' : 'error.backup.invalid'), 'error');
        }
      });
    });
  },
};

// Uloží soubor. Na iPhonu otevře nabídku Sdílet (Uložit do Souborů, Google Drive…).
// Vrací false, když uživatel nabídku zavřel.
async function saveFile(file) {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return true;
    } catch (err) {
      if (err.name === 'AbortError') return false;
      // Sdílení selhalo jinak, zkusíme klasické stažení.
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return true;
}
