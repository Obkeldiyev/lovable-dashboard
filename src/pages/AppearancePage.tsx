import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { PRESETS, useTheme, type PresetId, type ThemeTokens } from "@/components/theme/ThemeProvider";

const COLOR_KEYS: { key: keyof ThemeTokens; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "foreground", label: "Foreground" },
  { key: "muted", label: "Muted" },
  { key: "border", label: "Border" },
];

function hslToHex(hsl: string): string {
  const m = hsl.match(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  if (!m) return "#000000";
  const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function AppearancePage() {
  const { mode, preset, custom, setPreset, setCustom, toggleMode } = useTheme();
  useEffect(() => { document.title = "Appearance · VMS"; }, []);

  const base = PRESETS[preset][mode];
  const tokens: ThemeTokens = { ...base, ...(custom ?? {}) };

  function update(k: keyof ThemeTokens, v: string) {
    setCustom({ ...(custom ?? {}), [k]: v });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Appearance</h2>
        <p className="text-sm text-muted-foreground">Pick a preset or customize every color.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mode</CardTitle>
          <CardDescription>Animated from the toggle button.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              toggleMode(r.left + r.width / 2, r.top + r.height / 2);
            }}
          >
            Switch to {mode === "dark" ? "light" : "dark"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Presets</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(PRESETS) as PresetId[]).map((id) => {
            const p = PRESETS[id][mode];
            const active = id === preset;
            return (
              <button
                key={id}
                onClick={() => { setCustom(null); setPreset(id); }}
                className={`group rounded-lg border p-3 text-left transition-all hover:shadow-md ${
                  active ? "border-primary ring-2 ring-primary/40" : "border-border"
                }`}
              >
                <div className="text-sm font-medium mb-2">{PRESETS[id].label}</div>
                <div className="flex gap-1">
                  {[p.primary, p.accent, p.background, p.foreground].map((c, i) => (
                    <span key={i} className="h-5 w-5 rounded-full border border-border"
                      style={{ background: `hsl(${c})` }} />
                  ))}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custom colors</CardTitle>
          <CardDescription>Override individual tokens. Saved per browser.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          {COLOR_KEYS.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={hslToHex(tokens[key] as string)}
                  onChange={(e) => update(key, hexToHsl(e.target.value))}
                  className="h-9 w-12 rounded border border-border bg-transparent"
                />
                <code className="text-[11px] text-muted-foreground">{tokens[key]}</code>
              </div>
            </div>
          ))}
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Radius ({tokens.radius}rem)</Label>
            <Slider
              value={[parseFloat(tokens.radius)]}
              min={0} max={1.5} step={0.05}
              onValueChange={(v) => update("radius", String(v[0]))}
            />
          </div>
          <Button variant="outline" size="sm" className="w-fit" onClick={() => setCustom(null)}>
            Reset overrides
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
