// Úvodní průvodce. Plný při první instalaci, krátký (přezdívka + avatar) po aktualizaci.
import { esc, isStandalone } from '../ui.js';
import { AVATARS, avatarEmoji } from '../avatars.js';
import { play } from '../sounds.js';

const GOALS = [10, 15, 20];
export const NICKNAME_MAX = 20;

export function onboardingSteps(mode, standalone) {
  return mode === 'update'
    ? ['update', 'name', 'avatar', 'done']
    : ['welcome', 'name', 'avatar', 'goal', ...(standalone ? [] : ['install']), 'done'];
}

export function onboarding(el, { t, store, toast }, { mode, goal, onFinish }) {
  const steps = onboardingSteps(mode, isStandalone());
  const state = { i: 0, nickname: '', avatar: null, goal };
  const counted = steps.length - 1; // „Hotovo“ se nepočítá

  function draw() {
    const step = steps[state.i];
    const header = step === 'done' ? '' : `
      <div class="onb-top">
        ${state.i > 0 ? `<button type="button" class="link" id="onb-back">‹ ${esc(t('onb.back'))}</button>` : '<span></span>'}
        <span class="muted small">${esc(t('onb.step', { n: state.i + 1, total: counted }))}</span>
      </div>
      <div class="onb-dots" aria-hidden="true">${steps.slice(0, counted).map((_, i) => `<i class="${i <= state.i ? 'on' : ''}"></i>`).join('')}</div>`;

    el.innerHTML = `<section class="onb" data-step="${step}">${header}<div class="onb-body">${body(step)}</div></section>`;
    wire(step);
    el.querySelector('input')?.focus();
  }

  function body(step) {
    const next = (label = t('onb.next')) => `<button type="button" class="btn primary big" id="onb-next">${esc(label)}</button>`;
    const skip = `<button type="button" class="link onb-skip" id="onb-skip">${esc(t('onb.skip'))}</button>`;
    switch (step) {
      case 'welcome':
        return `
          <div class="onb-hero" aria-hidden="true">🎸</div>
          <h2>${esc(t('onb.welcome.title'))}</h2>
          <ol class="onb-list">
            <li><span aria-hidden="true">✅</span>${esc(t('onb.welcome.1'))}</li>
            <li><span aria-hidden="true">⏱️</span>${esc(t('onb.welcome.2'))}</li>
            <li><span aria-hidden="true">🔥</span>${esc(t('onb.welcome.3'))}</li>
          </ol>
          ${next(t('onb.welcome.go'))}`;
      case 'update':
        return `
          <div class="onb-hero" aria-hidden="true">✨</div>
          <h2>${esc(t('onb.update.title'))}</h2>
          <p class="muted">${esc(t('onb.update.text'))}</p>
          ${next()}`;
      case 'name':
        return `
          <h2>${esc(t('onb.name.title'))}</h2>
          <p class="muted">${esc(t('onb.name.hint'))}</p>
          <label class="field"><span class="sr">${esc(t('settings.profile.name'))}</span>
            <input type="text" id="onb-name" maxlength="${NICKNAME_MAX}" autocomplete="nickname" enterkeyhint="next"
              placeholder="${esc(t('onb.name.placeholder'))}" value="${esc(state.nickname)}"></label>
          ${next()}${skip}`;
      case 'avatar':
        return `
          <h2>${esc(t('onb.avatar.title'))}</h2>
          <p class="muted">${esc(t('onb.avatar.hint'))}</p>
          ${avatarPicker(t, state.avatar)}
          ${next()}${skip}`;
      case 'goal':
        return `
          <h2>${esc(t('onb.goal.title'))}</h2>
          <p class="muted">${esc(t('onb.goal.hint'))}</p>
          <div class="segmented three" role="group" aria-label="${esc(t('settings.goal'))}">
            ${GOALS.map((n) => `<button type="button" data-goal="${n}" aria-pressed="${n === state.goal}">${esc(t('settings.goal.option', { n }))}</button>`).join('')}
          </div>
          ${next()}`;
      case 'install':
        return `
          <div class="onb-hero" aria-hidden="true">📲</div>
          <h2>${esc(t('onb.install.title'))}</h2>
          <ol class="onb-list numbered">
            <li>${esc(t('onb.install.1'))}</li>
            <li>${esc(t('onb.install.2'))}</li>
            <li>${esc(t('onb.install.3'))}</li>
          </ol>
          ${next()}`;
      default: {
        const name = state.nickname.trim();
        return `
          <div class="onb-hero big" aria-hidden="true">${state.avatar ? avatarEmoji(state.avatar) : '🎉'}</div>
          <h2>${esc(name ? t('onb.done.title', { name }) : t('onb.done.titleNoName'))}</h2>
          <p class="muted">${esc(t('onb.done.text'))}</p>
          ${next(t('onb.done.go'))}`;
      }
    }
  }

  function wire(step) {
    const go = (delta) => { state.i = Math.max(0, Math.min(steps.length - 1, state.i + delta)); draw(); };
    el.querySelector('#onb-back')?.addEventListener('click', () => go(-1));
    el.querySelector('#onb-skip')?.addEventListener('click', () => {
      if (step === 'name') state.nickname = '';
      if (step === 'avatar') state.avatar = null;
      go(1);
    });
    const input = el.querySelector('#onb-name');
    input?.addEventListener('input', () => { state.nickname = input.value.slice(0, NICKNAME_MAX); });
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(1); } });
    wireAvatarPicker(el, (id) => { state.avatar = id; });
    el.querySelectorAll('[data-goal]').forEach((b) => b.addEventListener('click', () => {
      state.goal = Number(b.dataset.goal);
      el.querySelectorAll('[data-goal]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    }));
    el.querySelector('#onb-next').addEventListener('click', async () => {
      if (step !== 'done') { go(1); return; }
      try {
        await store.setProfile({ nickname: state.nickname.trim(), avatar: state.avatar, onboardedAt: new Date().toISOString() });
        if (mode === 'full') await store.setSetting('dailyGoalMin', state.goal);
        play('mission');
        onFinish();
      } catch (err) {
        console.error(err);
        toast(t('error.save'), 'error');
      }
    });
  }

  draw();
}

// Výběr avatara (průvodce i Nastavení).
export function avatarPicker(t, selected) {
  return `
    <div class="avatars" role="radiogroup" aria-label="${esc(t('settings.profile.avatar'))}">
      ${AVATARS.map((a) => `
        <button type="button" class="avatar-btn" role="radio" data-avatar="${a.id}" aria-checked="${a.id === selected}" aria-label="${esc(t(`avatar.${a.id}`))}">
          <span aria-hidden="true">${a.emoji}</span>
        </button>`).join('')}
    </div>`;
}

export function wireAvatarPicker(el, onPick) {
  el.querySelectorAll('[data-avatar]').forEach((b) => b.addEventListener('click', () => {
    el.querySelectorAll('[data-avatar]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    onPick(b.dataset.avatar);
  }));
}
