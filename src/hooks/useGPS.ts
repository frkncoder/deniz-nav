import { useState, useEffect, useCallback, useRef } from 'react';
import type { GPSState, GPSPosition } from '../types';

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 2000,
};

/**
 * useGPS — Tarayıcı Geolocation API'sini React hook olarak sarar.
 * Offline-first: GPS donanımına doğrudan erişir, internet gerektirmez.
 */
export function useGPS(options: PositionOptions = DEFAULT_OPTIONS): GPSState & {
  startTracking: () => void;
  stopTracking: () => void;
  requestPermission: () => Promise<boolean>;
} {
  const [state, setState] = useState<GPSState>({
    position: null,
    error: null,
    isTracking: false,
  });

  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    const gpsPos: GPSPosition = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude ?? undefined,
      heading: pos.coords.heading ?? undefined,
      speed: pos.coords.speed ?? undefined,
      timestamp: pos.timestamp,
    };

    setState(prev => ({ ...prev, position: gpsPos, error: null }));
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    const messages: Record<number, string> = {
      1: 'GPS iznine gerekiyor. Lütfen konum erişimine izin verin.',
      2: 'Konum alınamadı. GPS sinyali zayıf olabilir.',
      3: 'Konum isteği zaman aşımına uğradı.',
    };

    setState(prev => ({
      ...prev,
      error: messages[err.code] ?? 'Bilinmeyen GPS hatası.',
      isTracking: false,
    }));
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Bu cihaz GPS desteklemiyor.',
      }));
      return;
    }

    if (watchIdRef.current !== null) return; // Zaten takip ediliyor

    setState(prev => ({ ...prev, isTracking: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options,
    );
  }, [handleSuccess, handleError, options]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState(prev => ({ ...prev, isTracking: false }));
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.permissions) return true; // API yoksa devam et

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state !== 'denied';
    } catch {
      return true;
    }
  }, []);

  // Bileşen unmount olduğunda watch'ı temizle
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { ...state, startTracking, stopTracking, requestPermission };
}
