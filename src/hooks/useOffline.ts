import { useState, useEffect } from 'react';
import type { ConnectionStatus } from '../types';

/**
 * useOffline — Online/offline bağlantı durumunu izler.
 * Service Worker ile entegre çalışır, UI'da durum gösterimi için kullanılır.
 */
export function useOffline(): {
  status: ConnectionStatus;
  isOnline: boolean;
  isOffline: boolean;
} {
  const [status, setStatus] = useState<ConnectionStatus>(
    navigator.onLine ? 'online' : 'offline',
  );

  useEffect(() => {
    const handleOnline  = () => setStatus('online');
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    status,
    isOnline:  status === 'online',
    isOffline: status === 'offline',
  };
}
