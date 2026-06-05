import type { GPSPosition } from '../../types';

interface AnchorPanelProps {
  anchorPosition: GPSPosition | null;
  anchorAlarm: boolean;
  currentPosition: GPSPosition | null;
  onDropAnchor: (radiusM: number) => void;
  onLiftAnchor: () => void;
}

/**
 * AnchorPanel — Demir at / kaldır kontrolü ve alarm göstergesi.
 * Demirleme modunda kalan mesafeyi metre cinsinden gösterir.
 */
export function AnchorPanel({
  anchorPosition,
  anchorAlarm,
  currentPosition,
  onDropAnchor,
  onLiftAnchor,
}: AnchorPanelProps) {
  const isAnchored = anchorPosition !== null;

  if (!isAnchored) {
    return (
      <button
        id="btn-drop-anchor"
        className="btn anchor-btn anchor-btn--drop"
        onClick={() => onDropAnchor(50)}
        disabled={!currentPosition}
        aria-label="Demir at (50m alarm yarıçapı)"
        title="Demir at"
      >
        {/* Çapa ikonu */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="2" />
          <line x1="12" y1="7" x2="12" y2="19" />
          <path d="M6 11H18M6 19C6 19 9 17 12 19C15 21 18 19 18 19" />
        </svg>
        <span>Demir At</span>
      </button>
    );
  }

  return (
    <div className={`anchor-panel panel-glass ${anchorAlarm ? 'anchor-panel--alarm' : ''}`}
         role="status" aria-live="assertive">

      {/* Alarm göstergesi */}
      {anchorAlarm && (
        <div className="anchor-alarm">
          <span className="anchor-alarm__icon">⚠️</span>
          <span className="anchor-alarm__text">DEMİR SÜRÜYOR!</span>
        </div>
      )}

      {/* Demir durumu */}
      <div className="anchor-panel__status">
        <span className="status-dot status-dot--gps animate-pulse-glow" />
        <span className="anchor-panel__label">Demirlendi</span>
      </div>

      {/* Kaldır butonu */}
      <button
        id="btn-lift-anchor"
        className="btn anchor-btn anchor-btn--lift"
        onClick={onLiftAnchor}
        aria-label="Demiri kaldır"
      >
        Kaldır
      </button>
    </div>
  );
}
