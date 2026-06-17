import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dz.nakheel.app',
  appName: 'Nakheel',
  webDir: 'out', // Next.js static export output
  server: {
    // En développement : pointer vers le serveur Next.js local
    // Commenter ces lignes pour le build APK de production
    // url: 'http://192.168.1.x:3000',
    // cleartext: true,
  },

  android: {
    allowMixedContent: true,
    backgroundColor: '#2E5A44',
    webContentsDebuggingEnabled: false, // true en dev
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#2E5A44',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#2E5A44',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
