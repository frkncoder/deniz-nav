interface BottomBarProps {
  onToggleGPS: () => void;
  onToggleSeamap: () => void;
  isGPSTracking: boolean;
  isSeamapVisible: boolean;
}

/**
 * BottomBar — Tek elle kullanım için alt kısımda sabit kontrol çubuğu.
 * GPS başlat/durdur ve katman toggle butonları içerir.
 */
export function BottomBar({
  onToggleGPS,
  onToggleSeamap,
  isGPSTracking,
  isSeamapVisible,
}: BottomBarProps) {
  return (
    <div className="bottom-bar" role="toolbar" aria-label="Harita kontrolleri">
      <div className="bottom-bar__inner">

        {/* GPS Butonu */}
        <button
          id="btn-toggle-gps"
          className={`btn bottom-bar__btn ${isGPSTracking ? 'bottom-bar__btn--active' : ''}`}
          onClick={onToggleGPS}
          aria-label={isGPSTracking ? 'GPS takibini durdur' : 'GPS takibini başlat'}
          aria-pressed={isGPSTracking}
        >
          {/* GPS / Konum ikonu */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L12 6M12 18L12 22M2 12L6 12M18 12L22 12" />
            <circle cx="12" cy="12" r="4" />
            {isGPSTracking && <circle cx="12" cy="12" r="8" strokeOpacity="0.3" />}
          </svg>
          <span>{isGPSTracking ? 'GPS Açık' : 'GPS'}</span>
        </button>

        {/* Deniz Kartı Butonu */}
        <button
          id="btn-toggle-seamap"
          className={`btn bottom-bar__btn ${isSeamapVisible ? 'bottom-bar__btn--active' : ''}`}
          onClick={onToggleSeamap}
          aria-label={isSeamapVisible ? 'Deniz kartını gizle' : 'Deniz kartını göster'}
          aria-pressed={isSeamapVisible}
        >
          {/* Çapa ikonu */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="2" />
            <line x1="12" y1="7" x2="12" y2="19" />
            <path d="M6 11H18M6 19C6 19 9 17 12 19C15 21 18 19 18 19" />
          </svg>
          <span>Deniz Kartı</span>
        </button>

        {/* Rota Butonu (Faz 3'te aktif olacak) */}
        <button
          id="btn-route"
          className="btn bottom-bar__btn bottom-bar__btn--disabled"
          aria-label="Rota oluştur (yakında)"
          disabled
        >
          {/* Rota ikonu */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span>Rota</span>
        </button>

        {/* Hava Durumu Butonu (Faz 4'te aktif olacak) */}
        <button
          id="btn-weather"
          className="btn bottom-bar__btn bottom-bar__btn--disabled"
          aria-label="Hava durumu (yakında)"
          disabled
        >
          {/* Rüzgâr ikonu */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
            <path d="M12.59 19.41A2 2 0 1 0 14 16H2" />
            <path d="M16 12a2 2 0 0 1 0 4H2" />
          </svg>
          <span>Hava</span>
        </button>

      </div>
    </div>
  );
}
