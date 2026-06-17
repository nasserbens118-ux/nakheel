import { useEffect, useState } from 'react';

// Détecte si on tourne dans Capacitor (APK) ou dans le navigateur web
export const isCapacitor = (): boolean =>
  typeof window !== 'undefined' && !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();

// ── Network natif ──────────────────────────────────────────────────────────────
// Remplace navigator.onLine par le plugin Capacitor Network sur mobile
export function useNativeNetwork() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      if (isCapacitor()) {
        const { Network } = await import('@capacitor/network');
        const status = await Network.getStatus();
        setIsOnline(status.connected);
        const handle = await Network.addListener('networkStatusChange', s => setIsOnline(s.connected));
        cleanup = () => handle.remove();
      } else {
        // Fallback web
        const onOnline  = () => setIsOnline(true);
        const onOffline = () => setIsOnline(false);
        window.addEventListener('online',  onOnline);
        window.addEventListener('offline', onOffline);
        setIsOnline(navigator.onLine);
        cleanup = () => {
          window.removeEventListener('online',  onOnline);
          window.removeEventListener('offline', onOffline);
        };
      }
    })();

    return () => cleanup?.();
  }, []);

  return isOnline;
}

// ── Bouton retour Android ──────────────────────────────────────────────────────
// Empêche la fermeture accidentelle de l'app quand on est sur la page d'accueil
export function useAndroidBackButton(onBack: () => boolean) {
  useEffect(() => {
    if (!isCapacitor()) return;
    let cleanup: (() => void) | undefined;

    (async () => {
      const { App } = await import('@capacitor/app');
      const handle = await App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack || !onBack()) {
          App.exitApp();
        }
      });
      cleanup = () => handle.remove();
    })();

    return () => cleanup?.();
  }, [onBack]);
}

// ── Splash Screen ──────────────────────────────────────────────────────────────
export async function hideSplashScreen() {
  if (!isCapacitor()) return;
  const { SplashScreen } = await import('@capacitor/splash-screen');
  await SplashScreen.hide();
}

// ── Status Bar ─────────────────────────────────────────────────────────────────
export async function setStatusBar() {
  if (!isCapacitor()) return;
  const { StatusBar, Style } = await import('@capacitor/status-bar');
  await StatusBar.setStyle({ style: Style.Dark });
  await StatusBar.setBackgroundColor({ color: '#2E5A44' });
}
