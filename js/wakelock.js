// Displej nezhasne, dokud běží cvičení (Screen Wake Lock).
// Když to telefon nepodporuje nebo odmítne, nic se nestane.
let sentinel = null;

export async function keepScreenOn(on) {
  try {
    if (on) {
      if (sentinel || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
      sentinel = await navigator.wakeLock.request('screen');
      sentinel.addEventListener('release', () => { sentinel = null; });
    } else if (sentinel) {
      const s = sentinel;
      sentinel = null;
      await s.release();
    }
  } catch {
    sentinel = null;
  }
}
