import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useDeliveriesStream } from "@/features/logistics/useTripsStream";
import { useLogisticsSettings } from "@/features/logistics/settings";
import { YandexMap, type MapMarker } from "@/components/logistics/YandexMap";
import { Truck, Wifi, WifiOff, Settings } from "lucide-react";
import { Link } from "react-router-dom";

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

export default function LogisticsPage() {
  const { items: deliveries, connected, loading } = useDeliveriesStream();
  const [settings] = useLogisticsSettings();
  const [selected, setSelected] = useState<string | null>(null);
  const trip = deliveries.find((t) => t.id === selected) ?? deliveries[0];

  const markers: MapMarker[] = useMemo(() => {
    return deliveries.flatMap((d) => {
      const last = d.trackingEvents?.find((e) => e.latitude != null && e.longitude != null);
      if (!last) return [];
      return [{
        id: d.id,
        lat: Number(last.latitude),
        lng: Number(last.longitude),
        label: d.driver?.fullName ?? d.id.slice(0, 6),
        color: STATUS_COLOR[d.status] ?? "#3b82f6",
      }];
    });
  }, [deliveries]);

  const stops = trip?.deliveryStops ?? [];
  const from = stops[0];
  const to = stops[stops.length - 1];
  const route = from && to && from.latitude && to.latitude
    ? { from: { lat: Number(from.latitude), lng: Number(from.longitude) }, to: { lat: Number(to.latitude), lng: Number(to.longitude) } }
    : null;
  const center = trip
    ? (() => {
        const live = trip.trackingEvents?.find((e) => e.latitude != null);
        if (live) return { lat: Number(live.latitude), lng: Number(live.longitude) };
        if (from?.latitude) return { lat: Number(from.latitude), lng: Number(from.longitude) };
        return settings.defaultCenter;
      })()
    : settings.defaultCenter;

  return (
    <div className="grid h-[calc(100vh-7rem)] grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="flex flex-col overflow-hidden">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4" /> Deliveries
            <Badge variant="secondary" className="ml-1">{deliveries.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {connected ? (
              <Badge variant="outline" className="gap-1 text-xs">
                <Wifi className="h-3 w-3 text-green-500" /> Live
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-xs">
                <WifiOff className="h-3 w-3 text-muted-foreground" /> Offline
              </Badge>
            )}
            <Button asChild variant="ghost" size="icon" aria-label="Settings">
              <Link to="/settings/logistics"><Settings className="h-4 w-4" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <ul className="divide-y">
              {!loading && deliveries.length === 0 && (
                <li className="p-6 text-center text-sm text-muted-foreground">No deliveries yet</li>
              )}
              {deliveries.map((t) => {
                const active = trip?.id === t.id;
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => setSelected(t.id)}
                      className={`w-full text-left px-4 py-3 transition-colors hover:bg-accent ${active ? "bg-accent" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{t.id.slice(0, 8)}</span>
                        <span
                          className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full"
                          style={{ background: (STATUS_COLOR[t.status] ?? "#888") + "22", color: STATUS_COLOR[t.status] }}
                        >
                          {t.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {t.driver?.fullName ?? "Unassigned"} · {t.vehicle?.plateNumber ?? "—"}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardContent className="p-0 h-full">
          <YandexMap
            markers={markers}
            route={route}
            center={center}
            zoom={settings.defaultMapZoom}
            traffic={settings.trafficLayer}
            className="h-full w-full"
          />
        </CardContent>
      </Card>
    </div>
  );
}
