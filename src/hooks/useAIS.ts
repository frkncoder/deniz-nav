import { useState, useEffect } from 'react';
import type { AISTarget } from '../types';

// Edremit Körfezi etrafında örnek gemiler
const INITIAL_VESSELS: AISTarget[] = [
  { mmsi: 271041000, name: 'GELIBOLU', type: 'Passenger', lat: 39.54, lng: 26.85, speed: 12.5, course: 45, heading: 45, lastUpdated: Date.now() },
  { mmsi: 271042000, name: 'KAPTAN ALİ', type: 'Cargo', lat: 39.56, lng: 26.90, speed: 8.0, course: 220, heading: 220, lastUpdated: Date.now() },
  { mmsi: 271043000, name: 'BEYZA', type: 'Sailing', lat: 39.52, lng: 26.88, speed: 4.5, course: 320, heading: 320, lastUpdated: Date.now() },
  { mmsi: 271044000, name: 'YAKAMOZ', type: 'Fishing', lat: 39.58, lng: 26.83, speed: 2.1, course: 90, heading: 90, lastUpdated: Date.now() },
  { mmsi: 271045000, name: 'EGE EXPRESS', type: 'Passenger', lat: 39.55, lng: 26.80, speed: 18.2, course: 110, heading: 110, lastUpdated: Date.now() }
];

export function useAIS() {
  const [targets, setTargets] = useState<AISTarget[]>(INITIAL_VESSELS);
  const [isActive, setIsActive] = useState(true); // Varsayılan olarak açık başlasın

  useEffect(() => {
    if (!isActive) return;

    // Her saniye gemileri simüle ederek hareket ettir
    const interval = setInterval(() => {
      setTargets(prev => prev.map(v => {
        // 1 knot = 1 deniz mili / saat
        // 1 saniyedeki mesafe (nm) = speed / 3600
        const distanceNm = v.speed / 3600;
        
        // 1 derece enlem = 60 nm
        const latChange = (distanceNm * Math.cos(v.course * Math.PI / 180)) / 60;
        const lngChange = (distanceNm * Math.sin(v.course * Math.PI / 180)) / (60 * Math.cos(v.lat * Math.PI / 180));
        
        // Hafif bir kavis (rotasyon) ekleyelim ki daha gerçekçi dursun (bazı gemiler için)
        const courseWobble = (Math.random() - 0.5) * 0.5; // -0.25 ile 0.25 arası derece değişimi
        const newCourse = (v.course + courseWobble + 360) % 360;

        return {
          ...v,
          lat: v.lat + latChange,
          lng: v.lng + lngChange,
          course: newCourse,
          heading: newCourse, // Simülasyonda heading ve course aynı kabul edildi
          lastUpdated: Date.now()
        };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  return { targets, isActive, setIsActive };
}
