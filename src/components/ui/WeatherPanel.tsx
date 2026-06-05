import type { WeatherNow, WeatherForecast } from '../../hooks/useWeather';

// ── Hava Kodu → İkon + Açıklama ──────────────────────────────
function weatherIcon(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code <= 2)  return isDay ? '⛅' : '🌙';
  if (code <= 3)  return '☁️';
  if (code <= 49) return '🌫️'; // sis
  if (code <= 59) return '🌦️'; // çisenti
  if (code <= 69) return '🌧️'; // yağmur
  if (code <= 79) return '❄️'; // kar
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  if (code <= 99) return '⛈️'; // fırtına
  return '🌡️';
}

// ── Rüzgâr Yön Oku SVG ───────────────────────────────────────
function WindArrow({ deg }: { deg: number }) {
  return (
    <svg
      width="28" height="28" viewBox="0 0 28 28"
      style={{ transform: `rotate(${deg}deg)` }}
      aria-hidden="true"
    >
      <polygon points="14,3 18,22 14,18 10,22" fill="#0ea5e9" opacity="0.9" />
      <polygon points="14,25 10,6 14,10 18,6"  fill="#1e2d45" opacity="0.6" />
      <circle cx="14" cy="14" r="2" fill="#06b6d4" />
    </svg>
  );
}

// ── Saatlik Tahmin Mini Şeridi ────────────────────────────────
function HourlyStrip({ forecast }: { forecast: WeatherForecast }) {
  const now = new Date();

  // Sonraki 12 saati al
  const entries = forecast.hourly.time
    .map((t, i) => ({
      hour: new Date(t).getHours(),
      time: t,
      wind: Math.round(forecast.hourly.windspeed[i] / 1.852 * 10) / 10,
      dir:  forecast.hourly.winddir[i],
      wave: forecast.hourly.waveHeight[i],
    }))
    .filter(e => new Date(e.time) >= now)
    .slice(0, 8);

  if (entries.length === 0) return null;

  return (
    <div className="weather-hourly">
      {entries.map((e, i) => (
        <div key={i} className="weather-hourly__item">
          <span className="weather-hourly__time mono">
            {String(e.hour).padStart(2, '0')}:00
          </span>
          <WindArrow deg={e.dir} />
          <span className="weather-hourly__wind mono">
            {e.wind}<small>kn</small>
          </span>
          {e.wave != null && e.wave > 0 && (
            <span className="weather-hourly__wave">
              🌊{e.wave}m
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Ana WeatherPanel ──────────────────────────────────────────
interface WeatherPanelProps {
  current: WeatherNow | null;
  forecast: WeatherForecast | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  beaufortScale: (kn: number) => string;
}

export function WeatherPanel({
  current,
  forecast,
  isLoading,
  error,
  onClose,
  beaufortScale,
}: WeatherPanelProps) {
  return (
    <div className="weather-panel panel-glass" role="dialog" aria-label="Hava durumu">

      {/* Başlık */}
      <div className="weather-panel__header">
        <span className="weather-panel__title">
          ⛵ Edremit Körfezi
        </span>
        <button
          id="btn-close-weather"
          className="btn btn-icon weather-panel__close"
          onClick={onClose}
          aria-label="Kapat"
          style={{ minWidth: 32, minHeight: 32 }}
        >
          ✕
        </button>
      </div>

      {/* Yükleniyor */}
      {isLoading && (
        <div className="weather-panel__loading">
          <div className="map-loading__spinner" style={{ width: 24, height: 24 }} />
          <span>Hava durumu alınıyor…</span>
        </div>
      )}

      {/* Hata */}
      {error && !isLoading && (
        <div className="weather-panel__error">
          📡 {error}
        </div>
      )}

      {/* Mevcut hava */}
      {current && !isLoading && (
        <>
          <div className="weather-panel__current">
            {/* Sol: Sıcaklık + ikon */}
            <div className="weather-panel__temp-block">
              <span className="weather-panel__icon">
                {weatherIcon(current.weatherCode, current.isDay)}
              </span>
              <div>
                <div className="weather-panel__temp mono">
                  {current.tempC}°C
                </div>
                <div className="weather-panel__feels">
                  Hissedilen {current.feelsLikeC}°C
                </div>
              </div>
            </div>

            {/* Sağ: Rüzgâr */}
            <div className="weather-panel__wind-block">
              <WindArrow deg={current.wind.directionDeg} />
              <div>
                <div className="weather-panel__wind-val mono">
                  {current.wind.speedKnots} <small>kn</small>
                </div>
                <div className="weather-panel__wind-dir">
                  {current.wind.directionLabel} — {beaufortScale(current.wind.speedKnots)}
                </div>
                {current.wind.gusts && (
                  <div className="weather-panel__gusts">
                    Rüzgâr: {Math.round(current.wind.gusts / 1.852 * 10) / 10} kn
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Marine verisi */}
          {current.marine && (
            <div className="weather-panel__marine">
              <div className="weather-panel__marine-item">
                <span>🌊</span>
                <span>Dalga: <strong className="mono">{current.marine.waveHeightM}m</strong></span>
              </div>
              {current.marine.seaTempC != null && (
                <div className="weather-panel__marine-item">
                  <span>🌡️</span>
                  <span>Deniz: <strong className="mono">{current.marine.seaTempC}°C</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Saatlik tahmin */}
          {forecast && <HourlyStrip forecast={forecast} />}

          {/* Son güncelleme */}
          <div className="weather-panel__updated">
            {new Date(current.fetchedAt).toLocaleTimeString('tr-TR', {
              hour: '2-digit', minute: '2-digit',
            })} güncellendi
          </div>
        </>
      )}
    </div>
  );
}
