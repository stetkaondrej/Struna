// Displej nezhasne, dokud ho někdo potřebuje (časovač, metronom). Screen Wake Lock.
// Každý „vlastník“ se přihlásí zvlášť; displej může zhasnout, až když ho nepotřebuje nikdo.
// Když to telefon nepodporuje nebo odmítne, nic se nestane.
let sentinel = null;
const owners = new Set();

export async function keepScreenOn(on, owner = 'timer') {
  if (on) owners.add(owner); else owners.delete(owner);
  try {
    if (owners.size) {
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
