import { useEffect, useState } from "react";
import {
  tripsApi,
  tripsStreamUrl,
  tripLocationStreamUrl,
  type Trip,
  type LatLng,
} from "./api";

export function useTripsStream() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    tripsApi
      .list()
      .then((d) => !cancelled && setTrips(d))
      .catch((e) => !cancelled && setError(e?.message ?? "Failed to load"));

    const es = new EventSource(tripsStreamUrl());
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as
          | { type: "upsert"; trip: Trip }
          | { type: "remove"; id: string }
          | { type: "location"; id: string; location: LatLng; etaMinutes?: number };
        setTrips((prev) => {
          if (msg.type === "remove") return prev.filter((t) => t.id !== msg.id);
          if (msg.type === "location") {
            return prev.map((t) =>
              t.id === msg.id
                ? { ...t, currentLocation: msg.location, etaMinutes: msg.etaMinutes ?? t.etaMinutes }
                : t,
            );
          }
          const i = prev.findIndex((t) => t.id === msg.trip.id);
          if (i === -1) return [msg.trip, ...prev];
          const next = prev.slice();
          next[i] = { ...next[i], ...msg.trip };
          return next;
        });
      } catch {}
    };
    return () => {
      cancelled = true;
      es.close();
    };
  }, []);

  return { trips, connected, error };
}

export function useTripLocationStream(tripId: string | null | undefined) {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [etaMinutes, setEta] = useState<number | undefined>();

  useEffect(() => {
    if (!tripId) return;
    const es = new EventSource(tripLocationStreamUrl(tripId));
    es.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data) as { location: LatLng; etaMinutes?: number };
        setLocation(m.location);
        if (m.etaMinutes != null) setEta(m.etaMinutes);
      } catch {}
    };
    return () => es.close();
  }, [tripId]);

  return { location, etaMinutes };
}
