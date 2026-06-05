import { useState, useCallback, useRef } from 'react';
import { db } from '../lib/db';

// ── Tipler ───────────────────────────────────────────────────

export interface WindData {
  speedKmh: number;
  speedKnots: number;
  directionDeg: number;
  directionLabel: string;
  gusts?: number; // km/h
}

export interface MarineData {
  waveHeightM: number;
  wavePeriodS?: number;
  seaTempC?: number;
}

export interface WeatherNow {
  tempC: number;
  feelsLikeC: number;
  wind: WindData;
  marine?: MarineData;
  weatherCode: number;
  isDay: boolean;
  fetchedAt: number;
}

export interface WeatherForecast {
  hourly: {
    time: string[];
    windspeed: number[];      // km/h
    winddir: number[];        // derece
    windgusts: number[];      // km/h
    temp: number[];           // °C
    precipitation: number[];  // mm
    weatherCode: number[];    // WMO kod
  };
}

interface WeatherState {
  current: WeatherNow | null;
  forecast: WeatherForecast | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

// ── Yardımcı ─────────────────────────────────────────────────

const DIR_LABELS = ['K','KKD','KD','DKD','D','DGD','GD','GGD','G','GGB','GB','BGB','B','KBB','KB','KKB'];

function degToLabel(deg: number): string {
  return DIR_LABELS[Math.round(deg / 22.5) % 16];
}

function beaufortScale(knots: number): string {
  if (knots < 1)  return 'Sakin';
  if (knots < 4)  return 'Hafif';
  if (knots < 7)  return 'Hafif esinti';
  if (knots < 11) return 'Hafif rüzgâr';
  if (knots < 17) return 'Ilıman';
  if (knots < 22) return 'Kuvvetli';
  if (knots < 28) return 'Sert';
  if (knots < 34) return 'Çok sert';
  return '⚠️ Fırtına';
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 saat

/**
 * useWeather — Open-Meteo ücretsiz API ile hava + marine verisi.
 * Otomatik IndexedDB cache, offline desteği.
 */
export function useWeather() {
  const [state, setState] = useState<WeatherState>({
    current: null,
    forecast: null,
    isLoading: false,
    error: null,
    lastFetch: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(async (lat: number, lng: number) => {
    // Cache kontrolü
    const now = Date.now();
    try {
      const cached = await db.weatherCache
        .where('expiresAt').above(now)
        .first();
      if (cached && Math.abs(cached.lat - lat) < 0.1 && Math.abs(cached.lng - lng) < 0.1) {
        const d = cached.data;
        // Cache'den doldur
        setState(prev => ({
          ...prev,
          current: parseCurrentWeather(d),
          lastFetch: cached.fetchedAt,
          error: null,
        }));
        return;
      }
    } catch {
      // Cache okuma başarısız, devam et
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      // Open-Meteo: anlık + saatlik + marine kombinasyonu
      const params = new URLSearchParams({
        latitude: lat.toFixed(4),
        longitude: lng.toFixed(4),
        current: [
          'temperature_2m',
          'apparent_temperature',
          'weather_code',
          'wind_speed_10m',
          'wind_direction_10m',
          'wind_gusts_10m',
          'is_day',
        ].join(','),
        hourly: [
          'temperature_2m',
          'precipitation',
          'weather_code',
          'wind_speed_10m',
          'wind_direction_10m',
          'wind_gusts_10m',
        ].join(','),
        forecast_days: '5',
        wind_speed_unit: 'kmh',
        timezone: 'Europe/Istanbul',
      });

      const res = await globalThis.fetch(
        `https://api.open-meteo.com/v1/forecast?${params}`,
        { signal: abortRef.current.signal },
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const current = parseCurrentWeather(data);
      const forecast = parseForecast(data);

      // IndexedDB'ye kaydet
      await db.weatherCache.add({
        lat,
        lng,
        fetchedAt: now,
        expiresAt: now + CACHE_TTL_MS,
        data,
      });

      setState({
        current,
        forecast,
        isLoading: false,
        error: null,
        lastFetch: now,
      });

    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Hava durumu alınamadı',
      }));
    }
  }, []);

  return { ...state, fetch, beaufortScale, degToLabel };
}

// ── Parse Yardımcıları ────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCurrentWeather(data: any): WeatherNow {
  const c = data.current ?? data.current_weather ?? {};
  const speedKmh = c.wind_speed_10m ?? c.windspeed ?? 0;
  const speedKnots = speedKmh / 1.852;
  const directionDeg = c.wind_direction_10m ?? c.winddirection ?? 0;

  // Marine verisi (saatlik'in ilk değerinden)
  const h = data.hourly ?? {};
  const waveHeight = h.wave_height?.[0] ?? null;
  const seaTemp    = h.sea_surface_temperature?.[0] ?? null;

  return {
    tempC: Math.round(c.temperature_2m ?? c.temperature ?? 0),
    feelsLikeC: Math.round(c.apparent_temperature ?? c.temperature_2m ?? 0),
    weatherCode: c.weather_code ?? c.weathercode ?? 0,
    isDay: Boolean(c.is_day ?? 1),
    wind: {
      speedKmh: Math.round(speedKmh),
      speedKnots: Math.round(speedKnots * 10) / 10,
      directionDeg,
      directionLabel: degToLabel(directionDeg),
      gusts: c.wind_gusts_10m ? Math.round(c.wind_gusts_10m) : undefined,
    },
    marine: waveHeight != null ? {
      waveHeightM: Math.round(waveHeight * 10) / 10,
      seaTempC: seaTemp ? Math.round(seaTemp) : undefined,
    } : undefined,
    fetchedAt: Date.now(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseForecast(data: any): WeatherForecast {
  const h = data.hourly ?? {};
  return {
    hourly: {
      time:       h.time ?? [],
      windspeed:  h.wind_speed_10m ?? [],
      winddir:    h.wind_direction_10m ?? [],
      windgusts:  h.wind_gusts_10m ?? [],
      temp:       h.temperature_2m ?? [],
      precipitation: h.precipitation ?? [],
      weatherCode: h.weather_code ?? [],
    },
  };
}
