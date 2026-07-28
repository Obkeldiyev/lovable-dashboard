import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { deliveriesApi, trackingApi, type Delivery } from "@/features/logistics/api";
import { useGps } from "@/features/logistics/useGps";
import { useLogisticsSettings } from "@/features/logistics/settings";
import { YandexMap, type MapMarker } from "@/components/logistics/YandexMap";
import {
  ArrowLeft, Navigation, CheckCircle2, Truck, Locate,
  AlertCircle, MapPin, Clock, Gauge, Wifi, WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UuidCell } from "@/components/ui/uuid-cell";

const STATUS_STEPS: Delivery["status"][] = [
  "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "ARRIVED", "DELIVERED",
];

export default function DriverNavigatePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [info, setInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [settings, setSettings] = useLogisticsSettings();
  const [uploading, setUploading] = useState(false);
  const lastSent = useRef(0);

  const gps = useGps({
    enabled: settings.gpsEnabled,
    onUpdate: async (c) => {
      if (!id) return;
      const now = Date.now();
      if (now - lastSent.current < settings.pingIntervalSec * 1000) return;
      lastSent.current = now;
      setUploading(true);
      try {
        await trackingApi.postLocation(id, {
          lat: c.lat,
          lng: c.lng,
          speedKmh: c.speedKmh,
          eventType: "LOCATION",
        });
      } catch { /* silent */ } finally {
        setUploading(false);
      }
    },
  });

  useEffect(() => {
    if (!id) return;
    deliveriesApi.get(id).then(setDelivery).catch(() => {});
    document.title = `${t("driverNavigatePage.title")} · VMS`;
  }, [id, t]);

  async function setStatus(s: Delivery["status"]) {
    if (!id) return;
    try {
      const updated = await deliveriesApi.setStatus(id, s);
      setDelivery((p) => ({ ...(p ?? updated), status: updated.status }));
      toast.success(
        t("driverNavigatePage.statusUpdated", {
          status: t(`driverNavigatePage.steps.${s}`, s.replace(/_/g, " ").toLowerCase()),
        })
      );
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? t("driverNavigatePage.statusFailed"));
    }
  }

  const pos = gps.status === "active" ? { lat: gps.coords.lat, lng: gps.coords.lng } : null;
  const stops = delivery?.deliveryStops ?? [];
  const dest = stops[stops.length - 1];
  const destLatLng = dest
    ? (() => {
        const lat = Number((dest as any).latitude ?? (dest as any).lat ?? 0);
        const lng = Number((dest as any).longitude ?? (dest as any).lng ?? 0);
        return lat && lng ? { lat, lng } : null;
      })()
    : null;

  const route = pos && destLatLng ? { from: pos, to: destLatLng } : null;

  const markers: MapMarker[] = [
    ...(pos
      ? [{ id: "me", lat: pos.lat, lng: pos.lng, label: t("driverNavigatePage.markers.me"), color: "#1d4ed8", live: true }]
      : []),
    ...(destLatLng
      ? [{ id: "dest", lat: destLatLng.lat, lng: destLatLng.lng, label: t("driverNavigatePage.markers.dest"), color: "#ef4444" }]
      : []),
    ...stops.slice(0, -1).map((s: any, i: number) => {
      const lat = Number(s.latitude ?? s.lat ?? 0);
      const lng = Number(s.longitude ?? s.lng ?? 0);
      return lat && lng
        ? { id: `stop-${i}`, lat, lng, label: t("driverNavigatePage.markers.stop", { number: i + 1 }), color: "#f59e0b" }
        : null;
    }).filter(Boolean) as MapMarker[],
  ];

  const currentStepIdx = STATUS_STEPS.indexOf(delivery?.status as any);

  if (!settings.gpsEnabled) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/driver">
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("driverNavigatePage.back")}
          </Link>
        </Button>
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{t("driverNavigatePage.gpsDisabled.title")}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t("driverNavigatePage.gpsDisabled.description")}
                </p>
              </div>
            </div>
            <Button onClick={() => setSettings({ ...settings, gpsEnabled: true })} className="gap-2">
              <Locate className="h-4 w-4" /> {t("driverNavigatePage.gpsDisabled.enable")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/driver">
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("driverNavigatePage.back")}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          {delivery?.id ? (
            <UuidCell value={delivery.id} />
          ) : (
            <span className="text-sm font-medium">{t("driverNavigatePage.loading")}</span>
          )}
          {delivery?.status && (
            <Badge variant="outline" className="text-xs">
              {t(`driverNavigatePage.steps.${delivery.status}`, delivery.status.replace(/_/g, " "))}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {uploading ? (
            <><Wifi className="h-3.5 w-3.5 text-primary animate-pulse" /> {t("driverNavigatePage.statusIndicator.sending")}</>
          ) : gps.status === "active" ? (
            <><Wifi className="h-3.5 w-3.5 text-green-500" /> {t("driverNavigatePage.statusIndicator.active")}</>
          ) : (
            <><WifiOff className="h-3.5 w-3.5" /> {t("driverNavigatePage.statusIndicator.inactive")}</>
          )}
        </div>
      </div>

      {/* GPS error */}
      {gps.status === "denied" && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm shrink-0">
          <AlertCircle className="h-4 w-4 text-destructive inline mr-2" />
          {t("driverNavigatePage.gpsDenied", { reason: gps.reason })}
        </div>
      )}

      {/* Progress steps */}
      {delivery && (
        <div className="flex items-center gap-1 shrink-0 overflow-x-auto pb-1">
          {STATUS_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-1 shrink-0">
              <div className={cn(
                "text-[10px] px-2 py-1 rounded-full font-medium transition-colors",
                i < currentStepIdx ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                i === currentStepIdx ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground",
              )}>
                {t(`driverNavigatePage.steps.${step}`, step.replace(/_/g, " "))}
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={cn("h-px w-4 shrink-0", i < currentStepIdx ? "bg-green-400" : "bg-border")} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <Card className="flex-1 overflow-hidden min-h-0">
        <CardContent className="p-0 h-full">
          <YandexMap
            markers={markers}
            route={route}
            center={pos ?? destLatLng ?? settings.defaultCenter}
            zoom={14}
            traffic={settings.trafficLayer}
            onRouteInfo={setInfo}
            autoCenter={true}
            className="h-full w-full"
          />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 shrink-0">
        <StatCard
          icon={<Navigation className="h-4 w-4" />}
          label={t("driverNavigatePage.stats.distance")}
          value={info ? `${info.distanceKm} ${settings.units}` : "—"}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label={t("driverNavigatePage.stats.eta")}
          value={info ? t("driverNavigatePage.stats.minutes", { count: info.durationMin }) : "—"}
        />
        <StatCard
          icon={<Gauge className="h-4 w-4" />}
          label={t("driverNavigatePage.stats.speed")}
          value={
            gps.status === "active" && gps.coords.speedKmh
              ? t("driverNavigatePage.stats.speedUnit", { speed: Math.round(gps.coords.speedKmh) })
              : "—"
          }
        />
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2 shrink-0">
        <Button
          variant="outline"
          onClick={() => setStatus("PICKED_UP")}
          disabled={delivery?.status === "PICKED_UP" || delivery?.status === "IN_TRANSIT"}
          className="gap-1.5 text-xs"
        >
          <MapPin className="h-3.5 w-3.5" /> {t("driverNavigatePage.actions.pickedUp")}
        </Button>
        <Button
          variant="outline"
          onClick={() => setStatus("IN_TRANSIT")}
          disabled={delivery?.status === "IN_TRANSIT"}
          className="gap-1.5 text-xs"
        >
          <Navigation className="h-3.5 w-3.5" /> {t("driverNavigatePage.actions.inTransit")}
        </Button>
        <Button
          onClick={() => setStatus("DELIVERED")}
          disabled={delivery?.status === "DELIVERED"}
          className="gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white"
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> {t("driverNavigatePage.actions.delivered")}
        </Button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}