// Nakreslí prstoklad akordu jako obrázek (SVG).
// Svisle struny (vlevo nejtlustší E), vodorovně pražce, nahoře pražec 0 (nultý pražec / „nut“).
import { esc } from './ui.js';

export function chordDiagram(chord, { width = 120, numbers = true, strings = null, label = '' } = {}) {
  const pad = Math.max(12, width * 0.09);
  const gap = (width - 2 * pad) / 5;
  const mark = gap * 0.24;          // velikost značek ○ a × nad krkem
  const top = mark * 2 + 10;        // místo pro značky nad nultým pražcem
  const markY = top - mark - 5;
  const fretH = gap * 1.25;
  const frets = 4;
  const height = top + fretH * frets + (strings ? 22 : 8);
  const x = (i) => pad + i * gap;
  const y = (f) => top + f * fretH;
  let svg = `<svg class="chord-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(label)}">`;

  for (let f = 0; f <= frets; f++) {
    svg += `<line x1="${x(0)}" y1="${y(f)}" x2="${x(5)}" y2="${y(f)}" stroke="var(--ink)" stroke-width="${f === 0 ? 4 : 1.2}" stroke-linecap="round"/>`;
  }
  for (let i = 0; i < 6; i++) {
    svg += `<line x1="${x(i)}" y1="${y(0)}" x2="${x(i)}" y2="${y(frets)}" stroke="var(--muted)" stroke-width="${1 + (5 - i) * 0.25}"/>`;
  }
  const r = gap * 0.38;
  chord.frets.forEach((fret, i) => {
    if (fret === -1) {
      const s = mark * 0.8;
      svg += `<path d="M${x(i) - s} ${markY - s}L${x(i) + s} ${markY + s}M${x(i) + s} ${markY - s}L${x(i) - s} ${markY + s}" stroke="var(--pick)" stroke-width="2" stroke-linecap="round"/>`;
    } else if (fret === 0) {
      svg += `<circle cx="${x(i)}" cy="${markY}" r="${mark}" fill="none" stroke="var(--teal)" stroke-width="2"/>`;
    } else {
      const cy = y(fret - 0.5);
      svg += `<circle cx="${x(i)}" cy="${cy}" r="${r}" fill="var(--teal)"/>`;
      if (numbers && chord.fingers[i]) {
        svg += `<text x="${x(i)}" y="${cy}" dy="0.35em" text-anchor="middle" font-size="${r * 1.15}" font-weight="700" fill="var(--on-accent)" font-family="system-ui, sans-serif">${chord.fingers[i]}</text>`;
      }
    }
  });
  if (strings) {
    strings.forEach((name, i) => {
      svg += `<text x="${x(i)}" y="${y(frets) + 16}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="system-ui, sans-serif">${esc(name)}</text>`;
    });
  }
  return `${svg}</svg>`;
}
