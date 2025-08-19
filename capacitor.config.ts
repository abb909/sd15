import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aromaherbes.secteurs',
  appName: 'Gestion des Secteurs Aroma',
  webDir: 'dist/spa',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
