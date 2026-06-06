import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store";
import { markReady, setUser } from "@/store/authSlice";
import { loadPreferences } from "@/store/preferencesSlice";
import { tokenStore, api } from "@/lib/api";
import { authApi } from "@/features/auth/api";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const { user, ready } = useAppSelector((s) => s.auth);
  const { loadTheme } = useTheme();

  useEffect(() => {
    if (ready) return;
    if (!tokenStore.access) {
      dispatch(markReady());
      return;
    }

    async function bootstrap() {
      try {
        const payload = await authApi.me();
        const u = payload ?? null;
        dispatch(
          setUser(
            u
              ? {
                  id: u.id ?? "self",
                  email: u.email,
                  name: u.fullName ?? u.name,
                  role: u.role,
                  tenantId: u.tenantId,
                }
              : null,
          ),
        );

        // Load preferences + theme from backend
        try {
          const { data } = await api.get("/api/preferences/me");
          const prefs = data?.data ?? data;
          if (prefs?.settings && typeof prefs.settings === "object") {
            const { theme, ...restPrefs } = prefs.settings as any;
            // Hydrate Redux preferences (layout, display, regional, etc.)
            dispatch(loadPreferences(restPrefs));
            // Hydrate theme (mode, preset, custom colors)
            if (theme && typeof theme === "object") {
              loadTheme(theme);
            }
          }
        } catch {
          // Preferences load failure is non-fatal — localStorage fallback is used
        }
      } catch {
        tokenStore.clear();
        dispatch(setUser(null));
      }
    }

    bootstrap();
  }, [dispatch, ready, loadTheme]);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary grid place-items-center">
            <span className="text-lg font-bold text-primary-foreground">V</span>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
