import type { ConnectionStatus } from '../../types';
import type { GPSState } from '../../types';

interface StatusBarProps {
  connectionStatus: ConnectionStatus;
  gpsState: GPSState;
}

/**
 * StatusBar — Harita üzerinde sol üstte küçük durum göstergesi.
 * Online/offline ve GPS durumunu gösterir.
 */
export function StatusBar({ connectionStatus, gpsState }: StatusBarProps) {
  const isOnline = connectionStatus === 'online';
  const hasGPS = gpsState.position !== null;
  const isTracking = gpsState.isTracking;

  const speedKnots = gpsState.position?.speed != null
    ? (gpsState.position.speed * 1.94384).toFixed(1)
    : null;

  return (
    <div className="status-bar panel-glass" role="status" aria-live="polite">
      {/* Bağlantı durumu */}
      <div className="status-bar__item" title={isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}>
        <span className={`status-dot status-dot--${isOnline ? 'online' : 'offline'}`} />
        <span className="status-bar__label">
          {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
        </span>
      </div>

      <div className="status-bar__divider" />

      {/* GPS durumu */}
      <div className="status-bar__item" title="GPS Durumu">
        <span className={`status-dot ${hasGPS ? 'status-dot--gps animate-pulse-glow' : ''}`}
              style={!hasGPS ? { background: 'var(--clr-text-faint)' } : undefined} />
        <span className="status-bar__label">
          {!isTracking
            ? 'GPS Kapalı'
            : hasGPS
              ? `±${Math.round(gpsState.position!.accuracy)}m`
              : 'GPS Aranıyor…'}
        </span>
      </div>

      {/* Hız (GPS varsa) */}
      {speedKnots !== null && (
        <>
          <div className="status-bar__divider" />
          <div className="status-bar__item">
            <span className="status-bar__value mono">{speedKnots}</span>
            <span className="status-bar__unit">kn</span>
          </div>
        </>
      )}
    </div>
  );
}
