import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store";
import { toast } from "sonner";
import {
  RefreshCw, Boxes, PackageCheck, Package, Wifi, WifiOff,
  AlertTriangle, CheckCircle2, Clock, Server,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  type: "PICK" | "PACK";
  reference: string;
  status: string;
  warehouseId: string;
  assignedUserId: string | null;
  createdAt: string;
};

type ServiceStatus = {
  service: string;
  status: string;
  reachable: boolean;
  routeProvider?: string;
};

type OpsMetrics = {
  warehouseCount: number;
  pickTaskCount: number;
  packTaskCount: number;
  reservationCount: number;
  lowStockCount: number;
};

const STATUS_COLOR: Record<string, string> = {
  CREATED:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  PICKED:      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  PACKED:      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  SHORT:       "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  CANCELLED:   "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
};

export default function OpsPage() {
  const tenantId = useAppSelector((s) => s.auth.user?.tenantId);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<OpsMetrics | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Operations · VMS"; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = tenantId ? { params: { tenantId } } : {};
      const [tasksRes, overviewRes, servicesRes] = await Promise.allSettled([
        api.get("/api/ops/tasks", params),
        api.get("/api/ops/core-overview", params),
        api.get("/api/ops/services"),
      ]);

      if (tasksRes.status === "fulfilled") {
        const d = tasksRes.value.data;
        setTasks(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
      }
      if (overviewRes.status === "fulfilled") {
        const d = overviewRes.value.data?.data ?? overviewRes.value.data;
        setMetrics(d?.metrics ?? null);
      }
      if (servicesRes.status === "fulfilled") {
        const d = servicesRes.value.data?.data ?? servicesRes.value.data;
        const list: ServiceStatus[] = [];
        if (d?.core) list.push(d.core);
        if (d?.logistics) list.push(d.logistics);
        if (d?.pos) list.push(d.pos);
        setServices(list);
      }
    } catch {
      toast.error("Failed to load operations data");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const pickTasks = tasks.filter((t) => t.type === "PICK");
  const packTasks = tasks.filter((t) => t.type === "PACK");

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Operations</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pick &amp; pack tasks, warehouse metrics, and service health.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Warehouses",   value: metrics.warehouseCount,  icon: <Boxes className="h-4 w-4" /> },
            { label: "Pick Tasks",   value: metrics.pickTaskCount,   icon: <PackageCheck className="h-4 w-4" />, color: metrics.pickTaskCount > 0 ? "text-amber-600" : "" },
            { label: "Pack Tasks",   value: metrics.packTaskCount,   icon: <Package className="h-4 w-4" />, color: metrics.packTaskCount > 0 ? "text-amber-600" : "" },
            { label: "Reservations", value: metrics.reservationCount,icon: <CheckCircle2 className="h-4 w-4" /> },
            { label: "Low Stock",    value: metrics.lowStockCount,   icon: <AlertTriangle className="h-4 w-4" />, color: metrics.lowStockCount > 0 ? "text-destructive" : "" },
          ].map((m) => (
            <Card key={m.label} className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <span className={cn("text-muted-foreground", m.color)}>{m.icon}</span>
              </div>
              <div className={cn("text-2xl font-bold mt-1", m.color)}>{m.value}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Service health */}
      {services.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4" /> Service Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {services.map((s) => (
                <div
                  key={s.service}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3",
                    s.reachable ? "border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10"
                                : "border-destructive/30 bg-destructive/5",
                  )}
                >
                  {s.reachable
                    ? <Wifi className="h-4 w-4 text-green-600 shrink-0" />
                    : <WifiOff className="h-4 w-4 text-destructive shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.service}</p>
                    <p className={cn("text-xs", s.reachable ? "text-green-600" : "text-destructive")}>
                      {s.reachable ? (s.status ?? "online") : "offline"}
                    </p>
                    {s.routeProvider && (
                      <p className="text-[10px] text-muted-foreground">Route: {s.routeProvider}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks */}
      <Tabs defaultValue="pick">
        <TabsList>
          <TabsTrigger value="pick" className="gap-1.5">
            <PackageCheck className="h-3.5 w-3.5" />
            Pick Tasks
            {pickTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{pickTasks.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pack" className="gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Pack Tasks
            {packTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{packTasks.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {(["pick", "pack"] as const).map((type) => {
          const list = type === "pick" ? pickTasks : packTasks;
          return (
            <TabsContent key={type} value={type} className="mt-3">
              <Card>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="space-y-2 p-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
                      ))}
                    </div>
                  ) : list.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      No {type} tasks
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">ID</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Warehouse</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assignee</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {list.map((t) => (
                            <tr key={t.id} className="hover:bg-accent/30 transition-colors">
                              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{t.id.slice(0, 8)}</td>
                              <td className="px-4 py-2.5">
                                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", STATUS_COLOR[t.status] ?? "bg-muted text-muted-foreground")}>
                                  {t.status}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{t.warehouseId?.slice(0, 8) ?? "—"}</td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.assignedUserId?.slice(0, 8) ?? "Unassigned"}</td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(t.createdAt).toLocaleDateString()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
