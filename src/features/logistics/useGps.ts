import { useEffect, useRef, useState } from "react";

export type GpsState =
  | { status: "unknown" }
  | { status: "denied"; reason: string }
  | { status: "unsupported" }
  | { status: "active"; coords: { lat: number; lng: number; speedKmh?: number; accuracy?: number } };

type Options = { enabled: boolean; onUpdate?: (c: { lat: number; lng: number; speedKmh?: number }) => void };

export function useGps({ enabled, onUpdate }: Options) {
  const [state, setState] = useState<GpsState>({ status: "unknown" });
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!("geolocation" in navigator)) {
      setState({ status: "unsupported" });
      return;
    }
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => {
        const c = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          speedKmh: p.coords.speed != null ? Math.max(0, Math.round(p.coords.speed * 3.6)) : undefined,
          accuracy: p.coords.accuracy,
        };
        setState({ status: "active", coords: c });
        onUpdate?.(c);
      },
      (err) => setState({ status: "denied", reason: err.message }),
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 15000 },
    );
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    };
  }, [enabled, onUpdate]);

  return state;
}
