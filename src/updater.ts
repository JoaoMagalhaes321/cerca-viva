// Client-side Hot-Update & Cache Controller for PvZ: Evolution
// Uses Service Worker / CacheStorage to check for live updates from any remote static host,
// caching the entire game bundle offline and updating silently without reinstalling APK.

export class LiveUpdater {
  public static async init(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const swUrl = new URL('sw.js', window.location.href).href;
        const reg = await navigator.serviceWorker.register(swUrl);
        reg.update();
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[LiveUpdater] Nova atualização recebida! Recarregando bundle...');
                window.location.reload();
              }
            });
          }
        });
      } catch (err) {
        console.log('[LiveUpdater] ServiceWorker não suportado no ambiente nativo atual:', err);
      }
    }
  }
}
