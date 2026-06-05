import { useEffect, useState, useRef } from 'react';

interface CompassState {
  heading: number | null;       // derece (0-360, 0=Kuzey)
  accuracy: number | null;      // derece cinsinden hassasiyet
  isSupported: boolean;
  error: string | null;
}

/**
 * useCompass — Cihaz pusulasını okur.
 * iOS: DeviceOrientationEvent.webkitCompassHeading
 * Android: DeviceOrientationEvent.alpha (360 - alpha)
 */
export function useCompass() {
  const [state, setState] = useState<CompassState>({
    heading: null,
    accuracy: null,
    isSupported: typeof DeviceOrientationEvent !== 'undefined',
    error: null,
  });

  const permissionAsked = useRef(false);

  useEffect(() => {
    if (!state.isSupported) return;

    function handleOrientation(e: DeviceOrientationEvent) {
      // iOS: webkitCompassHeading doğrudan manyetik kuzey açısı verir
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ios = (e as any).webkitCompassHeading as number | undefined;
      if (ios != null) {
        setState(prev => ({
          ...prev,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          heading: ios,
          accuracy: (e as any).webkitCompassAccuracy ?? null,
          error: null,
        }));
        return;
      }

      // Android: alpha = cihazın Z-ekseni etrafındaki dönüşü
      // absolute=true ise manyetik kuzeyden ölçülür
      if (e.alpha != null) {
        const heading = e.absolute ? (360 - e.alpha) % 360 : (360 - e.alpha) % 360;
        setState(prev => ({ ...prev, heading, error: null }));
      }
    }

    async function startListening() {
      // iOS 13+ izin gerektiriyor
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const DOE = DeviceOrientationEvent as any;
      if (typeof DOE.requestPermission === 'function' && !permissionAsked.current) {
        permissionAsked.current = true;
        try {
          const permission = await DOE.requestPermission();
          if (permission !== 'granted') {
            setState(prev => ({ ...prev, error: 'Pusula izni reddedildi' }));
            return;
          }
        } catch {
          setState(prev => ({ ...prev, error: 'Pusula izni alınamadı' }));
          return;
        }
      }

      window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.addEventListener('deviceorientation', handleOrientation as EventListener, true);
    }

    startListening();

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
    };
  }, [state.isSupported]);

  return state;
}
