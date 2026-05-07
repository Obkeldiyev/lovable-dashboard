import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    ymaps?: any;
    __ymapsLoading?: Promise<any>;
  }
}

const KEY = (import.meta.env.VITE_YANDEX_MAPS_KEY as string | undefined) ?? "";

function loadYmaps(): Promise<any> {
  if (window.ymaps?.Map) return Promise.resolve(window.ymaps);
  if (window.__ymapsLoading) return window.__ymapsLoading;
  window.__ymapsLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    const apikey = KEY ? `&apikey=${KEY}` : "";
    s.src = `https://api-maps.yandex.ru/2.1/?lang=en_US${apikey}`;
    s.async = true;
    s.onload = () => window.ymaps.ready(() => resolve(window.ymaps));
    s.onerror = () => reject(new Error("Failed to load Yandex Maps"));
    document.head.appendChild(s);
  });
  return window.__ymapsLoading;
}

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
};

export type MapRoute = {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
};

type Props = {
  markers?: MapMarker[];
  route?: MapRoute | null;
  center?: { lat: number; lng: number };
  zoom?: number;
  onRouteInfo?: (info: { distanceKm: number; durationMin: number }) => void;
  className?: string;
};

export function YandexMap({
  markers = [],
  route,
  center,
  zoom = 11,
  onRouteInfo,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const placemarksRef = useRef<any[]>([]);
  const routeRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadYmaps()
      .then((ymaps) => {
        if (cancelled || !ref.current) return;
        const c =
          center ??
          (markers[0]
            ? { lat: markers[0].lat, lng: markers[0].lng }
            : { lat: 41.3111, lng: 69.2797 });
        mapRef.current = new ymaps.Map(ref.current, {
          center: [c.lat, c.lng],
          zoom,
          controls: ["zoomControl", "geolocationControl", "trafficControl"],
        });
      })
      .catch((e) => setError(e.message));
    return () => {
      cancelled = true;
      try {
        mapRef.current?.destroy();
      } catch {}
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const ymaps = window.ymaps;
    if (!map || !ymaps) return;
    placemarksRef.current.forEach((p) => map.geoObjects.remove(p));
    placemarksRef.current = markers.map((m) => {
      const pm = new ymaps.Placemark(
        [m.lat, m.lng],
        { iconCaption: m.label ?? "" },
        {
          preset: "islands#circleIcon",
          iconColor: m.color ?? "hsl(var(--primary))",
        },
      );
      map.geoObjects.add(pm);
      return pm;
    });
  }, [markers]);

  useEffect(() => {
    const map = mapRef.current;
    const ymaps = window.ymaps;
    if (!map || !ymaps) return;
    if (routeRef.current) {
      map.geoObjects.remove(routeRef.current);
      routeRef.current = null;
    }
    if (!route) return;
    ymaps
      .route(
        [
          [route.from.lat, route.from.lng],
          [route.to.lat, route.to.lng],
        ],
        { mapStateAutoApply: true },
      )
      .then((r: any) => {
        routeRef.current = r;
        r.options.set({ strokeColor: "1d4ed8", strokeWidth: 5, opacity: 0.85 });
        map.geoObjects.add(r);
        const distM = r.getLength?.() ?? 0;
        const durS = r.getJamsTime?.() ?? r.getTime?.() ?? 0;
        onRouteInfo?.({
          distanceKm: Math.round(distM / 100) / 10,
          durationMin: Math.round(durS / 60),
        });
      });
  }, [route, onRouteInfo]);

  if (!KEY) {
    return (
      <div
        className={
          "rounded-lg border border-dashed p-6 text-sm text-muted-foreground " +
          (className ?? "")
        }
      >
        Set <code>VITE_YANDEX_MAPS_KEY</code> in your <code>.env</code> to
        enable the map.
      </div>
    );
  }
  if (error) return <div className="text-destructive text-sm">{error}</div>;
  return <div ref={ref} className={className ?? "h-full w-full rounded-lg"} />;
}
