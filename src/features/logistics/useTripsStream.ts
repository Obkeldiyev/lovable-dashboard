import { useEffect, useState, useRef } from "react";
import { useAppSelector } from "@/store";
import {
  deliveriesApi, tenantStreamUrl, deliveryStreamUrl,
  type Delivery, type LatLng,
} from "./api";

export function useDeliveriesStream() {
  const tenantId = useAppSelector((s) => s.auth.user?.tenantId);
  const [items, setItems] = useState<Delivery[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  const refresh = () => setRefreshKey((k) => k + 1);

  // Initial REST fetch
  useEffect(() => {
    let live = true;
    setLoading(true);
    deliveriesApi
      .list(tenantId ? { tenantId } : undefined)
      .then((d) => { if (live) setItems(d); })
      .catch(() => { if (live) setItems([]); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [tenantId, refreshKey]);

  // SSE subscription
  useEffect(() => {
    if (!tenantId) return;

    const es = new EventSource(tenantStreamUrl(tenantId));
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    // Generic message handler (fallback)
    es.onmessage = (ev) => handleEvent("message", ev.data);

    // Named event handlers — backend emits these
    const namedEvents = [
      "delivery.upsert",
      "delivery.location",
      "delivery.status",
      "delivery.remove",
      "dispatch.board",
      "dispatch.location",
      "connected",
    ];
    namedEvents.forEach((name) => {
      es.addEventListener(name, (ev: MessageEvent) => handleEvent(name, ev.data));
    });

    function handleEvent(eventName: string, rawData: string) {
      try {
        const m = JSON.parse(rawData);

        // Location update
        if (eventName === "delivery.location" || eventName === "dispatch.location") {
          const deliveryId = m.deliveryId;
          if (!deliveryId) return;
          setItems((prev) =>
            prev.map((d) =>
              d.id === deliveryId
                ? {
                    ...d,
                    trackingEvents: [
                      {
                        id: `live-${Date.now()}`,
                        eventType: "LOCATION",
                        lat: m.lat,
                        lng: m.lng,
                        latitude: m.lat,
                        longitude: m.lng,
                        createdAt: m.capturedAt ?? new Date().toISOString(),
                      },
                      ...(d.trackingEvents ?? []).slice(0, 19),
                    ],
                  }
                : d,
            ),
          );
          return;
        }

        // Status update
        if (eventName === "delivery.status") {
          const deliveryId = m.deliveryId ?? m.id;
          if (!deliveryId) return;
          setItems((prev) =>
            prev.map((d) => (d.id === deliveryId ? { ...d, status: m.status ?? d.status } : d)),
          );
          return;
        }

        // Remove
        if (eventName === "delivery.remove") {
          const id = m.deliveryId ?? m.id;
          if (id) setItems((prev) => prev.filter((d) => d.id !== id));
          return;
        }

        // Upsert / board update
        if (eventName === "delivery.upsert" || eventName === "dispatch.board") {
          const dd: Delivery = m.delivery ?? m;
          if (!dd?.id) return;
          setItems((prev) => {
            const idx = prev.findIndex((x) => x.id === dd.id);
            if (idx === -1) return [dd, ...prev];
            const next = [...prev];
            next[idx] = { ...next[idx], ...dd };
            return next;
          });
          return;
        }

        // connected event — ignore
        if (eventName === "connected") return;

        // Fallback: try to parse as any delivery event
        if (m?.id && m?.status) {
          setItems((prev) => {
            const idx = prev.findIndex((x) => x.id === m.id);
            if (idx === -1) return [m, ...prev];
            const next = [...prev];
            next[idx] = { ...next[idx], ...m };
            return next;
          });
        }
      } catch { /* ignore parse errors */ }
    }

    return () => {
      es.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [tenantId]);

  return { items, connected, loading, refresh };
}

export function useDeliveryStream(deliveryId: string | null | undefined) {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<Delivery["status"] | null>(null);

  useEffect(() => {
    if (!deliveryId) return;
    const es = new EventSource(deliveryStreamUrl(deliveryId));

    const handle = (ev: MessageEvent) => {
      try {
        const m = JSON.parse(ev.data);
        if (m.lat != null && m.lng != null) setLocation({ lat: m.lat, lng: m.lng });
        if (m.status) setStatus(m.status);
      } catch { /* ignore */ }
    };

    es.onmessage = handle;
    ["delivery.location", "delivery.status"].forEach((name) => {
      es.addEventListener(name, handle);
    });

    return () => es.close();
  }, [deliveryId]);

  return { location, status };
}
