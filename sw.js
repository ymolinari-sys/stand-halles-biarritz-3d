// Service worker de la visite 3D (GitHub Pages) : la page est servie « réseau d'abord » (les nouvelles versions arrivent),
// les ressources (textures, avatars GLB, three.js sur cdn.jsdelivr.net) « cache d'abord » (hors-ligne après la première visite).
// Si une ressource change de contenu sans changer de nom : incrémenter CACHE.
const CACHE = 'halles3d-v1';
const PRE = ['./index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
      return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  if (url.origin !== location.origin && url.hostname !== 'cdn.jsdelivr.net') return;   // polices Google, etc. : réseau normal
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  })));
});
