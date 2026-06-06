/**
 * usePreferencesSync
 *
 * Debounced sync of BOTH Redux preferences AND theme state to the backend.
 * Call this once inside a component that has access to both the Redux store
 * and the ThemeProvider context (i.e. inside AppLayout or AppInner).
 *
 * Saves to: PUT /api/preferences/me  { settings: { ...prefs, theme: {...} } }
 */
import { useEffect, useRef } from "react";
import { useAppSelector } from "@/store";
import { useTheme } from "@/components/theme/ThemeProvider";
import { api } from "@/lib/api";

const DEBOUNCE_MS = 1200;

export function usePreferencesSync() {
  const prefs = useAppSelector((s) => s.preferences);
  const user  = useAppSelector((s) => s.auth.user);
  const { mode, preset, custom } = useTheme();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track previous userId so we reset on account switch
  const prevUserRef = useRef<string | null>(null);

  useEffect(() => {
    // Don't sync if not logged in
    if (!user?.id) return;

    // Reset debounce timer if user changed
    if (prevUserRef.current !== user.id) {
      prevUserRef.current = user.id;
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Debounce the save
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const settings = {
          ...prefs,
          theme: { mode, preset, custom },
        };
        await api.put("/api/preferences/me", {
          language: prefs.language,
          settings,
        });
      } catch {
        // Silent — localStorage is the fallback
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [prefs, mode, preset, custom, user?.id]);
}
