interface BottomBarProps {
  onToggleGPS: () => void;
  onToggleSeamap: () => void;
  onToggleRoute: () => void;
  onToggleWeather: () => void;
  isGPSTracking: boolean;
  isSeamapVisible: boolean;
  isRouteMode: boolean;
  isWeatherOpen: boolean;
}

export function BottomBar({
  onToggleGPS,
  onToggleSeamap,
  onToggleRoute,
  onToggleWeather,
  isGPSTracking,
  isSeamapVisible,
  isRouteMode,
  isWeatherOpen,
}: BottomBarProps) {
  return (
    <div className="bottom-bar" role="toolbar" aria-label="Harita kontrolleri">
      <div className="bottom-bar__inner">

        {/* GPS */}
        <button
          id="btn-toggle-gps"
          className={`btn bottom-bar__btn ${isGPSTracking ? 'bottom-bar__btn--active' : ''}`}
          onClick={onToggleGPS}
          aria-label={isGPSTracking ? 'GPS takibini durdur' : 'GPS takibini başlat'}
          aria-pressed={isGPSTracking}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L12 6M12 18L12 22M2 12L6 12M18 12L22 12" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          <span>{isGPSTracking ? 'GPS Açık' : 'GPS'}</span>
        </button>

        {/* Deniz Kartı */}
        <button
          id="btn-toggle-seamap"
          className={`btn bottom-bar__btn ${isSeamapVisible ? 'bottom-bar__btn--active' : ''}`}
          onClick={onToggleSeamap}
          aria-label={isSeamapVisible ? 'Deniz kartını gizle' : 'Deniz kartını göster'}
          aria-pressed={isSeamapVisible}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="2" />
            <line x1="12" y1="7" x2="12" y2="19" />
            <path d="M6 11H18M6 19C6 19 9 17 12 19C15 21 18 19 18 19" />
          </svg>
          <span>Deniz Kartı</span>
        </button>

        {/* Rota */}
        <button
          id="btn-toggle-route"
          className={`btn bottom-bar__btn ${isRouteMode ? 'bottom-bar__btn--active' : ''}`}
          onClick={onToggleRoute}
          aria-label="Rota modu"
          aria-pressed={isRouteMode}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span>Rota</span>
        </button>

        {/* Hava */}
        <button
          id="btn-toggle-weather"
          className={`btn bottom-bar__btn ${isWeatherOpen ? 'bottom-bar__btn--active' : ''}`}
          onClick={onToggleWeather}
          aria-label="Hava durumu"
          aria-pressed={isWeatherOpen}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          </svg>
          <span>Hava</span>
        </button>

      </div>
    </div>
  );
}
