/**
 * useNative — React hooks for Capacitor native features
 */

import { useEffect, useState, useCallback } from "react";
import {
  isNative, platform,
  getNetworkStatus, addNetworkListener,
  addBackButtonListener, addAppStateListener,
  hapticLight, hapticMedium, hapticSuccess, hapticError,
  setStatusBarDark, setStatusBarLight,
} from "@/lib/native";
import { useTheme } from "@/components/theme/ThemeProvider";

// ── useIsNative ────────────────────────────────────────────────────────────
export function useIsNative() {
  return { isNative, platform };
}

// ── useNetwork ─────────────────────────────────────────────────────────────
export function useNetwork() {
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    // Get initial status
    getNetworkStatus().then((s) => setConnected((s as any).connected ?? true));

    // Subscribe to changes
    let cleanup: (() => void) | undefined;
    addNetworkListener((c) => setConnected(c)).then((fn) => { cleanup = fn; });
    return () => cleanup?.();
  }, []);

  return connected;
}

// ── useHaptics ─────────────────────────────────────────────────────────────
export function useHaptics() {
  return {
    light:   useCallback(() => hapticLight(),   []),
    medium:  useCallback(() => hapticMedium(),  []),
    success: useCallback(() => hapticSuccess(), []),
    error:   useCallback(() => hapticError(),   []),
  };
}

// ── useStatusBar — syncs status bar color with theme ──────────────────────
export function useStatusBar() {
  const { mode } = useTheme();

  useEffect(() => {
    if (!isNative) return;
    if (mode === "dark") {
      setStatusBarDark();
    } else {
      setStatusBarLight();
    }
  }, [mode]);
}

// ── useBackButton (Android) ────────────────────────────────────────────────
export function useBackButton(handler: () => void) {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    addBackButtonListener(handler).then((fn) => { cleanup = fn; });
    return () => cleanup?.();
  }, [handler]);
}

// ── useAppState ────────────────────────────────────────────────────────────
export function useAppState(onForeground?: () => void, onBackground?: () => void) {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    addAppStateListener((active) => {
      if (active) onForeground?.();
      else onBackground?.();
    }).then((fn) => { cleanup = fn; });
    return () => cleanup?.();
  }, [onForeground, onBackground]);
}
