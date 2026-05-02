import { api, tokenStore } from "@/lib/api";

export type LoginPayload = { email: string; password: string };
export type LoginResponse = {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  user?: { id: string; email: string; name?: string; role?: string; tenantId?: string };
};

export const authApi = {
  async login(p: LoginPayload) {
    const { data } = await api.post<LoginResponse>("/api/auth/login", p);
    const access = data.accessToken ?? data.token;
    if (access) tokenStore.set(access, data.refreshToken, data.user?.tenantId);
    return data;
  },
  async me() {
    const { data } = await api.get("/api/auth/me");
    return data;
  },
  async logout() {
    try {
      await api.post("/api/auth/logout");
    } catch {}
    tokenStore.clear();
  },
};
