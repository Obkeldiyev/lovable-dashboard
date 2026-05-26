import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store";
import { markReady, setUser } from "@/store/authSlice";
import { loadPreferences } from "@/store/preferencesSlice";
import { tokenStore, api } from "@/lib/api";
import { authApi } from "@/features/auth/api";

export default function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const { user, ready } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (ready) return;
    if (!tokenStore.access) {
      dispatch(markReady());
      return;
    }

    async function bootstrap() {
      try {
        // 1. Load user from /api/auth/me
        // authApi.me() returns data?.data ?? data — which is the user object
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

        // 2. Load user preferences from backend (non-blocking)
        try {
          const { data } = await api.get("/api/preferences/me");
          const prefs = data?.data ?? data;
          if (prefs?.settings && typeof prefs.settings === "object") {
            dispatch(loadPreferences(prefs.settings));
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
  }, [dispatch, ready]);

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
