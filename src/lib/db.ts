import Dexie, { type Table } from 'dexie';
import type { Waypoint, Route } from '../types';

// ── Ek IndexedDB Tipleri ──────────────────────────────────────

/** Hava durumu verisi cache kaydı */
export interface WeatherCache {
  id?: number;
  lat: number;
  lng: number;
  fetchedAt: number;       // unix ms
  expiresAt: number;       // unix ms
  data: WeatherData;
}

/** Open-Meteo API yanıtı (basitleştirilmiş) */
export interface WeatherData {
  hourly: {
    time: string[];
    windspeed_10m: number[];
    winddirection_10m: number[];
    wave_height?: number[];
    sea_surface_temperature?: number[];
  };
  current?: {
    windspeed_10m: number;
    winddirection_10m: number;
    temperature_2m: number;
  };
}

/** Uygulama ayarları */
export interface AppSetting {
  key: string;
  value: string | number | boolean;
}

/** Tile cache kaydı (PMTiles dışı küçük tile'lar için) */
export interface TileCache {
  key: string;             // "{z}/{x}/{y}"
  source: string;          // "seamark" | "base"
  data: ArrayBuffer;
  cachedAt: number;
  expiresAt: number;
}

// ── Dexie Veritabanı Sınıfı ──────────────────────────────────

export class DenizNavDB extends Dexie {
  waypoints!: Table<Waypoint, string>;
  routes!: Table<Route, string>;
  weatherCache!: Table<WeatherCache, number>;
  settings!: Table<AppSetting, string>;
  tileCache!: Table<TileCache, string>;

  constructor() {
    super('DenizNavDB');

    this.version(1).stores({
      // Waypoint: id primary, lat/lng/type/synced indexlendi
      waypoints:    'id, lat, lng, type, synced, updatedAt',
      // Route: id primary, synced indexlendi
      routes:       'id, synced, updatedAt',
      // Hava durumu: auto-increment primary, konum indexi
      weatherCache: '++id, lat, lng, expiresAt',
      // Ayarlar: key primary
      settings:     'key',
      // Tile cache: "{source}/{z}/{x}/{y}" primary
      tileCache:    'key, source, expiresAt',
    });
  }
}

// Singleton instance
export const db = new DenizNavDB();

// ── Storage Persistence ───────────────────────────────────────

/**
 * Tarayıcının storage eviction yapmasını engelle.
 * Kullanıcı izni istenir, denizde veri kaybı riski ortadan kalkar.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) {
    console.warn('[DB] navigator.storage.persist() desteklenmiyor');
    return false;
  }

  const isPersisted = await navigator.storage.persisted();
  if (isPersisted) return true;

  const granted = await navigator.storage.persist();
  if (granted) {
    console.info('[DB] ✅ Kalıcı depolama izni alındı — veri silinmeyecek');
  } else {
    console.warn('[DB] ⚠️ Kalıcı depolama izni reddedildi');
  }
  return granted;
}

/**
 * Mevcut depolama kullanımını MB olarak döndür.
 */
export async function getStorageUsage(): Promise<{ used: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return {
    used: Math.round(usage / 1024 / 1024),    // MB
    quota: Math.round(quota / 1024 / 1024),   // MB
  };
}

// ── Yardımcı Fonksiyonlar ─────────────────────────────────────

/** Yeni Waypoint oluştur */
export function createWaypoint(
  partial: Omit<Waypoint, 'id' | 'createdAt' | 'updatedAt' | 'synced'>,
): Waypoint {
  const now = Date.now();
  return {
    ...partial,
    id: `wp_${now}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now,
    synced: false,
  };
}

/** Yeni Route oluştur */
export function createRoute(
  partial: Omit<Route, 'id' | 'createdAt' | 'updatedAt' | 'synced'>,
): Route {
  const now = Date.now();
  return {
    ...partial,
    id: `rt_${now}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now,
    synced: false,
  };
}

/** Süresi dolmuş weather cache kayıtlarını temizle */
export async function cleanExpiredWeatherCache(): Promise<void> {
  const now = Date.now();
  await db.weatherCache.where('expiresAt').below(now).delete();
}

/** Süresi dolmuş tile cache kayıtlarını temizle */
export async function cleanExpiredTileCache(): Promise<void> {
  const now = Date.now();
  await db.tileCache.where('expiresAt').below(now).delete();
}
