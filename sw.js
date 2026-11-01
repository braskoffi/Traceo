/* Service worker de la Boîte à outils réseau.
   - Met en cache l'application pour qu'elle s'ouvre hors ligne.
   - Ne touche qu'aux requêtes de même origine (jamais aux API externes).
   - Réseau d'abord (toujours la dernière version), cache en secours. */
const C = 'boite-v2';
const FILES = ['./', 'index.html', 'manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Supprime les anciennes versions du cache, puis prend le contrôle des pages ouvertes
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r)
      .then(res => {
        // On ne mémorise que les réponses complètes et valides
        if (res.status === 200) {
          const copy = res.clone();
          caches.open(C).then(c => c.put(r, copy));
        }
        return res;
      })
      .catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
