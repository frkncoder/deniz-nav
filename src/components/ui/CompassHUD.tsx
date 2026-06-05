interface CompassHUDProps {
  heading: number | null;   // 0-360 derece
  speed: number | null;     // m/s (GPS'ten)
}

const DIRECTIONS = ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'];

function headingToDir(deg: number): string {
  return DIRECTIONS[Math.round(deg / 45) % 8];
}

/**
 * CompassHUD — Sağ üstte yuvarlak pusula + hız göstergesi.
 * SVG ile çizilmiş, gerçek zamanlı döner ibre.
 */
export function CompassHUD({ heading, speed }: CompassHUDProps) {
  const speedKnots = speed != null ? (speed * 1.94384) : null;
  const headingDeg = heading ?? 0;
  const dirLabel = heading != null ? headingToDir(heading) : '--';

  return (
    <div className="compass-hud panel-glass" aria-label="Pusula ve hız">

      {/* SVG Pusula Kadranı */}
      <svg
        className="compass-hud__dial"
        viewBox="0 0 80 80"
        width="80"
        height="80"
        aria-hidden="true"
      >
        {/* Dış halka */}
        <circle cx="40" cy="40" r="38" fill="none"
                stroke="rgba(30,45,69,0.8)" strokeWidth="2" />

        {/* Derece tikleri */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i * 10) * Math.PI / 180;
          const isMajor = i % 9 === 0;
          const r1 = isMajor ? 32 : 34;
          const r2 = 37;
          return (
            <line
              key={i}
              x1={40 + r1 * Math.sin(angle)}
              y1={40 - r1 * Math.cos(angle)}
              x2={40 + r2 * Math.sin(angle)}
              y2={40 - r2 * Math.cos(angle)}
              stroke={isMajor ? '#0ea5e9' : '#1e2d45'}
              strokeWidth={isMajor ? 1.5 : 0.8}
            />
          );
        })}

        {/* Ana yön etiketleri — haritaya göre sabit */}
        {[
          { label: 'K', angle: 0 },
          { label: 'D', angle: 90 },
          { label: 'G', angle: 180 },
          { label: 'B', angle: 270 },
        ].map(({ label, angle }) => {
          const a = (angle - headingDeg) * Math.PI / 180;
          const r = 25;
          const isNorth = label === 'K';
          return (
            <text
              key={label}
              x={40 + r * Math.sin(a)}
              y={40 - r * Math.cos(a) + 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill={isNorth ? '#ef4444' : '#94a3b8'}
              fontFamily="Inter, sans-serif"
            >
              {label}
            </text>
          );
        })}

        {/* İbre — her zaman yukarıyı (cihazın baktığı yönü) gösterir */}
        {/* Kuzey ibresı (kırmızı) */}
        <polygon
          points="40,14 43,40 40,36 37,40"
          fill="#ef4444"
          opacity="0.9"
        />
        {/* Güney ibresı (gri) */}
        <polygon
          points="40,66 43,40 40,44 37,40"
          fill="#475569"
          opacity="0.7"
        />

        {/* Merkez daire */}
        <circle cx="40" cy="40" r="4" fill="#0ea5e9" />
        <circle cx="40" cy="40" r="2" fill="#0a0f1a" />
      </svg>

      {/* Derece + Yön etiketi */}
      <div className="compass-hud__info">
        <span className="compass-hud__deg mono">
          {heading != null ? `${Math.round(heading)}°` : '--°'}
        </span>
        <span className="compass-hud__dir">{dirLabel}</span>
      </div>

      {/* Hız göstergesi */}
      {speedKnots != null && (
        <div className="compass-hud__speed">
          <span className="compass-hud__speed-val mono">
            {speedKnots.toFixed(1)}
          </span>
          <span className="compass-hud__speed-unit">kn</span>
        </div>
      )}
    </div>
  );
}
