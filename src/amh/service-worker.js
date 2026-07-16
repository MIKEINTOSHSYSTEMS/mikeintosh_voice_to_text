/**
 * Service Worker
 * Amharic Voice-to-Text PWA - Application Shell Cache
 *
 * Strategy: Cache-first for static assets, network-only for everything else.
 * Does NOT cache user data (IndexedDB handles transcripts).
 * Does NOT intercept Web Speech API requests.
 */

const CACHE_VERSION = 'v4';
const CACHE_NAME = 'amvtt-shell-' + CACHE_VERSION;

var APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/storage.js',
  './js/error-handler.js',
  './js/settings.js',
  './js/theme.js',
  './js/stats.js',
  './js/history.js',
  './js/history-ui.js',
  './js/settings-ui.js',
  './js/search.js',
  './js/audio.js',
  './js/audio-upload.js',
  './js/audio-player.js',
  './js/transcription-engine.js',
  './js/speech.js',
  './js/pwa.js',
  './prompts/prompts.js',
  './js/ai/ai-service.js',
  './js/ai/summarizer.js',
  './js/ai/translator.js',
  './js/ai/analyzer.js',
  './js/ai/ai-ui.js',
  './assets/favicon.png',
  './assets/mikeintosh_systems_sm.png',
  './assets/mic-animate.gif',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-512x512.png',
  './assets/icons/icon-maskable-512x512.png',
];

// Install: pre-cache app shell
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_NAME;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// Message handler: skip waiting on user refresh
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Fetch: cache-first for app shell, network-only for everything else
self.addEventListener('fetch', function (event) {
  var requestUrl = new URL(event.request.url);

  // Only handle same-origin GET requests
  if (event.request.method !== 'GET') return;
  if (requestUrl.origin !== location.origin) return;

  // Check if request matches an app shell asset
  var path = requestUrl.pathname;
  var isAppShell = APP_SHELL.some(function (asset) {
    var assetPath = asset.replace(/^\.\//, '/');
    return path === assetPath || path === assetPath + '/';
  });

  if (isAppShell) {
    // Cache-first for app shell
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        return fetch(event.request).then(function (response) {
          if (response.ok) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
  }
  // Everything else: network-only (speech API, external resources, etc.)
});
