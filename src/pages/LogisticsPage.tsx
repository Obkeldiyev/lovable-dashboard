import { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useDeliveriesStream } from "@/features/logistics/useTripsStream";
import { useLogisticsSettings } from "@/features/logistics/settings";
import { YandexMap, type MapMarker } from "@/components/logistics/YandexMap";
import {
  Truck,
  Wifi,
  WifiOff,
  Settings,
  Search,
  MapPin,
  Clock,
  Navigation,
  RefreshCw,
  ChevronRight,
  Package,
  User,
  Plus,
  Filter,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { dispatchApi, type Delivery } from "@/features/logistics/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const STATUS_COLOR: Record<string, string> = {
  CREATED: "#94a3b8",
  ASSIGNED: "#3b82f6",
  PICKED_UP: "#8b5cf6",
  IN_TRANSIT: "#f59e0b",
  ARRIVED: "#06b6d4",
  DELIVERED: "#10b981",
  DELIVERY_FAILED: "#ef4444",
  CANCELLED: "#ef4444",
  RETURNING: "#f97316",
  RETURNED: "#64748b",
};

function getLatLng(event: any): { lat: number; lng: number } | null {
  const lat = Number(event?.lat ?? event?.latitude ?? 0);
  const lng = Number(event?.lng ?? event?.longitude ?? 0);
  if (!lat || !lng) return null;
  return { lat, lng };
}

export default function LogisticsPage() {
  const { t } = useTranslation();
  const {
    items: deliveries,
    connected,
    loading,
    refresh,
  } = useDeliveriesStream();
  const [settings] = useLogisticsSettings();
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [routeInfo, setRouteInfo] = useState<{
    distanceKm: number;
    durationMin: number;
  } | null>(null);

  useEffect(() => {
    document.title = `${t("logistics.title")} · VMS`;
  }, [t]);

  // Auto-select first delivery
  useEffect(() => {
    if (!selected && deliveries.length > 0) setSelected(deliveries[0].id);
  }, [deliveries, selected]);

  const filtered = deliveries.filter((d) => {
    const matchSearch =
      !search ||
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.driver?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      d.vehicle?.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
      d.status.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const trip =
    deliveries.find((t) => t.id === selected) ?? deliveries[0] ?? null;

  // Build map markers from all deliveries with known positions
  const markers: MapMarker[] = useMemo(() => {
    return deliveries.flatMap((d) => {
      const last = d.trackingEvents?.find((e: any) => getLatLng(e) !== null);
      if (!last) return [];
      const pos = getLatLng(last)!;
      return [
        {
          id: d.id,
          lat: pos.lat,
          lng: pos.lng,
          label: d.driver?.fullName ?? d.id.slice(0, 6),
          color: STATUS_COLOR[d.status] ?? "#3b82f6",
          live: ["IN_TRANSIT", "PICKED_UP", "ARRIVED"].includes(d.status),
        },
      ];
    });
  }, [deliveries]);

  // Build route for selected delivery
  const route = useMemo(() => {
    if (!trip) return null;
    const stops = trip.deliveryStops ?? [];
    if (stops.length < 2) return null;
    const first = stops[0];
    const last = stops[stops.length - 1];
    const fromLat = Number(first?.latitude ?? (first as any)?.lat ?? 0);
    const fromLng = Number(first?.longitude ?? (first as any)?.lng ?? 0);
    const toLat = Number(last?.latitude ?? (last as any)?.lat ?? 0);
    const toLng = Number(last?.longitude ?? (last as any)?.lng ?? 0);
    if (!fromLat || !fromLng || !toLat || !toLng) return null;
    return {
      from: { lat: fromLat, lng: fromLng },
      to: { lat: toLat, lng: toLng },
      waypoints: stops
        .slice(1, -1)
        .map((s: any) => ({
          lat: Number(s.latitude ?? s.lat ?? 0),
          lng: Number(s.longitude ?? s.lng ?? 0),
        }))
        .filter((w) => w.lat && w.lng),
    };
  }, [trip]);

  // Map center: live position > first stop > default
  const center = useMemo(() => {
    if (!trip) return settings.defaultCenter;
    const live = trip.trackingEvents?.find((e: any) => getLatLng(e));
    if (live) return getLatLng(live)!;
    const first = trip.deliveryStops?.[0];
    if (first) {
      const lat = Number((first as any).latitude ?? (first as any).lat ?? 0);
      const lng = Number((first as any).longitude ?? (first as any).lng ?? 0);
      if (lat && lng) return { lat, lng };
    }
    return settings.defaultCenter;
  }, [trip, settings.defaultCenter]);

  const stats = {
    total: deliveries.length,
    active: deliveries.filter((d) =>
      ["IN_TRANSIT", "PICKED_UP", "ARRIVED", "ASSIGNED"].includes(d.status),
    ).length,
    delivered: deliveries.filter((d) => d.status === "DELIVERED").length,
    failed: deliveries.filter((d) =>
      ["DELIVERY_FAILED", "CANCELLED"].includes(d.status),
    ).length,
  };

  const statuses = [
    "all",
    ...Array.from(new Set(deliveries.map((d) => d.status))),
  ];

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-7rem)]">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        {[
          {
            label: t("logistics.total"),
            value: stats.total,
            color: "",
            icon: <Package className="h-4 w-4" />,
          },
          {
            label: t("logistics.active"),
            value: stats.active,
            color: "text-primary",
            icon: <Navigation className="h-4 w-4" />,
          },
          {
            label: t("logistics.delivered"),
            value: stats.delivered,
            color: "text-green-600",
            icon: <Truck className="h-4 w-4" />,
          },
          {
            label: t("logistics.failed"),
            value: stats.failed,
            color: "text-destructive",
            icon: <Filter className="h-4 w-4" />,
          },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className={cn("text-muted-foreground", s.color)}>
                {s.icon}
              </span>
            </div>
            <div className={cn("text-2xl font-bold mt-1", s.color)}>
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Main content */}
      <div className="grid flex-1 min-h-0 grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        {/* Delivery list */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2 shrink-0 gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4" />
              {t("logistics.deliveries")}
              <Badge variant="secondary" className="text-xs">
                {deliveries.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-1">
              {connected ? (
                <Badge
                  variant="outline"
                  className="gap-1 text-xs text-green-600 border-green-200"
                >
                  <Wifi className="h-3 w-3" />
                  <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-green-500" />{" "}
                  {t("logistics.live")}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="gap-1 text-xs text-muted-foreground"
                >
                  <WifiOff className="h-3 w-3" /> {t("logistics.offline")}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={refresh}
                title={t("logistics.refresh")}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                <Link to="/settings/logistics">
                  <Settings className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>

          {/* Search + filter */}
          <div className="px-3 pb-2 shrink-0 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t("logistics.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm bg-muted/40"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {statuses.slice(0, 5).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                    statusFilter === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {s === "all"
                    ? t("logistics.all")
                    : t(`logistics.status.${s}`, { defaultValue: s })}
                </button>
              ))}
            </div>
          </div>

          <CardContent className="flex-1 p-0 min-h-0">
            <ScrollArea className="h-full">
              {loading && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                  {t("logistics.loadingDeliveries")}
                </div>
              )}
              {!loading && filtered.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {search || statusFilter !== "all"
                    ? t("logistics.noMatches")
                    : t("logistics.noDeliveries")}
                </div>
              )}
              <ul className="divide-y divide-border">
                {filtered.map((tItem) => {
                  const isActive = trip?.id === tItem.id;
                  const hasLocation = tItem.trackingEvents?.some((e: any) =>
                    getLatLng(e),
                  );
                  const color = STATUS_COLOR[tItem.status] ?? "#888";
                  return (
                    <li key={tItem.id}>
                      <button
                        onClick={() => setSelected(tItem.id)}
                        className={cn(
                          "relative w-full text-left px-4 py-3 transition-colors hover:bg-accent/50",
                          isActive && "bg-accent",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            #{tItem.id.slice(0, 8)}
                          </span>
                          <span
                            className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: color + "22", color }}
                          >
                            {t(`logistics.status.${tItem.status}`, {
                              defaultValue: tItem.status,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <User className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">
                            {tItem.driver?.fullName ??
                              t("logistics.unassigned")}
                          </span>
                          {tItem.vehicle?.plateNumber && (
                            <>
                              <span className="text-muted-foreground/40">
                                ·
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                {tItem.vehicle.plateNumber}
                              </span>
                            </>
                          )}
                        </div>
                        {hasLocation && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 live-dot" />
                            <span className="text-[10px] text-green-600 font-medium">
                              {t("logistics.liveLocation")}
                            </span>
                          </div>
                        )}
                        {isActive && (
                          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Map panel */}
        <Card className="overflow-hidden flex flex-col">
          {/* Route info bar */}
          {routeInfo && (
            <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/20 shrink-0 text-sm">
              <div className="flex items-center gap-1.5">
                <Navigation className="h-4 w-4 text-primary" />
                <span className="font-semibold">{routeInfo.distanceKm} km</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {routeInfo.durationMin} min
                </span>
              </div>
              {trip && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-xs text-muted-foreground truncate">
                    {trip.driver?.fullName ?? t("logistics.noDriver")} ·{" "}
                    {trip.vehicle?.plateNumber ?? t("logistics.noVehicle")}
                  </span>
                </>
              )}
              <div className="ml-auto">
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    color: STATUS_COLOR[trip?.status ?? ""] ?? undefined,
                    borderColor:
                      (STATUS_COLOR[trip?.status ?? ""] ?? "#888") + "44",
                  }}
                >
                  {trip?.status
                    ? t(`logistics.status.${trip.status}`, {
                        defaultValue: trip.status,
                      })
                    : "—"}
                </Badge>
              </div>
            </div>
          )}

          <CardContent className="p-0 flex-1 min-h-0">
            <YandexMap
              markers={markers}
              route={route}
              center={center}
              zoom={settings.defaultMapZoom}
              traffic={settings.trafficLayer}
              onRouteInfo={setRouteInfo}
              onMarkerClick={(id) => setSelected(id)}
              autoCenter={settings.autoCenterOnDriver}
              className="h-full w-full"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
