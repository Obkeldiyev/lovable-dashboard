import axios from "axios";
import { tokenStore } from "@/lib/api";

const BASE =
  (import.meta.env.VITE_LOGISTICS_BASE_URL as string | undefined) ??
  "http://localhost:9100";

export const logisticsApi = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

logisticsApi.interceptors.request.use((c) => {
  const t = tokenStore.access;
  const ten = tokenStore.tenant;
  if (t) c.headers.set("Authorization", `Bearer ${t}`);
  if (ten) c.headers.set("X-Tenant-Id", ten);
  return c;
});

export type LatLng = { lat: number; lng: number };

export type Trip = {
  id: string;
  number?: string;
  status: "pending" | "assigned" | "in_progress" | "delivered" | "cancelled";
  driverId?: string;
  driverName?: string;
  vehicle?: string;
  origin?: LatLng & { address?: string };
  destination?: LatLng & { address?: string };
  currentLocation?: LatLng;
  etaMinutes?: number;
  distanceKm?: number;
  shipmentId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const tripsApi = {
  async list(params?: { driverId?: string; status?: string }) {
    const { data } = await logisticsApi.get<Trip[]>("/api/trips", { params });
    return data;
  },
  async get(id: string) {
    const { data } = await logisticsApi.get<Trip>(`/api/trips/${id}`);
    return data;
  },
  async myTrips() {
    const { data } = await logisticsApi.get<Trip[]>("/api/trips/me");
    return data;
  },
  async updateStatus(id: string, status: Trip["status"]) {
    const { data } = await logisticsApi.patch<Trip>(`/api/trips/${id}`, {
      status,
    });
    return data;
  },
  async pushLocation(id: string, loc: LatLng) {
    await logisticsApi.post(`/api/trips/${id}/location`, loc);
  },
};

export function tripsStreamUrl() {
  const t = tokenStore.access;
  const q = t ? `?token=${encodeURIComponent(t)}` : "";
  return `${BASE}/api/trips/stream${q}`;
}

export function tripLocationStreamUrl(tripId: string) {
  const t = tokenStore.access;
  const q = t ? `?token=${encodeURIComponent(t)}` : "";
  return `${BASE}/api/trips/${tripId}/location/stream${q}`;
}
