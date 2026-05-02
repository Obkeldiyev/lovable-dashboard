import { api } from "@/lib/api";

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

const safe = async <T,>(req: Promise<{ data: T }>, fallback: T): Promise<T> => {
  try {
    const { data } = await req;
    return data;
  } catch {
    return fallback;
  }
};

export const dashboardApi = {
  getStats: () =>
    safe<DashboardStats>(api.get("/api/dashboard/stats"), {
      totalProducts: 0, totalWarehouses: 0, totalSuppliers: 0, totalUsers: 0,
      lowStockCount: 0, pendingPOCount: 0, activeReservations: 0, pendingShipments: 0,
    }),
  getRecentActivity: () => safe<RecentActivity[]>(api.get("/api/dashboard/activity"), []),
  getLowStock: () => safe<LowStockItem[]>(api.get("/api/dashboard/low-stock"), []),
  getAlerts: () => safe<Alert[]>(api.get("/api/dashboard/alerts"), []),
  getFulfillmentSeries: () =>
    safe<{ date: string; orders: number; shipped: number }[]>(
      api.get("/api/dashboard/fulfillment"), [],
    ),
  getPoStatus: () =>
    safe<{ status: string; count: number }[]>(api.get("/api/dashboard/po-status"), []),
};
