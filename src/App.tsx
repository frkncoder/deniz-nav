import { useState, useCallback, useEffect } from 'react';
import { MapView } from './components/map/MapView';
import { StatusBar } from './components/ui/StatusBar';
import { BottomBar } from './components/ui/BottomBar';
import { CompassHUD } from './components/ui/CompassHUD';
import { AnchorPanel } from './components/ui/AnchorPanel';
import { WeatherPanel } from './components/ui/WeatherPanel';
import { useGPS } from './hooks/useGPS';
import { useOffline } from './hooks/useOffline';
import { usePWA } from './hooks/usePWA';
import { useCompass } from './hooks/useCompass';
import { useNavigation } from './hooks/useNavigation';
import { useWeather } from './hooks/useWeather';
import './components/ui/ui.css';
import './App.css';

// Edremit Körfezi — GPS yokken varsayılan konum
const EDREMIT_LAT = 39.55;
const EDREMIT_LNG = 26.87;

export default function App() {
  const gps           = useGPS();
  const { status: connectionStatus } = useOffline();
  const pwa           = usePWA();
  const compass       = useCompass();
  const nav           = useNavigation();
  const weather       = useWeather();

  const [isSeamapVisible, setSeamapVisible] = useState(true);
  const [isRouteMode,     setRouteMode]     = useState(false);
  const [isWeatherOpen,   setWeatherOpen]   = useState(false);

  // Waypoint'leri başlangıçta yükle
  useEffect(() => {
    nav.loadWaypoints();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Anchor watch — GPS güncellenince kontrol et
  useEffect(() => {
    if (gps.position && nav.anchorPosition) {
      nav.checkAnchorWatch(gps.position);
    }
  }, [gps.position]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hava durumu — panel açılınca veya 1 saatte bir güncelle
  useEffect(() => {
    if (!isWeatherOpen) return;
    const lat = gps.position?.lat ?? EDREMIT_LAT;
    const lng = gps.position?.lng ?? EDREMIT_LNG;
    weather.fetch(lat, lng);
  }, [isWeatherOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handler'lar ───────────────────────────────────────────────

  const handleToggleGPS = useCallback(async () => {
    if (gps.isTracking) {
      gps.stopTracking();
    } else {
      const allowed = await gps.requestPermission();
      if (allowed) gps.startTracking();
    }
  }, [gps]);

  const handleDropAnchor = useCallback((radiusM: number) => {
    if (gps.position) nav.dropAnchor(gps.position, radiusM);
  }, [gps.position, nav.dropAnchor]); // eslint-disable-line react-hooks/exhaustive-deps

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

      {/* Pusula + Hız — Sağ üst */}
      <CompassHUD
        heading={compass.heading}
        speed={gps.position?.speed ?? null}
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

      {/* Anchor Watch alarmı */}
      {nav.anchorAlarm && (
        <div className="gps-error-toast" role="alert" aria-live="assertive"
             style={{ borderColor: 'rgba(239,68,68,0.6)', background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
          ⚓ DEMİR SÜRÜYOR! Konumunuzu kontrol edin.
        </div>
      )}

      {/* PWA Kurulum Banner */}
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
        isRouteMode={isRouteMode}
        waypoints={nav.waypoints}
        anchorPosition={nav.anchorPosition}
      />

      {/* Demir Paneli */}
      <AnchorPanel
        anchorPosition={nav.anchorPosition}
        anchorAlarm={nav.anchorAlarm}
        currentPosition={gps.position}
        onDropAnchor={handleDropAnchor}
        onLiftAnchor={nav.liftAnchor}
      />

      {/* Hava Durumu Paneli */}
      {isWeatherOpen && (
        <WeatherPanel
          current={weather.current}
          forecast={weather.forecast}
          isLoading={weather.isLoading}
          error={weather.error}
          onClose={() => setWeatherOpen(false)}
          beaufortScale={weather.beaufortScale}
        />
      )}

      {/* Alt Kontrol Çubuğu */}
      <BottomBar
        onToggleGPS={handleToggleGPS}
        onToggleSeamap={() => setSeamapVisible(v => !v)}
        onToggleRoute={() => setRouteMode(v => !v)}
        onToggleWeather={() => setWeatherOpen(v => !v)}
        isGPSTracking={gps.isTracking}
        isSeamapVisible={isSeamapVisible}
        isRouteMode={isRouteMode}
        isWeatherOpen={isWeatherOpen}
      />
    </main>
  );
}
