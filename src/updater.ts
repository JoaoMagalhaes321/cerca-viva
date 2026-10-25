// Client-side Hot-Update & Cache Controller for Cerca Viva
// Uses Service Worker / CacheStorage to check for live updates from any remote static host,
// caching the entire game bundle offline and updating silently without reinstalling APK.
//
// Como a versão nova chega (card sw-versao): cada build grava uma versão diferente no sw.js
// (src/sw-versao.ts). O navegador vê o sw.js novo, instala, e o service worker novo assume a
// página ("controllerchange"). Nessa hora a página recarrega uma vez e o index.html vem da rede.

export class LiveUpdater {
  public static async init(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        // Na primeiríssima visita não há service worker antigo: nada a recarregar.
        const jaTinhaVersao = !!navigator.serviceWorker.controller;
        let recarregou = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!jaTinhaVersao || recarregou) return;
          recarregou = true;
          console.log('[LiveUpdater] Nova atualização recebida! Recarregando bundle...');
          window.location.reload();
        });
        const swUrl = new URL('sw.js', window.location.href).href;
        const reg = await navigator.serviceWorker.register(swUrl);
        reg.update();
      } catch (err) {
        console.log('[LiveUpdater] ServiceWorker não suportado no ambiente nativo atual:', err);
      }
    }
  }
}
