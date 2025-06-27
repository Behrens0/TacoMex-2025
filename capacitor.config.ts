import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.Tabla.Didactica',
  appName: 'Tabla Didactica',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000, 
      launchAutoHide: true,
    },
    Icon: {
      icon: "./src/assets/logo.png", 
    },
    PushNotifications:{
      presentationOptions: ["badge","sound","alert"],
    },
  },
};

export default config;
