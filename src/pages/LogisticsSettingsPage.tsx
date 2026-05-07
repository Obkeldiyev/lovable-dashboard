import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLogisticsSettings } from "@/features/logistics/settings";
import { Button } from "@/components/ui/button";
import { Locate } from "lucide-react";
import { toast } from "sonner";

export default function LogisticsSettingsPage() {
  const [s, setS] = useLogisticsSettings();
  const update = (p: Partial<typeof s>) => setS({ ...s, ...p });

  function detectLocation() {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        update({ defaultCenter: { lat: p.coords.latitude, lng: p.coords.longitude } });
        toast.success("Default map center updated");
      },
      (e) => toast.error(e.message),
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Logistics settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure GPS, map behavior and tracking preferences.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">GPS & tracking</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Row>
            <Label className="flex flex-col">
              <span>Enable GPS</span>
              <span className="text-xs text-muted-foreground">Required for drivers to receive routes and broadcast location.</span>
            </Label>
            <Switch checked={s.gpsEnabled} onCheckedChange={(v) => update({ gpsEnabled: v })} />
          </Row>
          <Row>
            <Label className="flex flex-col">
              <span>High accuracy mode</span>
              <span className="text-xs text-muted-foreground">Uses more battery but improves GPS fix.</span>
            </Label>
            <Switch checked={s.highAccuracy} onCheckedChange={(v) => update({ highAccuracy: v })} />
          </Row>
          <div>
            <Label className="text-sm">Location ping interval — every {s.pingIntervalSec}s</Label>
            <Slider
              className="mt-2"
              min={2} max={60} step={1}
              value={[s.pingIntervalSec]}
              onValueChange={([v]) => update({ pingIntervalSec: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Map</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Row>
            <Label>Show traffic layer</Label>
            <Switch checked={s.trafficLayer} onCheckedChange={(v) => update({ trafficLayer: v })} />
          </Row>
          <Row>
            <Label>Auto-center on driver</Label>
            <Switch checked={s.autoCenterOnDriver} onCheckedChange={(v) => update({ autoCenterOnDriver: v })} />
          </Row>
          <Row>
            <Label>Voice guidance</Label>
            <Switch checked={s.voiceGuidance} onCheckedChange={(v) => update({ voiceGuidance: v })} />
          </Row>
          <div>
            <Label className="text-sm">Default zoom — {s.defaultMapZoom}</Label>
            <Slider className="mt-2" min={4} max={18} step={1}
              value={[s.defaultMapZoom]} onValueChange={([v]) => update({ defaultMapZoom: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Default lat</Label>
              <Input type="number" step="0.0001" value={s.defaultCenter.lat}
                onChange={(e) => update({ defaultCenter: { ...s.defaultCenter, lat: Number(e.target.value) } })} />
            </div>
            <div>
              <Label className="text-xs">Default lng</Label>
              <Input type="number" step="0.0001" value={s.defaultCenter.lng}
                onChange={(e) => update({ defaultCenter: { ...s.defaultCenter, lng: Number(e.target.value) } })} />
            </div>
          </div>
          <Button variant="outline" onClick={detectLocation} className="gap-2">
            <Locate className="h-4 w-4" /> Use my current location
          </Button>
          <div>
            <Label className="text-xs">Units</Label>
            <Select value={s.units} onValueChange={(v: "km" | "mi") => update({ units: v })}>
              <SelectTrigger className="mt-1 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="km">Kilometers</SelectItem>
                <SelectItem value="mi">Miles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Refresh</CardTitle></CardHeader>
        <CardContent>
          <div>
            <Label className="text-sm">Auto-refresh deliveries every {s.autoRefreshSec}s</Label>
            <Slider className="mt-2" min={5} max={120} step={5}
              value={[s.autoRefreshSec]} onValueChange={([v]) => update({ autoRefreshSec: v })} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4">{children}</div>;
}
