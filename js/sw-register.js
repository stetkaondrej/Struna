// Registrace service workeru (offline režim) a nabídka aktualizace.
export function registerServiceWorker(onUpdateReady) {
  if (!('serviceWorker' in navigator)) return;

  let userAskedForUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Stránku přenačteme jen tehdy, když uživatel sám klepl na „Aktualizovat“.
    if (userAskedForUpdate) location.reload();
  });

  const offer = (worker) => onUpdateReady(() => {
    userAskedForUpdate = true;
    worker.postMessage({ type: 'SKIP_WAITING' });
  });

  navigator.serviceWorker.register('./sw.js').then((reg) => {
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) offer(worker);
      });
    });
    // Při každém návratu do aplikace zkontrolujeme, jestli nevyšla nová verze.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update().catch(() => {});
    });
  }).catch((err) => console.warn('Service worker se nepodařilo zaregistrovat', err));
}
