import { useState, useCallback } from 'react';
import { MapView } from './components/map/MapView';
import { StatusBar } from './components/ui/StatusBar';
import { BottomBar } from './components/ui/BottomBar';
import { useGPS } from './hooks/useGPS';
import { useOffline } from './hooks/useOffline';
import { usePWA } from './hooks/usePWA';
import './components/ui/ui.css';
import './App.css';

export default function App() {
  const gps = useGPS();
  const { status: connectionStatus } = useOffline();
  const pwa = usePWA();

  const [isSeamapVisible, setSeamapVisible] = useState(true);

  const handleToggleGPS = useCallback(async () => {
    if (gps.isTracking) {
      gps.stopTracking();
    } else {
      const allowed = await gps.requestPermission();
      if (allowed) gps.startTracking();
    }
  }, [gps]);

  const handleToggleSeamap = useCallback(() => {
    setSeamapVisible(v => !v);
  }, []);

  return (
    <main
      className="app-layout"
      style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0a0f1a' }}
    >
      {/* HUD — Sol üst durum çubuğu */}
      <StatusBar
        connectionStatus={connectionStatus}
        gpsState={{ position: gps.position, error: gps.error, isTracking: gps.isTracking }}
      />

      {/* GPS Hata bildirimi */}
      {gps.error && (
        <div className="gps-error-toast" role="alert" aria-live="assertive">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {gps.error}
        </div>
      )}

      {/* PWA Kurulum Banner'ı */}
      {pwa.isInstallable && (
        <div className="pwa-install-banner" role="banner">
          <div className="pwa-install-banner__content">
            <span>⚓ Ana ekrana ekle — offline çalışsın</span>
            <button
              id="btn-pwa-install"
              className="btn btn-primary pwa-install-banner__btn"
              onClick={pwa.promptInstall}
            >
              Yükle
            </button>
          </div>
        </div>
      )}

      {/* Ana Harita */}
      <MapView
        gpsPosition={gps.position}
        isSeamapVisible={isSeamapVisible}
      />

      {/* Alt Kontrol Çubuğu */}
      <BottomBar
        onToggleGPS={handleToggleGPS}
        onToggleSeamap={handleToggleSeamap}
        isGPSTracking={gps.isTracking}
        isSeamapVisible={isSeamapVisible}
      />
    </main>
  );
}
