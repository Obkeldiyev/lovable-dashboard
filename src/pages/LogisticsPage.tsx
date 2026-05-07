import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useTripsStream } from "@/features/logistics/useTripsStream";
import { YandexMap, type MapMarker } from "@/components/logistics/YandexMap";
import { Truck, Wifi, WifiOff } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  pending: "#94a3b8",
  assigned: "#3b82f6",
  in_progress: "#f59e0b",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

export default function LogisticsPage() {
  const { trips, connected } = useTripsStream();
  const [selected, setSelected] = useState<string | null>(null);
  const trip = trips.find((t) => t.id === selected) ?? trips[0];

  const markers: MapMarker[] = useMemo(() => {
    return trips.flatMap((t) => {
      const arr: MapMarker[] = [];
      const loc = t.currentLocation;
      if (loc)
        arr.push({
          id: t.id,
          lat: loc.lat,
          lng: loc.lng,
          label: t.driverName ?? t.number ?? t.id.slice(0, 6),
          color: STATUS_COLOR[t.status] ?? "#3b82f6",
        });
      return arr;
    });
  }, [trips]);

  const route = trip?.origin && trip?.destination
    ? { from: trip.origin, to: trip.destination }
    : null;

  return (
    <div className="grid h-[calc(100vh-7rem)] grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="flex flex-col overflow-hidden">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4" /> Active trips
            <Badge variant="secondary" className="ml-1">{trips.length}</Badge>
          </CardTitle>
          {connected ? (
            <Badge variant="outline" className="gap-1 text-xs">
              <Wifi className="h-3 w-3 text-green-500" /> Live
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-xs">
              <WifiOff className="h-3 w-3 text-muted-foreground" /> Offline
            </Badge>
          )}
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <ul className="divide-y">
              {trips.length === 0 && (
                <li className="p-6 text-center text-sm text-muted-foreground">
                  No trips yet
                </li>
              )}
              {trips.map((t) => {
                const active = trip?.id === t.id;
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => setSelected(t.id)}
                      className={`w-full text-left px-4 py-3 transition-colors hover:bg-accent ${
                        active ? "bg-accent" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {t.number ?? t.id.slice(0, 8)}
                        </span>
                        <span
                          className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full"
                          style={{
                            background: STATUS_COLOR[t.status] + "22",
                            color: STATUS_COLOR[t.status],
                          }}
                        >
                          {t.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {t.driverName ?? "Unassigned"} · {t.vehicle ?? "—"}
                      </div>
                      {t.etaMinutes != null && (
                        <div className="text-xs mt-1">ETA {t.etaMinutes}m</div>
                      )}
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
            center={trip?.currentLocation ?? trip?.origin ?? undefined}
            className="h-full w-full"
          />
        </CardContent>
      </Card>
    </div>
  );
}
