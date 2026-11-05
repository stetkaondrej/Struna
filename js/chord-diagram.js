// Nakreslí prstoklad akordu jako obrázek (SVG).
// Svisle struny (vlevo nejtlustší E), vodorovně pražce.
// Akordy u hlavy kytary začínají nultým pražcem (silná čára nahoře).
// Akordy výš na krku (např. barré ve 3. pražci) začínají od svého pražce a vlevo je jeho číslo.
import { esc } from './ui.js';

const VISIBLE_FRETS = 4;

// Od kterého pražce se diagram kreslí (1 = od hlavy kytary).
export function baseFret(chord) {
  const played = chord.frets.filter((f) => f > 0);
  if (!played.length || Math.max(...played) <= VISIBLE_FRETS) return 1;
  return Math.min(...played);
}

// Barré = ukazováček (prst 1) na více strunách ve stejném pražci. Vrátí { fret, from, to } nebo null.
export function barreOf(chord) {
  const idx = chord.fingers.map((f, i) => (f === 1 && chord.frets[i] > 0 ? i : -1)).filter((i) => i >= 0);
  if (idx.length < 2) return null;
  const fret = chord.frets[idx[0]];
  if (!idx.every((i) => chord.frets[i] === fret)) return null;
  return { fret, from: Math.min(...idx), to: Math.max(...idx) };
}

export function chordDiagram(chord, { width = 120, numbers = true, strings = null, label = '' } = {}) {
  const base = baseFret(chord);
  const pad = Math.max(12, width * 0.09);
  const padLeft = base > 1 ? pad * 1.9 : pad; // vlevo místo pro číslo pražce
  const gap = (width - padLeft - pad) / 5;
  const mark = gap * 0.24;          // velikost značek ○ a × nad krkem
  const top = mark * 2 + 10;        // místo pro značky nad prvním pražcem
  const markY = top - mark - 5;
  const fretH = gap * 1.25;
  const height = top + fretH * VISIBLE_FRETS + (strings ? 22 : 8);
  const x = (i) => padLeft + i * gap;
  const y = (f) => top + f * fretH;
  const row = (fret) => fret - base + 0.5; // střed políčka daného pražce
  const r = gap * 0.38;
  let svg = `<svg class="chord-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(label)}">`;

  for (let f = 0; f <= VISIBLE_FRETS; f++) {
    const nut = f === 0 && base === 1;
    svg += `<line x1="${x(0)}" y1="${y(f)}" x2="${x(5)}" y2="${y(f)}" stroke="var(--ink)" stroke-width="${nut ? 4 : 1.2}" stroke-linecap="round"/>`;
  }
  for (let i = 0; i < 6; i++) {
    svg += `<line x1="${x(i)}" y1="${y(0)}" x2="${x(i)}" y2="${y(VISIBLE_FRETS)}" stroke="var(--muted)" stroke-width="${1 + (5 - i) * 0.25}"/>`;
  }
  if (base > 1) {
    // Číslo pražce, od kterého diagram začíná
    svg += `<text class="base-fret" x="${x(0) - r - 2}" y="${y(0.5)}" dy="0.35em" text-anchor="end" font-size="${Math.max(9, r * 1.1)}" font-weight="700" fill="var(--ink)" font-family="system-ui, sans-serif">${base}</text>`;
  }

  const barre = barreOf(chord);
  if (barre) {
    const cy = y(row(barre.fret));
    svg += `<rect class="barre" x="${x(barre.from) - r}" y="${cy - r}" width="${x(barre.to) - x(barre.from) + 2 * r}" height="${2 * r}" rx="${r}" fill="var(--teal)"/>`;
    if (numbers) {
      svg += `<text x="${x(barre.from)}" y="${cy}" dy="0.35em" text-anchor="middle" font-size="${r * 1.15}" font-weight="700" fill="var(--on-accent)" font-family="system-ui, sans-serif">1</text>`;
    }
  }

  chord.frets.forEach((fret, i) => {
    if (fret === -1) {
      const s = mark * 0.8;
      svg += `<path d="M${x(i) - s} ${markY - s}L${x(i) + s} ${markY + s}M${x(i) + s} ${markY - s}L${x(i) - s} ${markY + s}" stroke="var(--pick)" stroke-width="2" stroke-linecap="round"/>`;
    } else if (fret === 0) {
      svg += `<circle cx="${x(i)}" cy="${markY}" r="${mark}" fill="none" stroke="var(--teal)" stroke-width="2"/>`;
    } else if (!(barre && chord.fingers[i] === 1 && fret === barre.fret)) {
      const cy = y(row(fret));
      svg += `<circle cx="${x(i)}" cy="${cy}" r="${r}" fill="var(--teal)"/>`;
      if (numbers && chord.fingers[i]) {
        svg += `<text x="${x(i)}" y="${cy}" dy="0.35em" text-anchor="middle" font-size="${r * 1.15}" font-weight="700" fill="var(--on-accent)" font-family="system-ui, sans-serif">${chord.fingers[i]}</text>`;
      }
    }
  });
  if (strings) {
    strings.forEach((name, i) => {
      svg += `<text x="${x(i)}" y="${y(VISIBLE_FRETS) + 16}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="system-ui, sans-serif">${esc(name)}</text>`;
    });
  }
  return `${svg}</svg>`;
}
