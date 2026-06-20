import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dz.nakheel.app',
  appName: 'GourFeed',
  webDir: 'out', // Next.js static export output
  server: {
    // En développement : pointer vers le serveur Next.js local
    // Commenter ces lignes pour le build APK de production
    // url: 'http://192.168.1.x:3000',
    // cleartext: true,
  },

  android: {
    allowMixedContent: true,
    backgroundColor: '#15803D',
    webContentsDebuggingEnabled: false, // true en dev
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#15803D',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#15803D',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
