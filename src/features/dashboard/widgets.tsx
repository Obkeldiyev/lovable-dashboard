import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { dashboardApi, type LowStockItem, type Alert, type RecentActivity, type DashboardStats } from "@/features/dashboard/api";
import type { WidgetId } from "@/store/dashboardSlice";
import { Boxes, Warehouse, Truck, AlertTriangle, ShoppingCart, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

function Kpi({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function useStats() {
  const [s, set] = useState<DashboardStats | null>(null);
  useEffect(() => { dashboardApi.getStats().then(set); }, []);
  return s;
}

const toList = <T,>(value: T[] | unknown): T[] => (Array.isArray(value) ? value : []);

export function KpiProducts() {
  const s = useStats();
  const { t } = useTranslation();
  return <Kpi label={t("dashboard.products")} value={s?.totalProducts ?? "—"} icon={Boxes} />;
}
export function KpiWarehouses() {
  const s = useStats();
  const { t } = useTranslation();
  return <Kpi label={t("dashboard.warehouses")} value={s?.totalWarehouses ?? "—"} icon={Warehouse} />;
}
export function KpiSuppliers() {
  const s = useStats();
  const { t } = useTranslation();
  return <Kpi label={t("dashboard.suppliers")} value={s?.totalSuppliers ?? "—"} icon={Truck} />;
}
export function KpiLowStock() {
  const s = useStats();
  const { t } = useTranslation();
  return <Kpi label={t("dashboard.lowStock")} value={s?.lowStockCount ?? "—"} icon={AlertTriangle} />;
}
export function KpiPendingPo() {
  const s = useStats();
  const { t } = useTranslation();
  return <Kpi label={t("dashboard.pendingPOs")} value={s?.pendingPOCount ?? "—"} icon={ShoppingCart} />;
}
export function KpiShipments() {
  const s = useStats();
  const { t } = useTranslation();
  return <Kpi label={t("dashboard.shipments")} value={s?.pendingShipments ?? "—"} icon={Send} />;
}

export function ChartFulfillment() {
  const [data, setData] = useState<{ date: string; orders: number; shipped: number }[]>([]);
  const { t } = useTranslation();
  useEffect(() => { dashboardApi.getFulfillmentSeries().then(setData); }, []);
  const fallback = data.length ? data : Array.from({ length: 7 }, (_, i) => ({
    date: `D${i + 1}`, orders: 0, shipped: 0,
  }));
  return (
    <Card className="h-full">
      <CardHeader><CardTitle className="text-sm">{t("dashboard.fulfillment")}</CardTitle></CardHeader>
      <CardContent className="h-[calc(100%-3.5rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={fallback}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            <Area type="monotone" dataKey="orders" stroke="hsl(var(--primary))" fill="url(#g1)" />
            <Area type="monotone" dataKey="shipped" stroke="hsl(var(--accent-foreground))" fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ChartPoStatus() {
  const [data, setData] = useState<{ status: string; count: number }[]>([]);
  const { t } = useTranslation();
  useEffect(() => { dashboardApi.getPoStatus().then(setData); }, []);
  const fallback = data.length ? data : [{ status: "—", count: 0 }];
  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent-foreground))", "hsl(var(--muted-foreground))", "hsl(var(--border))"];
  return (
    <Card className="h-full">
      <CardHeader><CardTitle className="text-sm">{t("dashboard.poStatus")}</CardTitle></CardHeader>
      <CardContent className="h-[calc(100%-3.5rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={fallback}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {fallback.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ListRecentActivity() {
  const [items, setItems] = useState<RecentActivity[]>([]);
  const { t } = useTranslation();
  useEffect(() => { dashboardApi.getRecentActivity().then((value) => setItems(toList<RecentActivity>(value))); }, []);
  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader><CardTitle className="text-sm">{t("dashboard.recentActivity")}</CardTitle></CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-2">
        {items.length === 0 && <p className="text-xs text-muted-foreground">{t("dashboard.noRecentActivity")}</p>}
        {toList<RecentActivity>(items).map((a) => (
          <div key={a.id} className="rounded-md border border-border p-2 text-xs">
            <div className="font-medium">{a.description}</div>
            <div className="text-muted-foreground">{a.actorName ?? "—"} · {new Date(a.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ListLowStock() {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const { t } = useTranslation();
  useEffect(() => { dashboardApi.getLowStock().then((value) => setItems(toList<LowStockItem>(value))); }, []);
  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader><CardTitle className="text-sm">{t("dashboard.lowStock")}</CardTitle></CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {items.length === 0 && <p className="text-xs text-muted-foreground">{t("dashboard.allGood")}</p>}
        <ul className="divide-y divide-border text-xs">
          {toList<LowStockItem>(items).map((i) => (
            <li key={i.id} className="flex items-center justify-between py-1.5">
              <span className="truncate">{i.productName}</span>
              <span className="text-muted-foreground">{i.onHand}/{i.reorderPoint}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function ListAlerts() {
  const [items, setItems] = useState<Alert[]>([]);
  const { t } = useTranslation();
  useEffect(() => { dashboardApi.getAlerts().then((value) => setItems(toList<Alert>(value))); }, []);
  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader><CardTitle className="text-sm">{t("dashboard.alerts")}</CardTitle></CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-2">
        {items.length === 0 && <p className="text-xs text-muted-foreground">{t("dashboard.noAlerts")}</p>}
        {toList<Alert>(items).map((a) => (
          <div key={a.id} className="rounded-md border border-border p-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium">{a.title}</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] ${
                a.severity === "high" ? "bg-destructive/15 text-destructive"
                : a.severity === "medium" ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground"
              }`}>{a.severity}</span>
            </div>
            {a.description && <p className="text-muted-foreground">{a.description}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// WIDGETS map — labels are translation keys resolved at render time via useTranslation inside each component
export const WIDGETS: Record<WidgetId, { label: string; render: () => JSX.Element }> = {
  "kpi-products":          { label: "KPI: Products",        render: () => <KpiProducts /> },
  "kpi-warehouses":        { label: "KPI: Warehouses",       render: () => <KpiWarehouses /> },
  "kpi-suppliers":         { label: "KPI: Suppliers",        render: () => <KpiSuppliers /> },
  "kpi-low-stock":         { label: "KPI: Low stock",        render: () => <KpiLowStock /> },
  "kpi-pending-po":        { label: "KPI: Pending POs",      render: () => <KpiPendingPo /> },
  "kpi-shipments":         { label: "KPI: Shipments",        render: () => <KpiShipments /> },
  "chart-fulfillment":     { label: "Chart: Fulfillment",    render: () => <ChartFulfillment /> },
  "chart-po-status":       { label: "Chart: PO Status",      render: () => <ChartPoStatus /> },
  "list-recent-activity":  { label: "List: Recent activity", render: () => <ListRecentActivity /> },
  "list-low-stock":        { label: "List: Low stock",       render: () => <ListLowStock /> },
  "list-alerts":           { label: "List: Alerts",          render: () => <ListAlerts /> },
};

export const __keep = PieChart;
