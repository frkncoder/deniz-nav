/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { registerRoute } from 'workbox-routing';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

// Vite'ın inject ettiği precache manifestini işle
precacheAndRoute(self.__WB_MANIFEST);

// Eski cache'leri temizle
cleanupOutdatedCaches();

// ── Cache Stratejileri ────────────────────────────────────────

/**
 * Protomaps / PMTiles vektör tile'ları — CacheFirst
 * Tile'lar değişmez, sonsuza kadar cache'de kalabilir.
 */
registerRoute(
  ({ url }) =>
    url.hostname === 'build.protomaps.com' ||
    url.pathname.endsWith('.pmtiles'),
  new CacheFirst({
    cacheName: 'vector-tiles-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200, 206] }), // 206: Range Request
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 yıl
      }),
    ],
  }),
);

/**
 * OpenSeaMap raster tile'ları — CacheFirst (offline desteği için)
 */
registerRoute(
  ({ url }) => url.hostname === 'tiles.openseamap.org',
  new CacheFirst({
    cacheName: 'seamark-tiles-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxEntries: 2000,    // Max tile sayısı
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 gün
      }),
    ],
  }),
);

/**
 * Protomaps font ve sprite dosyaları — CacheFirst
 */
registerRoute(
  ({ url }) => url.hostname === 'protomaps.github.io',
  new CacheFirst({
    cacheName: 'map-assets-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
);

/**
 * Google Fonts — StaleWhileRevalidate
 */
registerRoute(
  ({ url }) =>
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  }),
);

/**
 * Open-Meteo hava durumu API — NetworkFirst (offline fallback)
 * Bağlantı yoksa son cache'i döndür.
 */
registerRoute(
  ({ url }) => url.hostname === 'api.open-meteo.com',
  new NetworkFirst({
    cacheName: 'weather-data-v1',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60, // 1 saat
      }),
    ],
  }),
);

// ── Aktivasyon: Hemen kontrolü al ────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('install', () => {
  self.skipWaiting();
});
