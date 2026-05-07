import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { tripsApi, type Trip, type LatLng } from "@/features/logistics/api";
import { YandexMap, type MapMarker } from "@/components/logistics/YandexMap";
import { ArrowLeft, Navigation, CheckCircle2, Truck } from "lucide-react";
import { toast } from "sonner";

export default function DriverNavigatePage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [pos, setPos] = useState<LatLng | null>(null);
  const [info, setInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;
    tripsApi.get(id).then(setTrip).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id || !navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => {
        const loc = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(loc);
        tripsApi.pushLocation(id, loc).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [id]);

  async function setStatus(s: Trip["status"]) {
    if (!id) return;
    try {
      const t = await tripsApi.updateStatus(id, s);
      setTrip(t);
      toast.success(`Marked ${s.replace("_", " ")}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update");
    }
  }

  const route =
    trip?.destination && (pos ?? trip.origin)
      ? { from: pos ?? trip.origin!, to: trip.destination }
      : null;

  const markers: MapMarker[] = [];
  if (pos) markers.push({ id: "me", lat: pos.lat, lng: pos.lng, label: "You", color: "#1d4ed8" });
  if (trip?.destination)
    markers.push({
      id: "dest",
      lat: trip.destination.lat,
      lng: trip.destination.lng,
      label: "Drop-off",
      color: "#ef4444",
    });

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/driver"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <div className="text-sm font-medium flex items-center gap-2">
          <Truck className="h-4 w-4" />
          {trip?.number ?? trip?.id?.slice(0, 8) ?? "Trip"}
        </div>
      </div>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <YandexMap
            markers={markers}
            route={route}
            center={pos ?? trip?.origin ?? undefined}
            zoom={13}
            onRouteInfo={setInfo}
            className="h-full w-full"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground">Distance</div>
          <div className="text-lg font-semibold">
            {info ? `${info.distanceKm} km` : "—"}
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground">ETA</div>
          <div className="text-lg font-semibold">
            {info ? `${info.durationMin} min` : "—"}
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground">Status</div>
          <div className="text-lg font-semibold capitalize">{trip?.status ?? "—"}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          className="gap-2"
          onClick={() => setStatus("in_progress")}
        >
          <Navigation className="h-4 w-4" /> Picked up
        </Button>
        <Button className="gap-2" onClick={() => setStatus("delivered")}>
          <CheckCircle2 className="h-4 w-4" /> Delivered
        </Button>
      </div>
    </div>
  );
}
