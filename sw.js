const V = 'pinprofit-v2';
const FILES = ['./', 'index.html', 'styles.css', 'theme.js', 'gen.js', 'studio.js', 'app.js', 'logo.png', 'favicon-32.png', 'icon-192.png', 'apple-touch-icon.png', 'manifest.webmanifest', '404.html'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Network first so new deployments show up; cached copy when offline. Same-origin GETs only.
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(r, copy)); } return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
