import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLogisticsSettings } from "@/features/logistics/settings";
import { Button } from "@/components/ui/button";
import { Locate } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function LogisticsSettingsPage() {
  const { t } = useTranslation();
  const [s, setS] = useLogisticsSettings();
  const update = (p: Partial<typeof s>) => setS({ ...s, ...p });

  function detectLocation() {
    if (!navigator.geolocation)
      return toast.error(t("logisticsSettings.toast.geoNotSupported"));
    navigator.geolocation.getCurrentPosition(
      (p) => {
        update({
          defaultCenter: { lat: p.coords.latitude, lng: p.coords.longitude },
        });
        toast.success(t("logisticsSettings.toast.locationUpdated"));
      },
      (e) => toast.error(e.message),
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("logisticsSettings.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("logisticsSettings.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("logisticsSettings.gpsAndTracking")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row>
            <Label className="flex flex-col">
              <span>{t("logisticsSettings.enableGps")}</span>
              <span className="text-xs text-muted-foreground">
                {t("logisticsSettings.enableGpsDesc")}
              </span>
            </Label>
            <Switch
              checked={s.gpsEnabled}
              onCheckedChange={(v) => update({ gpsEnabled: v })}
            />
          </Row>
          <Row>
            <Label className="flex flex-col">
              <span>{t("logisticsSettings.highAccuracy")}</span>
              <span className="text-xs text-muted-foreground">
                {t("logisticsSettings.highAccuracyDesc")}
              </span>
            </Label>
            <Switch
              checked={s.highAccuracy}
              onCheckedChange={(v) => update({ highAccuracy: v })}
            />
          </Row>
          <div>
            <Label className="text-sm">
              {t("logisticsSettings.pingInterval", { sec: s.pingIntervalSec })}
            </Label>
            <Slider
              className="mt-2"
              min={2}
              max={60}
              step={1}
              value={[s.pingIntervalSec]}
              onValueChange={([v]) => update({ pingIntervalSec: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("logisticsSettings.map")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row>
            <Label>{t("logisticsSettings.showTrafficLayer")}</Label>
            <Switch
              checked={s.trafficLayer}
              onCheckedChange={(v) => update({ trafficLayer: v })}
            />
          </Row>
          <Row>
            <Label>{t("logisticsSettings.autoCenterOnDriver")}</Label>
            <Switch
              checked={s.autoCenterOnDriver}
              onCheckedChange={(v) => update({ autoCenterOnDriver: v })}
            />
          </Row>
          <Row>
            <Label>{t("logisticsSettings.voiceGuidance")}</Label>
            <Switch
              checked={s.voiceGuidance}
              onCheckedChange={(v) => update({ voiceGuidance: v })}
            />
          </Row>
          <div>
            <Label className="text-sm">
              {t("logisticsSettings.defaultZoom", { zoom: s.defaultMapZoom })}
            </Label>
            <Slider
              className="mt-2"
              min={4}
              max={18}
              step={1}
              value={[s.defaultMapZoom]}
              onValueChange={([v]) => update({ defaultMapZoom: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">
                {t("logisticsSettings.defaultLat")}
              </Label>
              <Input
                type="number"
                step="0.0001"
                value={s.defaultCenter.lat}
                onChange={(e) =>
                  update({
                    defaultCenter: {
                      ...s.defaultCenter,
                      lat: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div>
              <Label className="text-xs">
                {t("logisticsSettings.defaultLng")}
              </Label>
              <Input
                type="number"
                step="0.0001"
                value={s.defaultCenter.lng}
                onChange={(e) =>
                  update({
                    defaultCenter: {
                      ...s.defaultCenter,
                      lng: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
          <Button variant="outline" onClick={detectLocation} className="gap-2">
            <Locate className="h-4 w-4" />{" "}
            {t("logisticsSettings.useCurrentLocation")}
          </Button>
          <div>
            <Label className="text-xs">{t("logisticsSettings.units")}</Label>
            <Select
              value={s.units}
              onValueChange={(v: "km" | "mi") => update({ units: v })}
            >
              <SelectTrigger className="mt-1 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="km">
                  {t("logisticsSettings.kilometers")}
                </SelectItem>
                <SelectItem value="mi">
                  {t("logisticsSettings.miles")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("logisticsSettings.refresh")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label className="text-sm">
              {t("logisticsSettings.autoRefresh", { sec: s.autoRefreshSec })}
            </Label>
            <Slider
              className="mt-2"
              min={5}
              max={120}
              step={5}
              value={[s.autoRefreshSec]}
              onValueChange={([v]) => update({ autoRefreshSec: v })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">{children}</div>
  );
}
