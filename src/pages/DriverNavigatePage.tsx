import { useEffect, useRef, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deliveriesApi, trackingApi, type Delivery, type LatLng } from "@/features/logistics/api";
import { useGps } from "@/features/logistics/useGps";
import { useLogisticsSettings } from "@/features/logistics/settings";
import { YandexMap, type MapMarker } from "@/components/logistics/YandexMap";
import { ArrowLeft, Navigation, CheckCircle2, Truck, Locate, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function DriverNavigatePage() {
  const { id } = useParams<{ id: string }>();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [info, setInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [settings, setSettings] = useLogisticsSettings();
  const lastSent = useRef(0);

  const gps = useGps({
    enabled: settings.gpsEnabled,
    onUpdate: (c) => {
      if (!id) return;
      const now = Date.now();
      if (now - lastSent.current < settings.pingIntervalSec * 1000) return;
      lastSent.current = now;
      trackingApi
        .postLocation(id, { lat: c.lat, lng: c.lng, speedKmh: c.speedKmh, eventType: "LOCATION" })
        .catch(() => {});
    },
  });

  useEffect(() => {
    if (!id) return;
    deliveriesApi.get(id).then(setDelivery).catch(() => {});
  }, [id]);

  if (!settings.gpsEnabled) {
    return (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-1" />
            <div>
              <div className="font-semibold">GPS required</div>
              <p className="text-sm text-muted-foreground">
                Navigation needs your live location. Turn on GPS to continue.
              </p>
            </div>
          </div>
          <Button onClick={() => setSettings({ ...settings, gpsEnabled: true })} className="gap-2">
            <Locate className="h-4 w-4" /> Enable GPS
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function setStatus(s: Delivery["status"]) {
    if (!id) return;
    try {
      const t = await deliveriesApi.setStatus(id, s);
      setDelivery((p) => ({ ...(p ?? t), status: t.status }));
      toast.success(`Marked ${s.replace("_", " ").toLowerCase()}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? e?.message ?? "Failed to update");
    }
  }

  const pos: LatLng | null = gps.status === "active" ? { lat: gps.coords.lat, lng: gps.coords.lng } : null;
  const stops = delivery?.deliveryStops ?? [];
  const dest = stops[stops.length - 1];
  const destLatLng = dest?.latitude && dest?.longitude
    ? { lat: Number(dest.latitude), lng: Number(dest.longitude) }
    : null;
  const route = pos && destLatLng ? { from: pos, to: destLatLng } : null;

  const markers: MapMarker[] = [];
  if (pos) markers.push({ id: "me", lat: pos.lat, lng: pos.lng, label: "You", color: "#1d4ed8" });
  if (destLatLng) markers.push({ id: "dest", lat: destLatLng.lat, lng: destLatLng.lng, label: "Drop-off", color: "#ef4444" });

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/driver"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <div className="text-sm font-medium flex items-center gap-2">
          <Truck className="h-4 w-4" /> {delivery?.id?.slice(0, 8) ?? "Delivery"}
        </div>
      </div>

      {gps.status === "denied" && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
          GPS permission denied: {gps.reason}. Enable location in your browser settings.
        </div>
      )}

      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <YandexMap
            markers={markers}
            route={route}
            center={pos ?? destLatLng ?? settings.defaultCenter}
            zoom={14}
            traffic={settings.trafficLayer}
            onRouteInfo={setInfo}
            className="h-full w-full"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Distance" value={info ? `${info.distanceKm} ${settings.units}` : "—"} />
        <Stat label="ETA" value={info ? `${info.durationMin} min` : "—"} />
        <Stat label="Status" value={delivery?.status ?? "—"} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" onClick={() => setStatus("PICKED_UP")} className="gap-2">
          <Navigation className="h-4 w-4" /> Picked up
        </Button>
        <Button variant="secondary" onClick={() => setStatus("ARRIVED")}>Arrived</Button>
        <Button onClick={() => setStatus("DELIVERED")} className="gap-2">
          <CheckCircle2 className="h-4 w-4" /> Delivered
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold capitalize">{value}</div>
    </div>
  );
}
