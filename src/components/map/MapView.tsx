import { useRef, useEffect, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { GPSPosition, MapViewState } from '../../types';
import './MapView.css';

// ── Sabitler ─────────────────────────────────────────────────
/** Edremit Körfezi merkezi */
const EDREMIT_CENTER: [number, number] = [26.87, 39.55];
const EDREMIT_ZOOM = 11;

// ── Protomaps Deniz Temalı Dark Stil ─────────────────────────
// Tip güvenliği için maplibregl.StyleSpecification uyumlu nesne
const DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
  sprite: 'https://protomaps.github.io/basemaps-assets/sprites/v4/dark',
  sources: {
    protomaps: {
      type: 'vector',
      url: 'pmtiles://https://build.protomaps.com/20250601.pmtiles',
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    },
  },
  layers: [
    // Okyanuslar / Deniz
    {
      id: 'water',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'water',
      paint: { 'fill-color': '#0c2340' },
    },
    // Kara
    {
      id: 'earth',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'earth',
      paint: { 'fill-color': '#162032' },
    },
    // Yollar (küçük)
    {
      id: 'roads_minor',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      paint: {
        'line-color': '#1e2d45',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 16, 2],
      },
    } as maplibregl.LineLayerSpecification,
    // Yollar (ana)
    {
      id: 'roads_major',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      paint: {
        'line-color': '#243654',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1, 16, 4],
      },
    } as maplibregl.LineLayerSpecification,
    // Binalar
    {
      id: 'buildings',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'buildings',
      minzoom: 14,
      paint: { 'fill-color': '#1a2c42', 'fill-opacity': 0.8 },
    },
    // Yer adları
    {
      id: 'place_labels',
      type: 'symbol',
      source: 'protomaps',
      'source-layer': 'places',
      layout: {
        'text-field': ['coalesce', ['get', 'name:tr'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 11, 14, 15],
        'text-anchor': 'center',
        'text-max-width': 8,
      },
      paint: {
        'text-color': '#94a3b8',
        'text-halo-color': '#0a0f1a',
        'text-halo-width': 2,
      },
    } as maplibregl.SymbolLayerSpecification,
    // Deniz adları
    {
      id: 'water_labels',
      type: 'symbol',
      source: 'protomaps',
      'source-layer': 'water',
      layout: {
        'text-field': ['coalesce', ['get', 'name:tr'], ['get', 'name']],
        'text-font': ['Noto Sans Italic'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 10, 14, 14],
      },
      paint: {
        'text-color': '#1e5a8a',
        'text-halo-color': '#0c2340',
        'text-halo-width': 1.5,
      },
    } as maplibregl.SymbolLayerSpecification,
  ],
};

// ── OpenSeaMap Raster Overlay ─────────────────────────────────
const SEAMARK_SOURCE_ID = 'openseamap';
const SEAMARK_LAYER_ID  = 'openseamap-layer';

function addSeamarkOverlay(map: maplibregl.Map) {
  if (map.getSource(SEAMARK_SOURCE_ID)) return;

  map.addSource(SEAMARK_SOURCE_ID, {
    type: 'raster',
    tiles: ['https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: '© <a href="https://www.openseamap.org">OpenSeaMap</a>',
    minzoom: 8,
    maxzoom: 18,
  });

  map.addLayer({
    id: SEAMARK_LAYER_ID,
    type: 'raster',
    source: SEAMARK_SOURCE_ID,
    paint: { 'raster-opacity': 0.9 },
  });
}

// ── GPS Nokta Katmanı ─────────────────────────────────────────
const GPS_SOURCE_ID    = 'gps-position';
const GPS_DOT_OUTER    = 'gps-dot-outer';
const GPS_DOT_INNER    = 'gps-dot-inner';

function addGPSLayers(map: maplibregl.Map) {
  if (map.getSource(GPS_SOURCE_ID)) return;

  map.addSource(GPS_SOURCE_ID, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  // Dış halka (halo efekti)
  map.addLayer({
    id: GPS_DOT_OUTER,
    type: 'circle',
    source: GPS_SOURCE_ID,
    paint: {
      'circle-radius': 14,
      'circle-color': 'rgba(6,182,212,0.2)',
      'circle-stroke-color': 'rgba(6,182,212,0.5)',
      'circle-stroke-width': 1.5,
      'circle-pitch-alignment': 'viewport',
    },
  } as maplibregl.CircleLayerSpecification);

  // İç nokta
  map.addLayer({
    id: GPS_DOT_INNER,
    type: 'circle',
    source: GPS_SOURCE_ID,
    paint: {
      'circle-radius': 6,
      'circle-color': '#06b6d4',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-pitch-alignment': 'viewport',
    },
  } as maplibregl.CircleLayerSpecification);
}

function updateGPSPosition(map: maplibregl.Map, pos: GPSPosition) {
  const source = map.getSource(GPS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  if (!source) return;

  source.setData({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [pos.lng, pos.lat] },
      properties: { accuracy: pos.accuracy, heading: pos.heading ?? 0 },
    }],
  });
}

// ── Bileşen Props ─────────────────────────────────────────────
interface MapViewProps {
  gpsPosition: GPSPosition | null;
  isSeamapVisible?: boolean;
  onViewStateChange?: (vs: MapViewState) => void;
}

// ── Ana Bileşen ───────────────────────────────────────────────
export function MapView({
  gpsPosition,
  isSeamapVisible = true,
  onViewStateChange,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [followGPS, setFollowGPS] = useState(false);

  // PMTiles protokolünü kaydet (bir kez)
  useEffect(() => {
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);
    return () => {
      maplibregl.removeProtocol('pmtiles');
    };
  }, []);

  // Harita başlatma
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: DARK_STYLE,
      center: EDREMIT_CENTER,
      zoom: EDREMIT_ZOOM,
      minZoom: 6,
      maxZoom: 18,
      attributionControl: { compact: true },
      pitchWithRotate: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true, showZoom: false }),
      'top-right',
    );

    map.on('load', () => {
      addGPSLayers(map);
      if (isSeamapVisible) addSeamarkOverlay(map);
      setIsLoaded(true);
    });

    map.on('move', () => {
      const center = map.getCenter();
      onViewStateChange?.({
        longitude: center.lng,
        latitude: center.lat,
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
    });

    // Kullanıcı sürüklerse GPS takibini bırak
    map.on('dragstart', () => setFollowGPS(false));

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // GPS konumu güncellemesi
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded || !gpsPosition) return;

    updateGPSPosition(map, gpsPosition);

    if (followGPS) {
      map.easeTo({
        center: [gpsPosition.lng, gpsPosition.lat],
        duration: 500,
      });
    }
  }, [gpsPosition, isLoaded, followGPS]);

  // OpenSeaMap katmanı toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    if (isSeamapVisible) {
      if (!map.getSource(SEAMARK_SOURCE_ID)) addSeamarkOverlay(map);
      map.setLayoutProperty(SEAMARK_LAYER_ID, 'visibility', 'visible');
    } else if (map.getLayer(SEAMARK_LAYER_ID)) {
      map.setLayoutProperty(SEAMARK_LAYER_ID, 'visibility', 'none');
    }
  }, [isSeamapVisible, isLoaded]);

  // GPS'e git
  const centerOnGPS = useCallback(() => {
    if (!gpsPosition || !mapRef.current) return;
    setFollowGPS(true);
    mapRef.current.flyTo({
      center: [gpsPosition.lng, gpsPosition.lat],
      zoom: Math.max(mapRef.current.getZoom(), 14),
      duration: 800,
      essential: true,
    });
  }, [gpsPosition]);

  return (
    <div className="map-wrapper">
      <div ref={mapContainerRef} className="map-container" />

      {!isLoaded && (
        <div className="map-loading" aria-label="Harita yükleniyor">
          <div className="map-loading__spinner" />
          <span>Harita yükleniyor…</span>
        </div>
      )}

      {isLoaded && (
        <button
          id="btn-center-gps"
          className={[
            'btn btn-icon map-btn-gps',
            followGPS ? 'map-btn-gps--active' : '',
            !gpsPosition ? 'map-btn-gps--searching' : '',
          ].join(' ')}
          onClick={centerOnGPS}
          aria-label="Konumuma git"
          title="Konumuma git"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </button>
      )}
    </div>
  );
}
