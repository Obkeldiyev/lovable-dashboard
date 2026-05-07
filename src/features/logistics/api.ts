import axios from "axios";
import { tokenStore } from "@/lib/api";

const BASE =
  (import.meta.env.VITE_LOGISTICS_BASE_URL as string | undefined) ??
  "http://localhost:9100";

export const logisticsBaseUrl = () => BASE;

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
  fullName: string; phone?: string; licenseNumber?: string;
  status?: "OFFLINE" | "AVAILABLE" | "ON_DELIVERY" | "SUSPENDED";
  rating?: number; createdAt?: string;
};

export type Vehicle = {
  id: string; tenantId?: string;
  plateNumber: string; type?: "CAR" | "VAN" | "TRUCK" | "BIKE";
  capacityKg?: number; active?: boolean; createdAt?: string;
};

export const deliveriesApi = {
  async list(params?: { tenantId?: string; status?: string }) {
    const { data } = await logisticsApi.get("/api/deliveries", { params });
    return unwrap<Delivery[]>(data);
  },
  async get(id: string) {
    const { data } = await logisticsApi.get(`/api/deliveries/${id}`);
    return unwrap<Delivery & { route?: any }>(data);
  },
  async setStatus(id: string, status: DeliveryStatus) {
    const { data } = await logisticsApi.patch(`/api/deliveries/${id}/status`, { status });
    return unwrap<Delivery>(data);
  },
  async createProof(id: string, body: { signatureUrl?: string; photoUrl?: string; receivedBy?: string; note?: string }) {
    const { data } = await logisticsApi.post(`/api/deliveries/${id}/proof`, body);
    return unwrap(data);
  },
};

export const dispatchApi = {
  async board(params?: { tenantId?: string }) {
    const { data } = await logisticsApi.get("/api/dispatch/board", { params });
    return unwrap<any>(data);
  },
  async controlTower(params?: { tenantId?: string }) {
    const { data } = await logisticsApi.get("/api/dispatch/control-tower", { params });
    return unwrap<any>(data);
  },
  async createDelivery(body: any) {
    const { data } = await logisticsApi.post("/api/dispatch/deliveries", body);
    return unwrap<Delivery>(data);
  },
  async assign(deliveryId: string, body: { driverId: string; vehicleId?: string }) {
    const { data } = await logisticsApi.post(`/api/dispatch/deliveries/${deliveryId}/assign`, body);
    return unwrap<Delivery>(data);
  },
  async routeDetails(deliveryId: string) {
    const { data } = await logisticsApi.get(`/api/dispatch/deliveries/${deliveryId}/route`);
    return unwrap<any>(data);
  },
};

export const fleetApi = {
  async drivers(params?: { tenantId?: string; status?: string }) {
    const { data } = await logisticsApi.get("/api/fleet/drivers", { params });
    return unwrap<Driver[]>(data);
  },
  async createDriver(body: Partial<Driver>) {
    const { data } = await logisticsApi.post("/api/fleet/drivers", body);
    return unwrap<Driver>(data);
  },
  async vehicles(params?: { tenantId?: string }) {
    const { data } = await logisticsApi.get("/api/fleet/vehicles", { params });
    return unwrap<Vehicle[]>(data);
  },
  async createVehicle(body: Partial<Vehicle>) {
    const { data } = await logisticsApi.post("/api/fleet/vehicles", body);
    return unwrap<Vehicle>(data);
  },
  async assign(body: { driverId: string; vehicleId: string }) {
    const { data } = await logisticsApi.post("/api/fleet/assignments", body);
    return unwrap(data);
  },
};

export const trackingApi = {
  async timeline(deliveryId: string) {
    const { data } = await logisticsApi.get(`/api/tracking/deliveries/${deliveryId}/tracking`);
    return unwrap<any[]>(data);
  },
  async postLocation(deliveryId: string, body: {
    lat: number; lng: number; speedKmh?: number;
    eventType?: string; status?: string; note?: string; capturedAt?: string;
  }) {
    const { data } = await logisticsApi.post(`/api/tracking/deliveries/${deliveryId}/tracking`, body);
    return unwrap(data);
  },
  async postBatch(deliveryId: string, points: Array<{ lat: number; lng: number; capturedAt?: string }>) {
    const { data } = await logisticsApi.post(`/api/tracking/deliveries/${deliveryId}/tracking/batch`, { points });
    return unwrap(data);
  },
};

export function tenantStreamUrl(tenantId: string) {
  const t = tokenStore.access;
  const q = t ? `?token=${encodeURIComponent(t)}` : "";
  return `${BASE}/api/live/tenants/${tenantId}${q}`;
}
export function deliveryStreamUrl(deliveryId: string) {
  const t = tokenStore.access;
  const q = t ? `?token=${encodeURIComponent(t)}` : "";
  return `${BASE}/api/live/deliveries/${deliveryId}${q}`;
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
