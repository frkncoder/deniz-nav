// ============================================================
// DENİZ-NAV — Merkezi TypeScript Tipleri
// ============================================================

/** Coğrafi koordinat */
export interface LatLng {
  lat: number;
  lng: number;
}

/** GPS konumu (hassas, heading ve hız dahil) */
export interface GPSPosition {
  lat: number;
  lng: number;
  accuracy: number;        // metre
  altitude?: number;       // metre
  heading?: number;        // derece (0-360, kuzey=0)
  speed?: number;          // m/s
  timestamp: number;       // unix ms
}

/** GPS hook durumu */
export interface GPSState {
  position: GPSPosition | null;
  error: string | null;
  isTracking: boolean;
}

/** Waypoint / demirleme noktası */
export interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'waypoint' | 'anchor' | 'poi' | 'custom';
  notes?: string;
  createdAt: number;
  updatedAt: number;
  synced: boolean;
}

/** Navigasyon rotası */
export interface Route {
  id: string;
  name: string;
  waypoints: Waypoint[];
  color?: string;
  totalDistance?: number;  // deniz mili
  createdAt: number;
  updatedAt: number;
  synced: boolean;
}

/** Harita katman görünürlük durumu */
export interface MapLayers {
  seamark: boolean;        // OpenSeaMap overlay
  depth: boolean;          // Derinlik konturları
  wind: boolean;           // Rüzgâr animasyonu
  wave: boolean;           // Dalga overlay
  ais: boolean;            // AIS gemileri (Faz 5)
}

/** Harita görünüm durumu */
export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

/** Online/offline durumu */
export type ConnectionStatus = 'online' | 'offline';

/** Denizcilik hesaplama sonucu */
export interface BearingDistance {
  bearing: number;         // derece (0-360)
  distance: number;        // deniz mili
}
