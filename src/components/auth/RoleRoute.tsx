import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/store";

// Maps frontend role aliases to backend role values
const ROLE_ALIASES: Record<string, string[]> = {
  driver: ["WAREHOUSE_STAFF", "AGENT", "DRIVER"],
  admin: ["SUPER_ADMIN", "DIRECTOR", "MANAGER", "ADMIN"],
  manager: ["SUPER_ADMIN", "DIRECTOR", "MANAGER"],
  superadmin: ["SUPER_ADMIN"],
  accountant: ["ACCOUNTANT", "SUPER_ADMIN", "DIRECTOR"],
  support: ["SUPPORT", "SUPER_ADMIN"],
  agent: ["AGENT"],
  supervisor: ["SUPERVISOR", "SUPER_ADMIN"],
  brand: ["BRAND"],
};

export default function RoleRoute({ allow }: { allow: string[] }) {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;

  const userRole = user.role ?? "";

  // Expand aliases to actual backend roles
  const allowedRoles = allow.flatMap((r) => {
    const lower = r.toLowerCase();
    return ROLE_ALIASES[lower] ?? [r, r.toUpperCase()];
  });

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
