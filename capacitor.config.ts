import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.vms.app",
  appName: "VMS",
  webDir: "dist",

  // ── Server config ──────────────────────────────────────────────────────────
  // In development: point to your local dev server so hot-reload works
  // In production: remove the `server` block entirely (uses bundled dist/)
  server: {
    // Uncomment for live-reload during development:
    // url: "http://192.168.1.X:5173",
    // cleartext: true,
    androidScheme: "https",
    iosScheme: "https",
    hostname: "vms.app",
    allowNavigation: [
      "*.yandex.ru",
      "*.yandex.net",
      "api-maps.yandex.ru",
    ],
  },

  // ── Plugin configuration ───────────────────────────────────────────────────
  plugins: {
    // Splash screen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0f172a",       // dark background matches app
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },

    // Status bar
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0f172a",
      overlaysWebView: false,
    },

    // Keyboard
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true,
    },

    // Push notifications
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },

    // Local notifications
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#3b82f6",
      sound: "beep.wav",
    },

    // Geolocation
    Geolocation: {
      // iOS: always ask for "when in use" first
    },

    // Camera
    Camera: {
      // Used for proof-of-delivery photo capture
    },
  },

  // ── Android specific ───────────────────────────────────────────────────────
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,   // set true during dev
    loggingBehavior: "none",
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },

  // ── iOS specific ───────────────────────────────────────────────────────────
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
    preferredContentMode: "mobile",
    allowsLinkPreview: false,
  },
};

export default config;
