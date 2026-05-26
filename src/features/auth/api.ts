import { api, tokenStore } from "@/lib/api";

export type LoginPayload = { email: string; password: string };
export type LoginResponse = {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  user?: { id: string; email: string; name?: string; role?: string; tenantId?: string; permissions?: string[] };
};

type ApiResponse<T> = T & {
  data?: T;
};

function userFromToken() {
  const token = tokenStore.access;
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return {
      id: decoded.userId ?? "self",
      email: decoded.email ?? "",
      role: decoded.role,
      tenantId: decoded.tenantId,
      permissions: decoded.role === "SUPER_ADMIN" ? ["*"] : [],
    };
  } catch {
    return { id: "self", email: "", tenantId: tokenStore.tenant ?? undefined };
  }
}

export const authApi = {
  async login(p: LoginPayload) {
    const { data } = await api.post<ApiResponse<LoginResponse>>("/api/auth/login", p);
    const payload = data.data ?? data;
    const access = payload.accessToken ?? payload.token;
    if (access) tokenStore.set(access, payload.refreshToken, payload.user?.tenantId);
    return payload;
  },
  async me() {
    try {
      const { data } = await api.get("/api/auth/me");
      return data?.data ?? data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return userFromToken();
      }
      throw error;
    }
  },
  async logout() {
    try {
      await api.post("/api/auth/logout");
    } catch {}
    tokenStore.clear();
  },
};
