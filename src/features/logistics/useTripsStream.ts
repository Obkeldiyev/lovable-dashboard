import { useEffect, useState } from "react";
import { useAppSelector } from "@/store";
import {
  deliveriesApi, tenantStreamUrl, deliveryStreamUrl,
  type Delivery, type LatLng,
} from "./api";

type LiveEvent =
  | { type: "delivery.upsert" | "upsert"; delivery: Delivery }
  | { type: "delivery.location" | "location"; deliveryId: string; lat: number; lng: number; speedKmh?: number }
  | { type: "delivery.status"; deliveryId: string; status: Delivery["status"] }
  | { type: "delivery.remove" | "remove"; deliveryId?: string; id?: string };

export function useDeliveriesStream() {
  const tenantId = useAppSelector((s) => s.auth.user?.tenantId);
  const [items, setItems] = useState<Delivery[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    deliveriesApi
      .list(tenantId ? { tenantId } : undefined)
      .then((d) => !cancel && setItems(d))
      .catch(() => !cancel && setItems([]))
      .finally(() => !cancel && setLoading(false));
    if (!tenantId) return;
    const es = new EventSource(tenantStreamUrl(tenantId));
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data) as LiveEvent;
        setItems((prev) => {
          const t = m.type;
          if (t === "delivery.remove" || t === "remove") {
            const id = (m as any).deliveryId ?? (m as any).id;
            return prev.filter((x) => x.id !== id);
          }
          if (t === "delivery.location" || t === "location") {
            const mm = m as any;
            return prev.map((d) =>
              d.id === mm.deliveryId
                ? {
                    ...d,
                    trackingEvents: [
                      { id: "live", eventType: "LOCATION", latitude: mm.lat, longitude: mm.lng, createdAt: new Date().toISOString() },
                      ...(d.trackingEvents ?? []).slice(0, 19),
                    ],
                  }
                : d,
            );
          }
          if (t === "delivery.status") {
            const mm = m as any;
            return prev.map((d) => (d.id === mm.deliveryId ? { ...d, status: mm.status } : d));
          }
          // upsert
          const mm = m as any;
          const dd: Delivery = mm.delivery ?? mm;
          if (!dd?.id) return prev;
          const idx = prev.findIndex((x) => x.id === dd.id);
          if (idx === -1) return [dd, ...prev];
          const next = prev.slice();
          next[idx] = { ...next[idx], ...dd };
          return next;
        });
      } catch {}
    };
    return () => es.close();
  }, [tenantId]);

  return { items, connected, loading };
}

export function useDeliveryStream(deliveryId: string | null | undefined) {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<Delivery["status"] | null>(null);

  useEffect(() => {
    if (!deliveryId) return;
    const es = new EventSource(deliveryStreamUrl(deliveryId));
    es.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data);
        if (m.lat != null && m.lng != null) setLocation({ lat: m.lat, lng: m.lng });
        if (m.status) setStatus(m.status);
      } catch {}
    };
    return () => es.close();
  }, [deliveryId]);

  return { location, status };
}
