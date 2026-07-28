import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

// TypeScript: window.__REDUX_STORE__ declaration
declare global {
  interface Window {
    __REDUX_STORE__?: {
      getState: () => {
        auth: {
          user: {
            role?: string;
            brandId?: string;
          } | null;
        };
      };
    };
  }
}

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "vms.access_token";
const REFRESH_KEY = "vms.refresh_token";
const TENANT_KEY = "vms.tenant_id";

export const tokenStore = {
  get access() {
    return localStorage.getItem(TOKEN_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  get tenant() {
    return localStorage.getItem(TENANT_KEY);
  },
  set(access: string, refresh?: string, tenant?: string) {
    localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    if (tenant) localStorage.setItem(TENANT_KEY, tenant);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(TENANT_KEY);
  },
};

// Helper: komponetlarda brand filter uchun ishlatiladi
// Misol: api.get('/api/brands', { params: { ...getBrandFilter() } })
export function getBrandFilter(): { brandId?: string } {
  const user = window.__REDUX_STORE__?.getState()?.auth?.user;
  if (!user) return {};
  const { role, brandId } = user;
  if (brandId && (role === "AGENT" || role === "MANAGER")) {
    return { brandId };
  }
  return {};
}

// Helper: bu rol uchun brand filter kerakmi?
export function isBrandRestricted(): boolean {
  const user = window.__REDUX_STORE__?.getState()?.auth?.user;
  if (!user) return false;
  return ["AGENT", "MANAGER"].includes(user.role ?? "");
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access;
  const tenant = tokenStore.tenant;
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  if (tenant) config.headers.set("X-Tenant-Id", tenant);

  // Backend ga X-Brand-Id header yuborish
  const user = window.__REDUX_STORE__?.getState()?.auth?.user;
  if (user?.brandId && (user.role === "AGENT" || user.role === "MANAGER")) {
    config.headers.set("X-Brand-Id", user.brandId);
  }

  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshToken(): Promise<string | null> {
  const r = tokenStore.refresh;
  if (!r) return null;
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/refresh-token`, {
      refreshToken: r,
    });
    const payload = res.data?.data ?? res.data;
    const access = payload?.accessToken ?? payload?.token;
    if (access) {
      tokenStore.set(access, payload?.refreshToken ?? r);
      return access;
    }
  } catch {
    /* ignore */
  }
  return null;
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? refreshToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers?.set?.("Authorization", `Bearer ${newToken}`);
        return api(original);
      }
      tokenStore.clear();
    }
    return Promise.reject(error);
  },
);