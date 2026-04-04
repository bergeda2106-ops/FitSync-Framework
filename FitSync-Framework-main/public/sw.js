/**
 * FitSync Service Worker — build-agnostic offline strategy.
 * - Precaches app shell + Firebase SDK (best effort).
 * - Same-origin: stale-while-revalidate (offline after first successful load).
 * - AI Koç & cloud: /api/*, Firestore, token APIs → network-only (never cached).
 */
const PRECACHE = 'fitsync-precache-v3';
const RUNTIME = 'fitsync-runtime-v3';

const SHELL_URLS = ['/', '/index.html', '/manifest.json', '/icons/icon.svg', '/icons/icon-maskable.svg'];

const OPTIONAL_DEV_ASSETS = [
  '/style.css',
  '/src/app.js',
];

const FIREBASE_SDK_URLS = [
  'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js',
];

function isNetworkOnlyRequest(request) {
  const u = request.url;
  if (request.method !== 'GET') return true;
  if (u.includes('/api/')) return true;
  if (u.includes('generativelanguage.googleapis.com')) return true;
  if (u.includes('firestore.googleapis.com')) return true;
  if (u.includes('firebase.googleapis.com')) return true;
  if (u.includes('securetoken.googleapis.com')) return true;
  if (u.includes('identitytoolkit.googleapis.com')) return true;
  return false;
}

function isFirebaseSdkUrl(url) {
  return url.hostname === 'www.gstatic.com' && url.pathname.includes('/firebasejs/');
}

function isGoogleFontOrStatic(url) {
  const h = url.hostname;
  return (
    h === 'fonts.googleapis.com' ||
    h === 'fonts.gstatic.com' ||
    (h.endsWith('gstatic.com') && !url.pathname.includes('/firebasejs/'))
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      const all = [...SHELL_URLS, ...OPTIONAL_DEV_ASSETS, ...FIREBASE_SDK_URLS];
      await Promise.all(
        all.map(async (url) => {
          try {
            await cache.add(new Request(url, { cache: 'reload' }));
          } catch {
            /* optional path missing in production build */
          }
        }),
      );
    })(),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== PRECACHE && key !== RUNTIME) return caches.delete(key);
          return Promise.resolve();
        }),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (isNetworkOnlyRequest(request)) {
    event.respondWith(fetch(request));
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    if (isFirebaseSdkUrl(url)) {
      event.respondWith(
        fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(RUNTIME).then((c) => c.put(request, copy));
            }
            return res;
          })
          .catch(() => caches.match(request)),
      );
      return;
    }
    if (isGoogleFontOrStatic(url)) {
      event.respondWith(
        caches.open(RUNTIME).then((cache) =>
          fetch(request)
            .then((res) => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            })
            .catch(() => cache.match(request)),
        ),
      );
      return;
    }
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      const runtimeCache = await caches.open(RUNTIME);
      const refresh = () =>
        fetch(request)
          .then((res) => {
            if (res.ok) runtimeCache.put(request, res.clone());
            return res;
          })
          .catch(() => {});

      if (cached) {
        refresh();
        return cached;
      }
      const res = await refresh();
      if (res) return res;
      return caches.match('/index.html');
    })(),
  );
});
