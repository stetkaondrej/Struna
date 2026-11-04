// Zástupná obrazovka pro záložky, které se postaví v dalších krocích.
import { esc } from '../ui.js';

export function soonScreen(route, step) {
  return {
    render(el, { t }) {
      el.innerHTML = `
        <section class="card soon">
          <h2>${esc(t('soon.title'))}</h2>
          <p>${esc(t(`soon.${route}`))}</p>
          <span class="pill">${esc(t('soon.step', { n: step }))}</span>
        </section>`;
    },
  };
}
