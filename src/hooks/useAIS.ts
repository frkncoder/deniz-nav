import { useState, useEffect, useRef } from 'react';
import type { AISTarget } from '../types';

const API_KEY = import.meta.env.VITE_AISSTREAM_API_KEY;

// Tüm Türkiye'yi (Ege, Akdeniz, Karadeniz) kapsayan bounding box:
// [[[Güney-Batı Enlem, Güney-Batı Boylam], [Kuzey-Doğu Enlem, Kuzey-Doğu Boylam]]]
const BOUNDING_BOX = [[[35.8, 25.6], [42.2, 44.8]]];

function parseShipType(typeCode?: number): AISTarget['type'] {
  if (!typeCode) return 'Unknown';
  if (typeCode >= 60 && typeCode <= 69) return 'Passenger';
  if (typeCode >= 70 && typeCode <= 79) return 'Cargo';
  if (typeCode === 30) return 'Fishing';
  if (typeCode === 36) return 'Sailing';
  if (typeCode === 37) return 'Pleasure';
  return 'Unknown';
}

export function useAIS() {
  // Gemileri MMSI numarasına göre saklamak için Record kullanıyoruz.
  const [targets, setTargets] = useState<Record<number, AISTarget>>({});
  const [isActive, setIsActive] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isActive || !API_KEY) return;

    const connectWebSocket = () => {
      const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("AIS WebSocket bağlandı!");
        const subscriptionMessage = {
          APIKey: API_KEY,
          BoundingBoxes: BOUNDING_BOX,
          FilterMessageTypes: ["PositionReport"]
        };
        ws.send(JSON.stringify(subscriptionMessage));
      };

      ws.onmessage = (event) => {
        try {
          const aisMessage = JSON.parse(event.data);
          
          if (aisMessage.MessageType === "PositionReport") {
            const report = aisMessage.Message.PositionReport;
            const meta = aisMessage.MetaData || {};
            
            const mmsi = report.UserID || meta.MMSI;
            if (!mmsi) return;

            setTargets(prev => {
              const existingName = prev[mmsi]?.name;
              const newName = meta.ShipName ? meta.ShipName.trim() : null;
              const finalName = (newName && newName !== '') ? newName : (existingName || 'Bilinmiyor');

              return {
                ...prev,
                [mmsi]: {
                  mmsi: mmsi,
                  name: finalName,
                  type: parseShipType(meta.ShipType),
                  lat: report.Latitude,
                  lng: report.Longitude,
                  speed: report.Sog || 0,
                  course: report.Cog || 0,
                  // 511 heading verisi yok demektir, bu durumda rotayı (COG) baş (Heading) olarak varsayıyoruz.
                  heading: report.TrueHeading === 511 ? (report.Cog || 0) : report.TrueHeading,
                  lastUpdated: Date.now()
                }
              };
            });
          }
        } catch (err) {
          console.error("AIS Parse Hatası:", err);
        }
      };

      ws.onclose = () => {
        console.log("AIS WebSocket kapandı. Yeniden bağlanılıyor...");
        setTimeout(() => {
          if (wsRef.current) connectWebSocket();
        }, 5000);
      };
    };

    connectWebSocket();

    // Çöp temizleme: 10 dakikadan uzun süredir sinyal alınamayan gemileri sil
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setTargets(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(key => {
          const mmsi = Number(key);
          if (now - next[mmsi].lastUpdated > 10 * 60 * 1000) {
            delete next[mmsi];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 60000);

    return () => {
      clearInterval(cleanupInterval);
      if (wsRef.current) {
        wsRef.current.onclose = null; // manuel kapatıldığında tekrar bağlanmasını engelle
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isActive]);

  return { 
    targets: Object.values(targets), 
    isActive, 
    setIsActive 
  };
}
