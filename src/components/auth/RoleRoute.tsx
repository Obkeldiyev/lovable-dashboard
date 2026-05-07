import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/store";

export default function RoleRoute({ allow }: { allow: string[] }) {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  const role = (user.role ?? "").toLowerCase();
  if (!allow.map((r) => r.toLowerCase()).includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
