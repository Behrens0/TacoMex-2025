import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.Tabla.Didactica',
  appName: 'Tabla Didactica',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000, 
      launchAutoHide: false,
      backgroundColor: '#FF8C00', 
    },
    Icon: {
      icon: "./src/assets/logo.png", 
    },
  },
};

export default config;
