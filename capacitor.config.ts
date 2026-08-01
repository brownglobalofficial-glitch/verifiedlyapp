import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.verifiedly.app",
  appName: "Verifiedly",
  webDir: "dist",
  ios: { contentInset: "automatic" },
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: { launchShowDuration: 800, launchAutoHide: false, backgroundColor: "#111111", showSpinner: false },
    StatusBar: { style: "LIGHT", backgroundColor: "#111111" },
    Keyboard: { resize: "body", resizeOnFullScreen: true },
  },
};

export default config;
