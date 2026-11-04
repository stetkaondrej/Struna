// Zvuky radosti. Tóny se skládají přímo v aplikaci (Web Audio), žádné soubory ani internet.
// iPhone pustí zvuk jen po klepnutí, proto se přehrávají jen jako reakce na tlačítko.

// Noty: [frekvence v Hz, začátek v s, délka v s]
export const SOUNDS = {
  tick: [[880, 0, 0.09], [1320, 0.07, 0.14]],                             // odškrtnutý úkol
  mission: [[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.12], [1047, 0.3, 0.3]], // splněná mise
  done: [[659, 0, 0.12], [784, 0.12, 0.25]],                               // dokončené cvičení
  level: [[523, 0, 0.14], [523, 0.15, 0.14], [523, 0.3, 0.14], [698, 0.45, 0.5], [880, 0.6, 0.6]], // nová úroveň
};

let enabled = true;
let ctx = null;

export function setSoundsEnabled(on) {
  enabled = Boolean(on);
}

export function play(name) {
  if (!enabled || !SOUNDS[name]) return;
  try {
    // Zvuk se řídí tlačítkem pro tichý režim iPhonu.
    if (navigator.audioSession) navigator.audioSession.type = 'ambient';
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime + 0.02;
    for (const [freq, start, length] of SOUNDS[name]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + start);
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + length);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + start);
      osc.stop(t0 + start + length + 0.05);
    }
  } catch {
    // Bez zvuku aplikace funguje dál.
  }
}
