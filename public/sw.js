// Service worker do Cerca Viva.
//
// A versão abaixo é trocada no `npm run build` por uma impressão digital do build
// (plugin em vite.config.ts, regra em src/sw-versao.ts). Como o arquivo muda a cada versão nova
// do jogo, o navegador instala este service worker de novo e o src/updater.ts recarrega a página.
const VERSAO = '__VERSAO_DO_BUILD__';
const CACHE_NAME = 'cerca-viva-' + VERSAO;
const PRECACHE_ASSETS = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Apaga os caches das versões antigas (inclusive o "pvz-evolution-v1" de antes do novo nome).
  // Só guarda cópias de arquivos do site; o progresso do jogador fica no localStorage e não é tocado.
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function guardar(request, response) {
  if (response && response.status === 200 && response.type === 'basic') {
    const copia = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
  }
  return response;
}

// Página (index.html): rede primeiro, para a versão nova chegar já na primeira abertura;
// sem internet, usa a cópia guardada.
function redePrimeiro(request) {
  return fetch(request)
    .then((response) => guardar(request, response))
    .catch(() =>
      caches.match(request).then((cached) => cached || caches.match('./index.html'))
    );
}

// Arquivos de assets/ têm o hash no nome (o Vite troca o nome quando o conteúdo muda):
// a cópia guardada nunca fica velha, então serve dela direto.
function cachePrimeiro(request) {
  return caches.match(request).then((cached) => cached || fetch(request).then((response) => guardar(request, response)));
}

// Demais arquivos (sprites, ícones): serve a cópia na hora e atualiza em segundo plano.
function copiaEAtualiza(request) {
  return caches.match(request).then((cached) => {
    const daRede = fetch(request)
      .then((response) => guardar(request, response))
      .catch(() => cached);
    return cached || daRede;
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const ehPagina = request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  if (ehPagina) {
    event.respondWith(redePrimeiro(request));
  } else if (url.pathname.includes('/assets/')) {
    event.respondWith(cachePrimeiro(request));
  } else {
    event.respondWith(copiaEAtualiza(request));
  }
});
