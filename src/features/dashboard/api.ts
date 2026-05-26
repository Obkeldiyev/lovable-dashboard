import { api, tokenStore } from "@/lib/api";

export type DashboardStats = {
  totalProducts: number;
  totalWarehouses: number;
  totalSuppliers: number;
  totalUsers: number;
  lowStockCount: number;
  pendingPOCount: number;
  activeReservations: number;
  pendingShipments: number;
};

export type RecentActivity = {
  id: string;
  type: string;
  description: string;
  actorName?: string;
  createdAt: string;
};

export type LowStockItem = {
  id: string;
  productName: string;
  sku: string;
  warehouseName: string;
  onHand: number;
  reorderPoint: number;
};

export type Alert = {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  description?: string;
  createdAt: string;
};

const safe = async <T,>(req: Promise<{ data: unknown }>, fallback: T, normalize?: (value: unknown) => T): Promise<T> => {
  try {
    const { data } = await req;
    const payload = (data as any)?.data ?? data;
    return normalize ? normalize(payload) : (payload as T);
  } catch {
    return fallback;
  }
};

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value as T[] : []);
const tenantParams = () => (tokenStore.tenant ? { tenantId: tokenStore.tenant } : undefined);
const get = (url: string) => api.get(url, { params: tenantParams() });

const firstOk = async <T,>(requests: Array<() => Promise<{ data: unknown }>>, fallback: T, normalize?: (value: unknown) => T): Promise<T> => {
  for (const request of requests) {
    try {
      const { data } = await request();
      const payload = (data as any)?.data ?? data;
      return normalize ? normalize(payload) : (payload as T);
    } catch {
      /* try compatible endpoint */
    }
  }
  return fallback;
};

const normalizeStats = (value: unknown): DashboardStats => {
  const data = (value ?? {}) as any;
  return {
    totalProducts: Number(data.totalProducts ?? data.products?.total ?? 0),
    totalWarehouses: Number(data.totalWarehouses ?? data.warehouses?.total ?? 0),
    totalSuppliers: Number(data.totalSuppliers ?? data.suppliers?.total ?? 0),
    totalUsers: Number(data.totalUsers ?? data.users?.total ?? 0),
    lowStockCount: Number(data.lowStockCount ?? data.inventory?.lowStockCount ?? 0),
    pendingPOCount: Number(data.pendingPOCount ?? data.operations?.pendingPOs ?? 0),
    activeReservations: Number(data.activeReservations ?? data.operations?.activeReservations ?? 0),
    pendingShipments: Number(data.pendingShipments ?? data.operations?.pendingPackTasks ?? 0),
  };
};

const normalizeActivity = (value: unknown): RecentActivity[] =>
  asArray<any>(value).map((item, index) => ({
    id: String(item.id ?? `activity-${index}`),
    type: String(item.type ?? item.action ?? "activity"),
    description: String(item.description ?? ([item.action, item.entityType].filter(Boolean).join(" ") || "Activity")),
    actorName: item.actorName ?? item.actor?.fullName ?? item.actor?.email,
    createdAt: String(item.createdAt ?? new Date().toISOString()),
  }));

const normalizeLowStock = (value: unknown): LowStockItem[] =>
  asArray<any>(value).map((item) => ({
    id: String(item.id),
    productName: item.productName ?? item.product?.name ?? item.name ?? "",
    sku: item.sku ?? item.product?.sku ?? "",
    warehouseName: item.warehouseName ?? item.warehouse?.name ?? "",
    onHand: Number(item.onHand ?? item.qtyAvailable ?? item.qtyOnHand ?? 0),
    reorderPoint: Number(item.reorderPoint ?? 10),
  }));

const normalizeAlerts = (value: unknown): Alert[] =>
  asArray<any>(value).map((item, index) => {
    const rawSeverity = String(item.severity ?? item.level ?? "low").toLowerCase();
    const severity: Alert["severity"] = rawSeverity === "critical" || rawSeverity === "high" ? "high" : rawSeverity === "warning" || rawSeverity === "medium" ? "medium" : "low";
    return {
      id: String(item.id ?? `alert-${index}`),
      severity,
      title: String(item.title ?? item.type ?? "Alert"),
      description: item.description ? String(item.description) : undefined,
      createdAt: String(item.createdAt ?? new Date().toISOString()),
    };
  });

const normalizeFulfillment = (value: unknown): { date: string; orders: number; shipped: number }[] => {
  if (Array.isArray(value)) return value as { date: string; orders: number; shipped: number }[];
  const data = (value ?? {}) as any;
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return [{ date: today, orders: Number(data.pickTasks?.total ?? 0), shipped: Number(data.packTasks?.completed ?? data.packages?.total ?? 0) }];
};

const normalizePoStatus = (value: unknown): { status: string; count: number }[] => {
  if (Array.isArray(value)) return value as { status: string; count: number }[];
  const data = (value ?? {}) as any;
  const total = Number(data.total ?? 0);
  const completed = Number(data.completed ?? 0);
  const cancelled = Number(data.cancelled ?? 0);
  const open = Math.max(total - completed - cancelled, 0);
  return [
    { status: "OPEN", count: open },
    { status: "RECEIVED", count: completed },
    { status: "CANCELLED", count: cancelled },
  ].filter((item) => item.count > 0);
};

export const dashboardApi = {
  getStats: () =>
    safe<DashboardStats>(get("/api/dashboard/stats"), {
      totalProducts: 0, totalWarehouses: 0, totalSuppliers: 0, totalUsers: 0,
      lowStockCount: 0, pendingPOCount: 0, activeReservations: 0, pendingShipments: 0,
    }, normalizeStats),
  getRecentActivity: () => safe<RecentActivity[]>(get("/api/dashboard/activity"), [], normalizeActivity),
  getLowStock: () =>
    firstOk<LowStockItem[]>([
      () => get("/api/inventory/low-stock"),
      () => get("/api/dashboard/low-stock"),
    ], [], normalizeLowStock),
  getAlerts: () => safe<Alert[]>(get("/api/dashboard/alerts"), [], normalizeAlerts),
  getFulfillmentSeries: () =>
    firstOk<{ date: string; orders: number; shipped: number }[]>([
      () => get("/api/dashboard/fulfillment-metrics"),
      () => get("/api/dashboard/fulfillment"),
    ], [], normalizeFulfillment),
  getPoStatus: () =>
    firstOk<{ status: string; count: number }[]>([
      () => get("/api/dashboard/po-metrics"),
      () => get("/api/dashboard/po-status"),
    ], [], normalizePoStatus),
};
