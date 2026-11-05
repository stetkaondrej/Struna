// Zvuk metronomu. Kliknutí se plánují dopředu (Web Audio), takže tempo neuteče.
// Obraz (svítící šipky) se počítá z uplynulého času, ne ze zvuku, takže sedí i po uspání aplikace.
import { eighthSec, position, clampBpm } from './logic/metronome.js';

let ctx = null;
let timer = null;
let state = null; // { bpm, startedAt (ms), nextEighth (index), audioStart (s) }

const LOOKAHEAD_SEC = 0.15;

function click(at, accent) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = accent ? 1600 : 1000;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(accent ? 0.35 : 0.2, at + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + 0.06);
}

function schedule() {
  if (!state || !ctx) return;
  const step = eighthSec(state.bpm);
  while (state.audioStart + state.nextEighth * step < ctx.currentTime + LOOKAHEAD_SEC) {
    const slot = state.nextEighth % 8;
    if (slot % 2 === 0) click(state.audioStart + state.nextEighth * step, slot === 0); // klik na každou dobu
    state.nextEighth += 1;
  }
}

export function startMetronome(bpm) {
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback'; // hraje i v tichém režimu
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    state = { bpm: clampBpm(bpm), startedAt: Date.now(), nextEighth: 0, audioStart: ctx.currentTime + 0.05 };
    schedule();
    clearInterval(timer);
    timer = setInterval(schedule, 25);
  } catch (err) {
    console.warn('Metronom se nepodařilo spustit', err);
    state = { bpm: clampBpm(bpm), startedAt: Date.now(), nextEighth: 0, audioStart: 0 };
  }
}

// Vrátí, jak dlouho metronom běžel (v sekundách).
export function stopMetronome() {
  clearInterval(timer);
  timer = null;
  const seconds = state ? (Date.now() - state.startedAt) / 1000 : 0;
  state = null;
  if (navigator.audioSession) navigator.audioSession.type = 'ambient';
  return seconds;
}

export const isMetronomeRunning = () => Boolean(state);

// Kde v taktu právě jsme (pro svítící šipky).
export function metronomePosition() {
  return state ? position((Date.now() - state.startedAt) / 1000, state.bpm) : null;
}
