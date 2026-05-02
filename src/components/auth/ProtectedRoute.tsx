import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store";
import { markReady, setUser } from "@/store/authSlice";
import { tokenStore } from "@/lib/api";
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
    authApi
      .me()
      .then((u) => dispatch(setUser(u?.user ?? u ?? { id: "self" })))
      .catch(() => {
        tokenStore.clear();
        dispatch(setUser(null));
      });
  }, [dispatch, ready]);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
