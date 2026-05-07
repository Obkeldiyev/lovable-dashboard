import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { deliveriesApi, type Delivery } from "@/features/logistics/api";
import { useLogisticsSettings } from "@/features/logistics/settings";
import { Navigation, MapPin, Locate, AlertCircle } from "lucide-react";
import { useAppSelector } from "@/store";

export default function DriverPage() {
  const tenantId = useAppSelector((s) => s.auth.user?.tenantId);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const [items, setItems] = useState<Delivery[] | null>(null);
  const [settings, setSettings] = useLogisticsSettings();

  useEffect(() => {
    deliveriesApi
      .list(tenantId ? { tenantId } : undefined)
      .then((all) => setItems(all.filter((d) => !userId || d.driverId === userId || d.driver?.id === userId)))
      .catch(() => setItems([]));
  }, [tenantId, userId]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">My deliveries</h2>
        <p className="text-sm text-muted-foreground">Tap a delivery to start navigation.</p>
      </div>

      {!settings.gpsEnabled && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium">GPS is turned off</div>
              <p className="text-sm text-muted-foreground">
                You must enable GPS to receive deliveries and start navigation.
              </p>
            </div>
            <Button onClick={() => setSettings({ ...settings, gpsEnabled: true })} className="gap-2">
              <Locate className="h-4 w-4" /> Turn on GPS
            </Button>
          </CardContent>
        </Card>
      )}

      {items === null ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No assigned deliveries
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((t) => {
            const stops = t.deliveryStops ?? [];
            const origin = stops[0];
            const dest = stops[stops.length - 1];
            return (
              <Card key={t.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">{t.id.slice(0, 8)}</CardTitle>
                  <Badge variant="outline">{t.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary" />
                      <span className="line-clamp-1">{origin?.address ?? "Origin"}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 text-destructive" />
                      <span className="line-clamp-1">{dest?.address ?? "Destination"}</span>
                    </div>
                  </div>
                  <Button asChild className="w-full gap-2" disabled={!settings.gpsEnabled}>
                    <Link to={`/driver/navigate/${t.id}`}>
                      <Navigation className="h-4 w-4" /> Start navigation
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
