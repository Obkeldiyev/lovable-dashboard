/**
 * native.ts — Capacitor native bridge
 *
 * All native plugin calls go through this file.
 * Falls back gracefully when running in a browser (no Capacitor).
 */

import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // "android" | "ios" | "web"

// ── Lazy imports (only loaded when actually native) ────────────────────────

async function getApp() {
  const { App } = await import("@capacitor/app");
  return App;
}
async function getHaptics() {
  const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
  return { Haptics, ImpactStyle, NotificationType };
}
async function getStatusBar() {
  const { StatusBar, Style } = await import("@capacitor/status-bar");
  return { StatusBar, Style };
}
async function getKeyboard() {
  const { Keyboard } = await import("@capacitor/keyboard");
  return Keyboard;
}
async function getNetwork() {
  const { Network } = await import("@capacitor/network");
  return Network;
}
async function getPreferences() {
  const { Preferences } = await import("@capacitor/preferences");
  return Preferences;
}
async function getCamera() {
  const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
  return { Camera, CameraResultType, CameraSource };
}
async function getShare() {
  const { Share } = await import("@capacitor/share");
  return Share;
}
async function getLocalNotifications() {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return LocalNotifications;
}
async function getPushNotifications() {
  const { PushNotifications } = await import("@capacitor/push-notifications");
  return PushNotifications;
}

// ── Haptic feedback ────────────────────────────────────────────────────────

export async function hapticLight() {
  if (!isNative) return;
  try {
    const { Haptics, ImpactStyle } = await getHaptics();
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* ignore */ }
}

export async function hapticMedium() {
  if (!isNative) return;
  try {
    const { Haptics, ImpactStyle } = await getHaptics();
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch { /* ignore */ }
}

export async function hapticSuccess() {
  if (!isNative) return;
  try {
    const { Haptics, NotificationType } = await getHaptics();
    await Haptics.notification({ type: NotificationType.Success });
  } catch { /* ignore */ }
}

export async function hapticError() {
  if (!isNative) return;
  try {
    const { Haptics, NotificationType } = await getHaptics();
    await Haptics.notification({ type: NotificationType.Error });
  } catch { /* ignore */ }
}

// ── Status bar ─────────────────────────────────────────────────────────────

export async function setStatusBarDark() {
  if (!isNative) return;
  try {
    const { StatusBar, Style } = await getStatusBar();
    await StatusBar.setStyle({ style: Style.Dark });
    if (platform === "android") {
      await StatusBar.setBackgroundColor({ color: "#0f172a" });
    }
  } catch { /* ignore */ }
}

export async function setStatusBarLight() {
  if (!isNative) return;
  try {
    const { StatusBar, Style } = await getStatusBar();
    await StatusBar.setStyle({ style: Style.Light });
    if (platform === "android") {
      await StatusBar.setBackgroundColor({ color: "#f8fafc" });
    }
  } catch { /* ignore */ }
}

// ── Network ────────────────────────────────────────────────────────────────

export async function getNetworkStatus() {
  if (!isNative) return { connected: navigator.onLine, connectionType: "unknown" };
  try {
    const Network = await getNetwork();
    return Network.getStatus();
  } catch {
    return { connected: navigator.onLine, connectionType: "unknown" };
  }
}

export async function addNetworkListener(cb: (connected: boolean) => void) {
  if (!isNative) {
    window.addEventListener("online",  () => cb(true));
    window.addEventListener("offline", () => cb(false));
    return () => {
      window.removeEventListener("online",  () => cb(true));
      window.removeEventListener("offline", () => cb(false));
    };
  }
  try {
    const Network = await getNetwork();
    const handle = await Network.addListener("networkStatusChange", (s) => cb(s.connected));
    return () => handle.remove();
  } catch {
    return () => {};
  }
}

// ── Preferences (native key-value store) ──────────────────────────────────

export async function nativeGet(key: string): Promise<string | null> {
  if (!isNative) return localStorage.getItem(key);
  try {
    const Preferences = await getPreferences();
    const { value } = await Preferences.get({ key });
    return value;
  } catch {
    return localStorage.getItem(key);
  }
}

export async function nativeSet(key: string, value: string): Promise<void> {
  if (!isNative) { localStorage.setItem(key, value); return; }
  try {
    const Preferences = await getPreferences();
    await Preferences.set({ key, value });
  } catch {
    localStorage.setItem(key, value);
  }
}

export async function nativeRemove(key: string): Promise<void> {
  if (!isNative) { localStorage.removeItem(key); return; }
  try {
    const Preferences = await getPreferences();
    await Preferences.remove({ key });
  } catch {
    localStorage.removeItem(key);
  }
}

// ── Camera (proof of delivery) ─────────────────────────────────────────────

export async function takePhoto(): Promise<string | null> {
  if (!isNative) return null;
  try {
    const { Camera, CameraResultType, CameraSource } = await getCamera();
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    return photo.dataUrl ?? null;
  } catch {
    return null;
  }
}

export async function pickPhoto(): Promise<string | null> {
  if (!isNative) return null;
  try {
    const { Camera, CameraResultType, CameraSource } = await getCamera();
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    });
    return photo.dataUrl ?? null;
  } catch {
    return null;
  }
}

// ── Share ──────────────────────────────────────────────────────────────────

export async function nativeShare(title: string, text: string, url?: string) {
  if (!isNative) {
    if (navigator.share) {
      await navigator.share({ title, text, url });
    }
    return;
  }
  try {
    const Share = await getShare();
    await Share.share({ title, text, url, dialogTitle: title });
  } catch { /* user cancelled */ }
}

// ── Local notifications ────────────────────────────────────────────────────

export async function scheduleLocalNotification(opts: {
  id: number;
  title: string;
  body: string;
  scheduleAt?: Date;
}) {
  if (!isNative) return;
  try {
    const LN = await getLocalNotifications();
    const perm = await LN.requestPermissions();
    if (perm.display !== "granted") return;
    await LN.schedule({
      notifications: [{
        id: opts.id,
        title: opts.title,
        body: opts.body,
        schedule: opts.scheduleAt ? { at: opts.scheduleAt } : undefined,
        sound: undefined,
        smallIcon: "ic_stat_icon_config_sample",
      }],
    });
  } catch { /* ignore */ }
}

// ── Push notifications ─────────────────────────────────────────────────────

export async function registerPushNotifications(
  onToken: (token: string) => void,
  onNotification: (data: any) => void,
) {
  if (!isNative) return;
  try {
    const PN = await getPushNotifications();
    const perm = await PN.requestPermissions();
    if (perm.receive !== "granted") return;

    await PN.register();

    await PN.addListener("registration", (token) => {
      onToken(token.value);
    });

    await PN.addListener("pushNotificationReceived", (notification) => {
      onNotification(notification);
    });

    await PN.addListener("pushNotificationActionPerformed", (action) => {
      onNotification(action.notification);
    });
  } catch { /* ignore */ }
}

// ── Back button (Android) ──────────────────────────────────────────────────

export async function addBackButtonListener(cb: () => void) {
  if (platform !== "android") return () => {};
  try {
    const App = await getApp();
    const handle = await App.addListener("backButton", cb);
    return () => handle.remove();
  } catch {
    return () => {};
  }
}

// ── App state (foreground/background) ─────────────────────────────────────

export async function addAppStateListener(cb: (active: boolean) => void) {
  if (!isNative) return () => {};
  try {
    const App = await getApp();
    const handle = await App.addListener("appStateChange", (s) => cb(s.isActive));
    return () => handle.remove();
  } catch {
    return () => {};
  }
}
