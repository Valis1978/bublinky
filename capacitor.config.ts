import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cz.bublinky.app',
  appName: 'Bublinky',
  webDir: 'public', // Minimal placeholder — app loads from server URL
  server: {
    url: 'https://bublinky.cz',
    cleartext: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound'],
    },
  },
  ios: {
    scheme: 'Bublinky',
    backgroundColor: '#FFF5F7',
    preferredContentMode: 'mobile',
  },
};

export default config;
