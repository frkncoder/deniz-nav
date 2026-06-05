import { useMemo } from 'react';
import type { WeatherNow, WeatherForecast } from '../../hooks/useWeather';
import './MeteogramPanel.css';

interface MeteogramPanelProps {
  weather: {
    current: WeatherNow | null;
    forecast: WeatherForecast | null;
  };
  onClose: () => void;
}

function getWeatherIcon(code: number) {
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95 && code <= 99) return '⛈️';
  return '☀️';
}

function getWindColor(knots: number) {
  if (knots < 3) return '#2e649e';
  if (knots < 6) return '#3c9dc2';
  if (knots < 10) return '#80cdc1';
  if (knots < 15) return '#97daa8';
  if (knots < 20) return '#eef7d9';
  if (knots < 25) return '#ffd97d';
  if (knots < 30) return '#fc964b';
  return '#f54020';
}

function getWindTextColor(knots: number) {
  if (knots < 10) return '#fff';
  if (knots < 25) return '#000';
  return '#fff';
}

export function MeteogramPanel({ weather, onClose }: MeteogramPanelProps) {
  if (!weather.forecast) return null;

  const { hourly } = weather.forecast;

  // Sadece her 3 saatte bir olan verileri alalım (Windy standart görünümü)
  const columns = useMemo(() => {
    const cols = [];
    let currentDay = '';
    
    for (let i = 0; i < hourly.time.length; i += 3) {
      const date = new Date(hourly.time[i]);
      const dayStr = date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric' });
      const timeStr = date.getHours().toString().padStart(2, '0');
      
      const windKnot = Math.round(hourly.windspeed[i] / 1.852);
      const gustKnot = Math.round((hourly.windgusts[i] || 0) / 1.852);
      const dir = hourly.winddir[i];
      const temp = Math.round(hourly.temp[i]);
      const rain = hourly.precipitation[i] || 0;
      const wcode = hourly.weatherCode[i];

      const isNewDay = dayStr !== currentDay;
      if (isNewDay) currentDay = dayStr;

      cols.push({
        dayStr: isNewDay ? dayStr : '',
        timeStr,
        windKnot,
        gustKnot,
        dir,
        temp,
        rain,
        wcode
      });
    }
    return cols;
  }, [hourly]);

  return (
    <div className="meteogram-panel glass-panel">
      <div className="meteogram-header">
        <div className="meteogram-title">Meteogram (Saatlik Tahmin)</div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="meteogram-scroll">
        <div className="meteogram-table">
          
          {/* Gün Satırı */}
          <div className="m-row day-row">
            <div className="m-label">Gün</div>
            <div className="m-data">
              {columns.map((c, i) => (
                <div key={i} className={`m-col ${c.dayStr ? 'new-day' : ''}`}>
                  {c.dayStr}
                </div>
              ))}
            </div>
          </div>

          {/* Saat Satırı */}
          <div className="m-row time-row">
            <div className="m-label">Saat</div>
            <div className="m-data">
              {columns.map((c, i) => (
                <div key={i} className="m-col">{c.timeStr}</div>
              ))}
            </div>
          </div>

          {/* Hava ve Sıcaklık */}
          <div className="m-row temp-row">
            <div className="m-label">Sıcaklık °C</div>
            <div className="m-data">
              {columns.map((c, i) => (
                <div key={i} className="m-col">
                  <div className="m-icon">{getWeatherIcon(c.wcode)}</div>
                  <div className="m-temp">{c.temp}°</div>
                </div>
              ))}
            </div>
          </div>

          {/* Yağış */}
          <div className="m-row rain-row">
            <div className="m-label">Yağış mm</div>
            <div className="m-data">
              {columns.map((c, i) => (
                <div key={i} className="m-col rain-col">
                  {c.rain > 0 ? c.rain.toFixed(1) : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Rüzgar */}
          <div className="m-row wind-row">
            <div className="m-label">Rüzgar kt</div>
            <div className="m-data">
              {columns.map((c, i) => (
                <div 
                  key={i} 
                  className="m-col wind-box" 
                  style={{ 
                    backgroundColor: getWindColor(c.windKnot),
                    color: getWindTextColor(c.windKnot)
                  }}
                >
                  {c.windKnot}
                </div>
              ))}
            </div>
          </div>

          {/* Ani Rüzgar (Gusts) */}
          <div className="m-row wind-row">
            <div className="m-label">Ani rüzgar kt</div>
            <div className="m-data">
              {columns.map((c, i) => (
                <div 
                  key={i} 
                  className="m-col wind-box gust-box" 
                  style={{ 
                    backgroundColor: getWindColor(c.gustKnot),
                    color: getWindTextColor(c.gustKnot)
                  }}
                >
                  {c.gustKnot}
                </div>
              ))}
            </div>
          </div>

          {/* Rüzgar Yönü */}
          <div className="m-row dir-row">
            <div className="m-label">Rüzgar yönü</div>
            <div className="m-data">
              {columns.map((c, i) => (
                <div key={i} className="m-col">
                  <div 
                    className="m-arrow"
                    style={{ transform: `rotate(${c.dir + 180}deg)` }}
                  >
                    ↓
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
