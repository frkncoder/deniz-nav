import { useRef, useEffect, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { GPSPosition, MapViewState } from '../../types';
// @ts-ignore
import MaplibreWindGL from 'maplibre-wind-gl';
import { generateWindHeatmap } from '../../utils/windHeatmap';
import './MapView.css';

// ── Harita Stil Kaynağları ───────────────────────────────────

const STADIA_STYLE_URL = 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=2eacff3d-bd34-4a38-a41a-f55f0927ce7a';

/**
 * Minimal offline fallback stil — sadece renk, tile gerektirmez.
 * Internet yokken ve cache henüz dolmamışken görünür.
 */
const OFFLINE_FALLBACK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#0c2340' } },
  ],
};

// ── Coğrafi Sabitler ─────────────────────────────────────────
/** Edremit Körfezi merkezi */
const EDREMIT_CENTER: [number, number] = [26.87, 39.55];
const EDREMIT_ZOOM = 11;

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

function removeSeamarkOverlay(map: maplibregl.Map) {
  if (map.getLayer(SEAMARK_LAYER_ID)) map.removeLayer(SEAMARK_LAYER_ID);
  if (map.getSource(SEAMARK_SOURCE_ID)) map.removeSource(SEAMARK_SOURCE_ID);
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

// ── Navigasyon Katmanları ─────────────────────────────────────
const NAV_WAYPOINTS_SOURCE = 'nav-waypoints';
const NAV_ANCHOR_SOURCE = 'nav-anchor';
const NAV_ROUTE_SOURCE = 'nav-route';

function addNavigationLayers(map: maplibregl.Map) {
  // Waypoints Source
  if (!map.getSource(NAV_WAYPOINTS_SOURCE)) {
    map.addSource(NAV_WAYPOINTS_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
    
    // Waypoints Layer (Daire ve Metin)
    map.addLayer({
      id: 'nav-waypoints-layer',
      type: 'circle',
      source: NAV_WAYPOINTS_SOURCE,
      paint: {
        'circle-radius': 6,
        'circle-color': '#f59e0b',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-pitch-alignment': 'viewport'
      }
    });
    
    map.addLayer({
      id: 'nav-waypoints-text',
      type: 'symbol',
      source: NAV_WAYPOINTS_SOURCE,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-offset': [0, 1.2],
        'text-anchor': 'top',
        'text-pitch-alignment': 'viewport'
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1.5
      }
    });
  }

  // Anchor Source
  if (!map.getSource(NAV_ANCHOR_SOURCE)) {
    map.addSource(NAV_ANCHOR_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
    
    // Anchor Merkez Noktası
    map.addLayer({
      id: 'nav-anchor-center',
      type: 'circle',
      source: NAV_ANCHOR_SOURCE,
      paint: {
        'circle-radius': 8,
        'circle-color': '#ef4444',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-pitch-alignment': 'viewport'
      }
    });
    
    // Anchor Yarıçapı (örnek olarak sabit bir alan çizebiliriz veya gerçek metreyi yansıtabiliriz, şimdilik görsel)
    map.addLayer({
      id: 'nav-anchor-radius',
      type: 'circle',
      source: NAV_ANCHOR_SOURCE,
      paint: {
        'circle-radius': 40,
        'circle-color': 'rgba(239, 68, 68, 0.15)',
        'circle-stroke-color': '#ef4444',
        'circle-stroke-width': 1,
        'circle-pitch-alignment': 'map'
      }
    });
  }

  // Route Source (Aktif Rota ve Çizim Aşamasındaki Rota)
  if (!map.getSource(NAV_ROUTE_SOURCE)) {
    map.addSource(NAV_ROUTE_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
    
    map.addLayer({
      id: 'nav-route-line',
      type: 'line',
      source: NAV_ROUTE_SOURCE,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': ['coalesce', ['get', 'color'], '#0ea5e9'],
        'line-width': 4,
        'line-dasharray': ['case', ['boolean', ['get', 'isDraft'], false], ['literal', [2, 2]], ['literal', [1]]]
      }
    });
    
    // Rota üzerindeki noktalar
    map.addLayer({
      id: 'nav-route-points',
      type: 'circle',
      source: NAV_ROUTE_SOURCE,
      paint: {
        'circle-radius': 4,
        'circle-color': '#ffffff',
        'circle-stroke-color': ['coalesce', ['get', 'color'], '#0ea5e9'],
        'circle-stroke-width': 2,
        'circle-pitch-alignment': 'viewport'
      }
    });
  }
}

function updateNavigationData(
  map: maplibregl.Map, 
  waypoints: import('../../types').Waypoint[], 
  anchorPos: GPSPosition | null, 
  activeRoute: import('../../types').Route | null,
  draftRoutePoints: import('../../types').LatLng[]
) {
  // Waypoints
  const wpSource = map.getSource(NAV_WAYPOINTS_SOURCE) as maplibregl.GeoJSONSource | undefined;
  if (wpSource) {
    wpSource.setData({
      type: 'FeatureCollection',
      features: waypoints.map(wp => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [wp.lng, wp.lat] },
        properties: { name: wp.name, type: wp.type }
      }))
    });
  }

  // Anchor
  const anchorSource = map.getSource(NAV_ANCHOR_SOURCE) as maplibregl.GeoJSONSource | undefined;
  if (anchorSource) {
    anchorSource.setData({
      type: 'FeatureCollection',
      features: anchorPos ? [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [anchorPos.lng, anchorPos.lat] },
        properties: {}
      }] : []
    });
  }

  // Routes
  const routeSource = map.getSource(NAV_ROUTE_SOURCE) as maplibregl.GeoJSONSource | undefined;
  if (routeSource) {
    const routeFeatures: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[] = [];
    
    // Aktif Rota (Kayıtlı)
    if (activeRoute && activeRoute.waypoints.length > 0) {
      const coords = activeRoute.waypoints.map(wp => [wp.lng, wp.lat]);
      routeFeatures.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: { color: activeRoute.color || '#0ea5e9', isDraft: false }
      });
      // Rota Noktaları
      activeRoute.waypoints.forEach(wp => {
        routeFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [wp.lng, wp.lat] },
          properties: { color: activeRoute.color || '#0ea5e9' }
        });
      });
    }

    // Taslak Rota (Çizim aşamasında)
    if (draftRoutePoints && draftRoutePoints.length > 0) {
      const draftCoords = draftRoutePoints.map(pt => [pt.lng, pt.lat]);
      if (draftCoords.length > 1) {
        routeFeatures.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: draftCoords },
          properties: { color: '#f59e0b', isDraft: true }
        });
      }
      draftRoutePoints.forEach(pt => {
        routeFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [pt.lng, pt.lat] },
          properties: { color: '#f59e0b' }
        });
      });
    }

    routeSource.setData({
      type: 'FeatureCollection',
      features: routeFeatures
    });
  }
}

// ── AIS Katmanları ──────────────────────────────────────────
const NAV_AIS_SOURCE = 'nav-ais';

function addAISLayers(map: maplibregl.Map) {
  if (!map.getSource(NAV_AIS_SOURCE)) {
    map.addSource(NAV_AIS_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    // Basit bir gemi ikonu yükle (Eğer yoksa)
    if (!map.hasImage('vessel-icon')) {
      const vesselSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path d="M12 2L20 20L12 17L4 20L12 2Z" fill="#10b981" stroke="#ffffff" stroke-width="1.5" />
      </svg>`;
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(vesselSvg);
      img.onload = () => {
        if (!map.hasImage('vessel-icon')) {
          map.addImage('vessel-icon', img);
        }
      };
    }

    map.addLayer({
      id: 'nav-ais-layer',
      type: 'symbol',
      source: NAV_AIS_SOURCE,
      layout: {
        'icon-image': 'vessel-icon',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-rotate': ['get', 'heading'],
        'icon-rotation-alignment': 'map',
        'icon-pitch-alignment': 'map',
        'icon-size': 1.2,
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 11,
        'text-offset': [0, 1.5],
        'text-anchor': 'top',
        'text-pitch-alignment': 'viewport'
      },
      paint: {
        'text-color': '#10b981',
        'text-halo-color': '#000000',
        'text-halo-width': 1.5
      }
    });

    // İmleç efekti
    map.on('mouseenter', 'nav-ais-layer', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'nav-ais-layer', () => {
      map.getCanvas().style.cursor = '';
    });
  }
}

function updateAISData(map: maplibregl.Map, targets: import('../../types').AISTarget[]) {
  const source = map.getSource(NAV_AIS_SOURCE) as maplibregl.GeoJSONSource | undefined;
  if (source) {
    source.setData({
      type: 'FeatureCollection',
      features: targets.map(t => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [t.lng, t.lat] },
        properties: { 
          id: t.mmsi,
          name: t.name,
          heading: t.heading,
          speed: t.speed,
          course: t.course,
          type: t.type
        }
      }))
    });
  }
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

// ── Bileşen Props ───────────────────────────────────────────
interface MapViewProps {
  gpsPosition: GPSPosition | null;
  isSeamapVisible?: boolean;
  isRouteMode?: boolean;
  waypoints?: import('../../types').Waypoint[];
  anchorPosition?: GPSPosition | null;
  activeRoute?: import('../../types').Route | null;
  draftRoutePoints?: import('../../types').LatLng[];
  aisTargets?: import('../../types').AISTarget[];
  isWindVisible?: boolean;
  onViewStateChange?: (vs: MapViewState) => void;
  onMapClick?: (lat: number, lng: number) => void;
  onVesselClick?: (target: import('../../types').AISTarget) => void;
}

// ── Ana Bileşen ───────────────────────────────────────────
export function MapView({
  gpsPosition,
  isSeamapVisible = true,
  isRouteMode: _isRouteMode = false,
  waypoints: _waypoints = [],
  anchorPosition: _anchorPosition = null,
  activeRoute: _activeRoute = null,
  draftRoutePoints: _draftRoutePoints = [],
  aisTargets: _aisTargets = [],
  isWindVisible = false,
  onViewStateChange,
  onMapClick,
  onVesselClick,
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

    const styleUrl = navigator.onLine ? STADIA_STYLE_URL : OFFLINE_FALLBACK_STYLE;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: EDREMIT_CENTER,
      zoom: EDREMIT_ZOOM,
      minZoom: 6,
      maxZoom: 18,
      // @ts-ignore
      projection: { type: 'globe' } as any, // Küresel dünya projeksiyonu (WebGL rüzgar için ideal)
      attributionControl: { compact: true },
      pitchWithRotate: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true, showZoom: false }),
      'top-right',
    );

    map.on('load', () => {
      addGPSLayers(map);
      addNavigationLayers(map);
      addAISLayers(map);
      if (isSeamapVisible) addSeamarkOverlay(map);
      setIsLoaded(true);
    });

    map.on('click', 'nav-ais-layer', (e) => {
      if (onVesselClick && e.features && e.features.length > 0) {
        const p = e.features[0].properties;
        onVesselClick({
          mmsi: p.id,
          name: p.name,
          heading: p.heading,
          speed: p.speed,
          course: p.course,
          type: p.type,
          lat: (e.features[0].geometry as any).coordinates[1],
          lng: (e.features[0].geometry as any).coordinates[0],
          lastUpdated: Date.now()
        });
      }
    });

    map.on('click', (e) => {
      // Eğer ais layer'a tıklandıysa haritaya tıklanmasını es geç (propagation)
      const features = map.queryRenderedFeatures(e.point, { layers: ['nav-ais-layer'] });
      if (features.length > 0) return;

      if (onMapClick) {
        onMapClick(e.lngLat.lat, e.lngLat.lng);
      }
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

  // Navigasyon verisi güncellemesi
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    updateNavigationData(map, _waypoints, _anchorPosition, _activeRoute, _draftRoutePoints);
  }, [_waypoints, _anchorPosition, _activeRoute, _draftRoutePoints, isLoaded]);

  // AIS verisi güncellemesi
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    updateAISData(map, _aisTargets);
  }, [_aisTargets, isLoaded]);

  // OpenSeaMap katmanı toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    if (isSeamapVisible) addSeamarkOverlay(map);
    else removeSeamarkOverlay(map);
  }, [isSeamapVisible, isLoaded]);

  // WebGL Rüzgâr Katmanı (WindLayer)
  const windLayerRef = useRef<any>(null);
  
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    if (isWindVisible) {
      if (!windLayerRef.current) {
        // Önce Heatmap'i oluştur ve ekle
        fetch('/wind.json')
          .then(res => res.json())
          .then(async data => {
            const heatmapUrl = await generateWindHeatmap(data);
            
            if (!map.getSource('wind-heatmap-source')) {
              map.addSource('wind-heatmap-source', {
                type: 'image',
                url: heatmapUrl,
                coordinates: [
                  [-180, 85.051129],
                  [180, 85.051129],
                  [180, -85.051129],
                  [-180, -85.051129]
                ]
              });
              
              map.addLayer({
                id: 'wind-heatmap-layer',
                type: 'raster',
                source: 'wind-heatmap-source',
                paint: {
                  'raster-opacity': 0.8,
                  'raster-fade-duration': 0
                }
              }, 'gps-dot-outer'); // GPS noktasının altına ekle (Eğer varsa)
            }

            // Yeni maplibre-wind-gl katmanı (Partiküller)
            const wind = new MaplibreWindGL('wind-layer', {
              data: '/wind.json', // veya direkt data objesi
              particles: 150000, 
              speed: 2.5, 
              opacity: 0.9, 
              maxAge: 30, 
              color: [1.0, 1.0, 1.0] // Windy gibi beyaz/gri akan çizgiler
            });
            
            if (!map.getLayer('wind-layer')) {
              map.addLayer(wind);
            }
            windLayerRef.current = wind;
          });
      } else {
        if (map.getLayer('wind-heatmap-layer')) {
          map.setLayoutProperty('wind-heatmap-layer', 'visibility', 'visible');
        }
        if (map.getLayer('wind-layer')) {
          map.setLayoutProperty('wind-layer', 'visibility', 'visible');
        }
      }
    } else {
      if (map.getLayer('wind-heatmap-layer')) {
        map.setLayoutProperty('wind-heatmap-layer', 'visibility', 'none');
      }
      if (windLayerRef.current && map.getLayer('wind-layer')) {
        map.setLayoutProperty('wind-layer', 'visibility', 'none');
      }
    }
  }, [isWindVisible, isLoaded]);

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
    <div
      className="map-wrapper"
      style={{ position: 'relative', width: '100%', height: '100%', flex: 1, minHeight: 0 }}
    >
      <div
        ref={mapContainerRef}
        className="map-container"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

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
