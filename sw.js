// Service worker de 5DIGOS F.C.: permite abrir la app sin conexión.
// Si cambiás los archivos de la app, subí VERSION (v1 -> v2) para que se actualicen en los teléfonos.
const VERSION = 'v1';
const CACHE = '5digos-' + VERSION;
const BASE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
const EXTERNOS = ['cdn.tailwindcss.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com')) return; // los datos siempre van directo al servidor
  const propio = url.origin === self.location.origin;
  if (!propio && !EXTERNOS.includes(url.hostname)) return;
  if (req.mode === 'navigate') {   // la página: primero red (así se actualiza), si no hay señal, la copia guardada
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(ch => ch.put('index.html', c)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {   // lo demás: copia guardada y se refresca en segundo plano
    const red = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(CACHE).then(ch => ch.put(req, c)); } return r; }).catch(() => hit);
    return hit || red;
  }));
});
