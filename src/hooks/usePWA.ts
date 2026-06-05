import { useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';
import { requestPersistentStorage, getStorageUsage } from '../lib/db';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  storageUsedMB: number;
  storageQuotaMB: number;
  isPersisted: boolean;
}

/**
 * usePWA — Service Worker kaydı, storage persistence,
 * ve PWA kurulum durumunu yönetir.
 */
export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    storageUsedMB: 0,
    storageQuotaMB: 0,
    isPersisted: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Service Worker kayıt
    if ('serviceWorker' in navigator) {
      const wb = new Workbox('/sw.js');

      wb.addEventListener('activated', () => {
        console.info('[PWA] Service Worker aktif ✅');
      });

      wb.register().catch(err => {
        console.error('[PWA] SW kayıt hatası:', err);
      });
    }

    // Storage persistence iste
    requestPersistentStorage().then(isPersisted => {
      setState(prev => ({ ...prev, isPersisted }));
    });

    // Depolama kullanımını ölç
    getStorageUsage().then(usage => {
      if (usage) {
        setState(prev => ({
          ...prev,
          storageUsedMB: usage.used,
          storageQuotaMB: usage.quota,
        }));
      }
    });

    // PWA install prompt yakala
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    // Kurulum tamamlandı
    const handleAppInstalled = () => {
      setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /** Kullanıcıya PWA kurulum diyaloğunu göster */
  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === 'accepted';
  };

  return { ...state, promptInstall };
}
