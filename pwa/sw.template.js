/* Service worker di AceGame — generato a ogni build da vite.config.ts (plugin "pwa").
   Il gioco non ha backend: tutto quello che serve è nella lista PRECACHE.
   - File con hash (assets/…): cache-first, non cambiano mai.
   - Pagina (index.html) e file senza hash: rete prima, cache se offline.
   Una nuova versione si installa in background e vale dal riavvio successivo dell'app:
   la run in corso non viene mai ricaricata a metà. */
const VERSION = '__VERSION__';
const CACHE = 'acegame-' + VERSION;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE.map((p) => new Request(p, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('acegame-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// La pagina chiede di attivare subito la versione nuova quando è sicuro (al menu).
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // Rete con timeout breve: con segnale debole il gioco parte lo stesso dalla cache.
    event.respondWith(networkFirst(req, './index.html', 3000));
    return;
  }
  if (url.pathname.includes('/assets/')) {
    event.respondWith(caches.match(req).then((hit) => hit || fetchAndStore(req)));
    return;
  }
  event.respondWith(networkFirst(req, null, 3000));
});

async function fetchAndStore(req) {
  const res = await fetch(req);
  if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
  return res;
}

async function networkFirst(req, fallbackKey, timeoutMs) {
  const cache = await caches.open(CACHE);
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    if (res.ok) cache.put(fallbackKey || req, res.clone());
    return res;
  } catch (err) {
    const hit = (await cache.match(fallbackKey || req)) || (await cache.match(req, { ignoreSearch: true }));
    if (hit) return hit;
    throw err;
  }
}
