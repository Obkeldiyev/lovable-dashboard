import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

// In production: VITE_API_BASE_URL is empty → same-origin, Nginx routes /api/* → backend :9300
// In development: VITE_API_BASE_URL=http://localhost:9300 (set in .env)
const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "";

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

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access;
  const tenant = tokenStore.tenant;
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  if (tenant) config.headers.set("X-Tenant-Id", tenant);
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshToken(): Promise<string | null> {
  const r = tokenStore.refresh;
  if (!r) return null;
  try {
    // Backend uses /api/auth/refresh-token
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
