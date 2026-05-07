import { useEffect, useState } from "react";

export type LogisticsSettings = {
  gpsEnabled: boolean;
  pingIntervalSec: number;       // throttle uploads
  highAccuracy: boolean;
  trafficLayer: boolean;
  autoCenterOnDriver: boolean;
  autoRefreshSec: number;
  defaultMapZoom: number;
  defaultCenter: { lat: number; lng: number };
  voiceGuidance: boolean;
  units: "km" | "mi";
};

const KEY = "vms.logistics.settings";

const defaults: LogisticsSettings = {
  gpsEnabled: false,
  pingIntervalSec: 5,
  highAccuracy: true,
  trafficLayer: true,
  autoCenterOnDriver: true,
  autoRefreshSec: 15,
  defaultMapZoom: 11,
  defaultCenter: { lat: 41.3111, lng: 69.2797 },
  voiceGuidance: false,
  units: "km",
};

export function getLogisticsSettings(): LogisticsSettings {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return defaults;
  }
}

export function useLogisticsSettings() {
  const [s, setS] = useState<LogisticsSettings>(getLogisticsSettings);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent("vms-logistics-settings", { detail: s }));
  }, [s]);
  useEffect(() => {
    const h = (e: Event) => setS((e as CustomEvent).detail);
    window.addEventListener("vms-logistics-settings", h);
    return () => window.removeEventListener("vms-logistics-settings", h);
  }, []);
  return [s, setS] as const;
}
