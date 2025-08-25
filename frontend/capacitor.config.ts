import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fuyou.app',
  appName: '扶養管理',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#64B5F6',
      showSpinner: false
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#64B5F6'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  },
  ios: {
    scheme: 'FuyouApp'
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  }
};

export default config;
