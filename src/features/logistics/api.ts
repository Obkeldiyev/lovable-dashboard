import axios from "axios";
import { tokenStore } from "@/lib/api";

// In production: VITE_LOGISTICS_BASE_URL is empty → same-origin, Nginx routes /lapi/* → backend :9100
// In development: VITE_LOGISTICS_BASE_URL=http://localhost:9100 (set in .env)
const BASE =
  (import.meta.env.VITE_LOGISTICS_BASE_URL as string | undefined) ??
  "";

// In production (BASE=""), use /lapi prefix so Nginx can proxy to logistics backend
// In development (BASE="http://localhost:9100"), hit the backend directly with /api prefix
const LOGISTICS_PREFIX = BASE === "" ? "/lapi" : "";

export const logisticsBaseUrl = () => BASE || window.location.origin;

export const logisticsApi = axios.create({
  // Empty baseURL = same-origin (relative URLs), Nginx handles the routing
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

function unwrap<T>(d: any): T {
  return (d?.data ?? d) as T;
}

export type LatLng = { lat: number; lng: number };

export type DeliveryStatus =
  | "CREATED" | "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT"
  | "ARRIVED" | "DELIVERED" | "DELIVERY_FAILED"
  | "CANCELLED" | "RETURNING" | "RETURNED";

export type Delivery = {
  id: string;
  tenantId?: string;
  status: DeliveryStatus;
  driverId?: string | null;
  vehicleId?: string | null;
  driver?: { id: string; fullName?: string; phone?: string } | null;
  vehicle?: { id: string; plateNumber?: string; type?: string } | null;
  order?: any;
  deliveryStops?: Array<{
    id: string; stopOrder: number;
    address?: string; latitude?: number; longitude?: number;
    contactName?: string; contactPhone?: string;
  }>;
  trackingEvents?: Array<{
    id: string; eventType: string; latitude?: number; longitude?: number;
    note?: string; createdAt: string;
  }>;
  proofOfDelivery?: any;
  scheduledAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Driver = {
  id: string; tenantId?: string;
  fullName: string; phone?: string; licenseNo?: string;
  status?: "OFFLINE" | "AVAILABLE" | "ON_DELIVERY" | "SUSPENDED";
  rating?: number; createdAt?: string;
};

export type Vehicle = {
  id: string; tenantId?: string;
  plateNo: string; type?: "CAR" | "VAN" | "TRUCK" | "BIKE" | "MOTORCYCLE";
  capacityKg?: number; createdAt?: string;
};

export const deliveriesApi = {
  async list(params?: { tenantId?: string; status?: string }) {
    const { data } = await logisticsApi.get(`${LOGISTICS_PREFIX}/api/deliveries`, { params });
    return unwrap<Delivery[]>(data);
  },
  async get(id: string) {
    const { data } = await logisticsApi.get(`${LOGISTICS_PREFIX}/api/deliveries/${id}`);
    return unwrap<Delivery & { route?: any }>(data);
  },
  async setStatus(id: string, status: DeliveryStatus) {
    const { data } = await logisticsApi.patch(`${LOGISTICS_PREFIX}/api/deliveries/${id}/status`, { status });
    return unwrap<Delivery>(data);
  },
  async createProof(id: string, body: { signatureUrl?: string; photoUrl?: string; receivedBy?: string; note?: string }) {
    const { data } = await logisticsApi.post(`${LOGISTICS_PREFIX}/api/deliveries/${id}/proof`, body);
    return unwrap(data);
  },
};

export const dispatchApi = {
  async board(params?: { tenantId?: string }) {
    const { data } = await logisticsApi.get(`${LOGISTICS_PREFIX}/api/dispatch/board`, { params });
    return unwrap<any>(data);
  },
  async controlTower(params?: { tenantId?: string }) {
    const { data } = await logisticsApi.get(`${LOGISTICS_PREFIX}/api/dispatch/control-tower`, { params });
    return unwrap<any>(data);
  },
  async createDelivery(body: any) {
    const { data } = await logisticsApi.post(`${LOGISTICS_PREFIX}/api/dispatch/deliveries`, body);
    return unwrap<Delivery>(data);
  },
  async assign(deliveryId: string, body: { driverId: string; vehicleId?: string }) {
    const { data } = await logisticsApi.post(`${LOGISTICS_PREFIX}/api/dispatch/deliveries/${deliveryId}/assign`, body);
    return unwrap<Delivery>(data);
  },
  async routeDetails(deliveryId: string) {
    const { data } = await logisticsApi.get(`${LOGISTICS_PREFIX}/api/dispatch/deliveries/${deliveryId}/route`);
    return unwrap<any>(data);
  },
};

export const fleetApi = {
  async drivers(params?: { tenantId?: string; status?: string }) {
    const { data } = await logisticsApi.get(`${LOGISTICS_PREFIX}/api/fleet/drivers`, { params });
    return unwrap<Driver[]>(data);
  },
  async createDriver(body: Partial<Driver> & { tenantId?: string }) {
    const { data } = await logisticsApi.post(`${LOGISTICS_PREFIX}/api/fleet/drivers`, body);
    return unwrap<Driver>(data);
  },
  async vehicles(params?: { tenantId?: string }) {
    const { data } = await logisticsApi.get(`${LOGISTICS_PREFIX}/api/fleet/vehicles`, { params });
    return unwrap<Vehicle[]>(data);
  },
  async createVehicle(body: Partial<Vehicle> & { tenantId?: string }) {
    const { data } = await logisticsApi.post(`${LOGISTICS_PREFIX}/api/fleet/vehicles`, body);
    return unwrap<Vehicle>(data);
  },
  async assign(body: { driverId: string; vehicleId: string }) {
    const { data } = await logisticsApi.post(`${LOGISTICS_PREFIX}/api/fleet/assignments`, body);
    return unwrap(data);
  },
};

export const trackingApi = {
  async timeline(deliveryId: string) {
    const { data } = await logisticsApi.get(`${LOGISTICS_PREFIX}/api/tracking/deliveries/${deliveryId}/tracking`);
    return unwrap<any[]>(data);
  },
  async postLocation(deliveryId: string, body: {
    lat: number; lng: number; speedKmh?: number;
    eventType?: string; status?: string; note?: string; capturedAt?: string;
  }) {
    const { data } = await logisticsApi.post(`${LOGISTICS_PREFIX}/api/tracking/deliveries/${deliveryId}/tracking`, body);
    return unwrap(data);
  },
  async postBatch(deliveryId: string, points: Array<{ lat: number; lng: number; capturedAt?: string }>) {
    const { data } = await logisticsApi.post(`${LOGISTICS_PREFIX}/api/tracking/deliveries/${deliveryId}/tracking/batch`, { points });
    return unwrap(data);
  },
};

export function tenantStreamUrl(tenantId: string) {
  const t = tokenStore.access;
  const q = t ? `?token=${encodeURIComponent(t)}` : "";
  // In production (BASE=""), Nginx proxies /live/* → logistics /api/live/*
  const base = BASE === "" ? "" : BASE;
  const path = BASE === ""
    ? `/live/tenants/${tenantId}`
    : `/api/live/tenants/${tenantId}`;
  return `${base}${path}${q}`;
}

export function deliveryStreamUrl(deliveryId: string) {
  const t = tokenStore.access;
  const q = t ? `?token=${encodeURIComponent(t)}` : "";
  const base = BASE === "" ? "" : BASE;
  const path = BASE === ""
    ? `/live/deliveries/${deliveryId}`
    : `/api/live/deliveries/${deliveryId}`;
  return `${base}${path}${q}`;
}

// Shops live on the core backend (not logistics)
import { api } from "@/lib/api";
export type Shop = {
  id: string; code?: string; name: string; legalName?: string;
  phone?: string; email?: string; address?: string;
  latitude?: number | null; longitude?: number | null;
  notes?: string; status?: string;
};
export const shopsApi = {
  async list(params?: { search?: string; status?: string }) {
    const { data } = await api.get("/api/shops", { params });
    return unwrap<Shop[]>(data);
  },
  async create(body: Partial<Shop>) {
    const { data } = await api.post("/api/shops", body);
    return unwrap<Shop>(data);
  },
  async update(id: string, body: Partial<Shop>) {
    const { data } = await api.put(`/api/shops/${id}`, body);
    return unwrap<Shop>(data);
  },
};
