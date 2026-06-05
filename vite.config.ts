import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // SW'yi src/ içinde yaz, Vite build'e dahil olsun
      srcDir: 'src',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      injectManifest: {
        // MapLibre ve PMTiles büyük JS chunk'larını önbelleğe al
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      },
      manifest: {
        name: 'DenizNav — Deniz Navigasyonu',
        short_name: 'DenizNav',
        description: 'Edremit Körfezi için offline deniz navigasyon uygulaması',
        theme_color: '#0a0f1a',
        background_color: '#0a0f1a',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'tr',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      devOptions: {
        // Dev modunda SW kapalı — localhost'ta MIME type hatalarına yol açar
        enabled: false,
        type: 'module',
      },
    }),
  ],
  build: {
    // Chunk uyarı sınırını artır (MapLibre büyük)
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // MapLibre/PMTiles/Dexie'yi ayrı chunk'a al
        manualChunks(id: string) {
          if (id.includes('maplibre-gl')) return 'maplibre';
          if (id.includes('pmtiles'))    return 'pmtiles';
          if (id.includes('dexie'))      return 'dexie';
        },
      },
    },
  },
});
