import { useCallback, useRef, useState } from 'react';
import { db, createWaypoint, createRoute } from '../lib/db';
import type { Waypoint, Route } from '../types';
import type { GPSPosition } from '../types';

/**
 * useNavigation — Waypoint ve rota yönetimi.
 * IndexedDB (Dexie) ile kalıcı depolama.
 */
export function useNavigation() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [anchorPosition, setAnchorPosition] = useState<GPSPosition | null>(null);
  const [anchorAlarm, setAnchorAlarm] = useState(false);
  const anchorRadiusRef = useRef<number>(50); // metre

  // ── Waypoint İşlemleri ──────────────────────────────────────

  const addWaypoint = useCallback(async (
    pos: GPSPosition,
    name: string,
    type: Waypoint['type'] = 'poi',
  ): Promise<Waypoint> => {
    const wp = createWaypoint({
      lat: pos.lat,
      lng: pos.lng,
      name,
      type,
      notes: '',
    });
    await db.waypoints.add(wp);
    setWaypoints(prev => [...prev, wp]);
    return wp;
  }, []);

  const removeWaypoint = useCallback(async (id: string) => {
    await db.waypoints.delete(id);
    setWaypoints(prev => prev.filter(wp => wp.id !== id));
  }, []);

  const loadWaypoints = useCallback(async () => {
    const all = await db.waypoints.toArray();
    setWaypoints(all);
  }, []);

  // ── Rota İşlemleri ─────────────────────────────────────────

  const createNewRoute = useCallback(async (
    name: string,
    routeWaypoints: Waypoint[],
  ): Promise<Route> => {
    const route = createRoute({ name, waypoints: routeWaypoints, color: '#0ea5e9' });
    await db.routes.add(route);
    setActiveRoute(route);
    return route;
  }, []);

  const clearActiveRoute = useCallback(() => {
    setActiveRoute(null);
  }, []);

  // ── Demirleme (Anchor Watch) ────────────────────────────────

  const dropAnchor = useCallback((pos: GPSPosition, radiusM = 50) => {
    setAnchorPosition(pos);
    anchorRadiusRef.current = radiusM;
    setAnchorAlarm(false);
  }, []);

  const liftAnchor = useCallback(() => {
    setAnchorPosition(null);
    setAnchorAlarm(false);
  }, []);

  /**
   * Mevcut GPS konumunu demir noktasıyla karşılaştır.
   * Radius aşılırsa alarm tetiklenir.
   */
  const checkAnchorWatch = useCallback((currentPos: GPSPosition) => {
    if (!anchorPosition) return;

    const dist = haversineDistance(
      anchorPosition.lat, anchorPosition.lng,
      currentPos.lat, currentPos.lng,
    );

    if (dist > anchorRadiusRef.current) {
      setAnchorAlarm(true);
      // Titreşim (destekleniyorsa)
      if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
    } else {
      setAnchorAlarm(false);
    }
  }, [anchorPosition]);

  return {
    waypoints,
    activeRoute,
    anchorPosition,
    anchorAlarm,
    anchorRadius: anchorRadiusRef.current,
    addWaypoint,
    removeWaypoint,
    loadWaypoints,
    createNewRoute,
    clearActiveRoute,
    dropAnchor,
    liftAnchor,
    checkAnchorWatch,
  };
}

// ── Yardımcı: Haversine Mesafe Hesabı ──────────────────────────
/** İki GPS koordinatı arasındaki mesafeyi metre cinsinden hesaplar */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000; // Dünya yarıçapı metre
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
