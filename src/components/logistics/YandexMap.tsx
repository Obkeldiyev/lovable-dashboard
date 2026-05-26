import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, AlertCircle, Loader2, Navigation2 } from "lucide-react";

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
    s.src = `https://api-maps.yandex.ru/2.1/?lang=en_US${apikey}&load=package.full`;
    s.async = true;
    s.onload = () => {
      if (window.ymaps?.ready) {
        window.ymaps.ready(() => resolve(window.ymaps));
      } else {
        reject(new Error("ymaps not available after load"));
      }
    };
    s.onerror = () => reject(new Error("Failed to load Yandex Maps API"));
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
  /** If true, shows a pulsing animation (live driver) */
  live?: boolean;
};

export type MapRoute = {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  /** Optional waypoints */
  waypoints?: Array<{ lat: number; lng: number }>;
};

type Props = {
  markers?: MapMarker[];
  route?: MapRoute | null;
  center?: { lat: number; lng: number };
  zoom?: number;
  traffic?: boolean;
  onRouteInfo?: (info: { distanceKm: number; durationMin: number }) => void;
  onMarkerClick?: (id: string) => void;
  className?: string;
  /** If true, auto-pans to first live marker when markers change */
  autoCenter?: boolean;
};

const DEFAULT_CENTER = { lat: 41.3111, lng: 69.2797 };

export function YandexMap({
  markers = [],
  route,
  center,
  zoom = 12,
  traffic = true,
  onRouteInfo,
  onMarkerClick,
  className,
  autoCenter = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const placemarksRef = useRef<Map<string, any>>(new Map());
  const routeRef = useRef<any>(null);
  const trafficRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!KEY) { setLoading(false); return; }
    let cancelled = false;

    loadYmaps()
      .then((ymaps) => {
        if (cancelled || !containerRef.current) return;
        const c = center ?? DEFAULT_CENTER;
        const map = new ymaps.Map(
          containerRef.current,
          {
            center: [c.lat, c.lng],
            zoom,
            controls: ["zoomControl", "geolocationControl", "fullscreenControl", "routeButtonControl"],
          },
          {
            suppressMapOpenBlock: true,
            yandexMapDisablePoiInteractivity: false,
          },
        );
        mapRef.current = map;

        // Traffic layer
        if (traffic) {
          const trafficControl = new ymaps.control.TrafficControl({ shown: true });
          map.controls.add(trafficControl);
          trafficRef.current = trafficControl;
        }

        setReady(true);
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      try { mapRef.current?.destroy(); } catch {}
      mapRef.current = null;
      placemarksRef.current.clear();
      routeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update traffic layer when prop changes
  useEffect(() => {
    if (!ready || !mapRef.current || !window.ymaps) return;
    if (traffic && !trafficRef.current) {
      const trafficControl = new window.ymaps.control.TrafficControl({ shown: true });
      mapRef.current.controls.add(trafficControl);
      trafficRef.current = trafficControl;
    } else if (!traffic && trafficRef.current) {
      mapRef.current.controls.remove(trafficRef.current);
      trafficRef.current = null;
    }
  }, [traffic, ready]);

  // Update markers when they change
  useEffect(() => {
    const map = mapRef.current;
    const ymaps = window.ymaps;
    if (!map || !ymaps || !ready) return;

    const currentIds = new Set(markers.map((m) => m.id));

    // Remove stale markers
    placemarksRef.current.forEach((pm, id) => {
      if (!currentIds.has(id)) {
        map.geoObjects.remove(pm);
        placemarksRef.current.delete(id);
      }
    });

    // Add or update markers
    markers.forEach((m) => {
      const existing = placemarksRef.current.get(m.id);
      if (existing) {
        // Smooth position update
        existing.geometry.setCoordinates([m.lat, m.lng]);
        existing.properties.set("iconCaption", m.label ?? "");
        existing.options.set("iconColor", m.color ?? "#3b82f6");
      } else {
        const pm = new ymaps.Placemark(
          [m.lat, m.lng],
          {
            iconCaption: m.label ?? "",
            balloonContent: `<b>${m.label ?? m.id}</b>`,
          },
          {
            preset: m.live ? "islands#circleStretchyIcon" : "islands#circleIcon",
            iconColor: m.color ?? "#3b82f6",
            iconCaptionMaxWidth: "120",
          },
        );

        if (onMarkerClick) {
          pm.events.add("click", () => onMarkerClick(m.id));
        }

        map.geoObjects.add(pm);
        placemarksRef.current.set(m.id, pm);
      }
    });

    // Auto-center on first live marker
    if (autoCenter) {
      const liveMarker = markers.find((m) => m.live) ?? markers[0];
      if (liveMarker) {
        map.panTo([liveMarker.lat, liveMarker.lng], { flying: true, duration: 600 });
      }
    }
  }, [markers, ready, autoCenter, onMarkerClick]);

  // Build/update route
  const buildRoute = useCallback(async () => {
    const map = mapRef.current;
    const ymaps = window.ymaps;
    if (!map || !ymaps || !ready) return;

    // Remove old route
    if (routeRef.current) {
      map.geoObjects.remove(routeRef.current);
      routeRef.current = null;
    }

    if (!route) return;

    const points: [number, number][] = [
      [route.from.lat, route.from.lng],
      ...(route.waypoints?.map((w) => [w.lat, w.lng] as [number, number]) ?? []),
      [route.to.lat, route.to.lng],
    ];

    try {
      const r = await ymaps.route(points, {
        mapStateAutoApply: false,
        routingMode: "auto",
        avoidTrafficJams: true,
      });

      r.options.set({
        strokeColor: "1d4ed8",
        strokeWidth: 5,
        opacity: 0.88,
        strokeStyle: "solid",
      });

      // Style waypoint icons
      const ways = r.getWays();
      ways.each((way: any) => {
        way.getViaPoints().each((vp: any) => {
          vp.options.set({ preset: "islands#blueCircleIcon" });
        });
      });

      map.geoObjects.add(r);
      routeRef.current = r;

      // Report distance and duration
      const distM = r.getLength?.() ?? 0;
      const durS = r.getJamsTime?.() ?? r.getTime?.() ?? 0;
      onRouteInfo?.({
        distanceKm: Math.round(distM / 100) / 10,
        durationMin: Math.round(durS / 60),
      });
    } catch {
      // Route calculation failed silently — map still shows markers
    }
  }, [route, ready, onRouteInfo]);

  useEffect(() => {
    buildRoute();
  }, [buildRoute]);

  // Update center when prop changes
  useEffect(() => {
    if (!mapRef.current || !center || !ready) return;
    mapRef.current.panTo([center.lat, center.lng], { flying: false, duration: 400 });
  }, [center?.lat, center?.lng, ready]);

  // ── No API key — show setup instructions ──
  if (!KEY) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center",
          className ?? "",
        )}
      >
        <div className="h-14 w-14 rounded-full bg-muted/50 grid place-items-center">
          <MapPin className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Map not configured</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Add your Yandex Maps API key to enable real-time maps and routing.
          </p>
        </div>
        <div className="rounded-lg bg-muted/60 border border-border px-4 py-3 text-left text-xs font-mono space-y-1 w-full max-w-xs">
          <p className="text-muted-foreground"># In lovable-dashboard/.env</p>
          <p className="text-primary">VITE_YANDEX_MAPS_KEY=your_key_here</p>
          <p className="text-muted-foreground mt-1"># In vms-core/.env</p>
          <p className="text-primary">YANDEX_MAPS_API_KEY=your_key_here</p>
          <p className="text-primary">ROUTE_PROVIDER=YANDEX</p>
        </div>
        {markers.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Navigation2 className="h-3.5 w-3.5" />
            {markers.length} marker{markers.length !== 1 ? "s" : ""} ready to display
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center",
          className ?? "",
        )}
      >
        <AlertCircle className="h-8 w-8 text-destructive/60" />
        <div>
          <p className="text-sm font-semibold text-destructive">Map failed to load</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            window.__ymapsLoading = undefined;
          }}
          className="text-xs text-primary underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={cn("relative yandex-map-container", className ?? "h-full w-full")}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 rounded-xl">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Loading map…</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
