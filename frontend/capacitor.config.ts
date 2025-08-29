import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fuyou.management',
  appName: '扶養カレンダー',
  webDir: 'dist',
  bundledWebRuntime: false,
  backgroundColor: '#1976d2',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'https://*.vercel.app',
      'https://*.supabase.co'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1976d2',
      showSpinner: true,
      spinnerColor: '#ffffff',
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#1976d2'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    App: {
      appUrlScheme: 'fuyou'
    }
  },
  ios: {
    scheme: 'FuyouApp'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      minSdkVersion: 22,
      compileSdkVersion: 34,
      targetSdkVersion: 34,
      releaseType: 'AAB'
    },
    flavor: 'main'
  }
};

export default config;
