import { useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PanelLeft, Monitor, Palette, RotateCcw, Check,
  Bell, Globe, Eye, Zap, SlidersHorizontal, Layout,
  Rows3, Clock, DollarSign, Sun, Moon, ArrowRight, Smartphone,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  updatePreferences, resetPreferences, setNavMode,
  type NavMode, type UserPreferences,
} from "@/store/preferencesSlice";
import { PRESETS, useTheme, type PresetId, type ThemeTokens } from "@/components/theme/ThemeProvider";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { isNative, platform, scheduleLocalNotification } from "@/lib/native";

/* ── Color helpers ── */
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
  let h = 0, s = 0;
  const l = (max + min) / 2;
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

const COLOR_KEYS: { key: keyof ThemeTokens; label: string }[] = [
  { key: "primary",    label: "Primary" },
  { key: "accent",     label: "Accent" },
  { key: "background", label: "Background" },
  { key: "foreground", label: "Foreground" },
  { key: "muted",      label: "Muted" },
  { key: "border",     label: "Border" },
];

function Row({ label, description, children }: {
  label: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <div className="min-w-0">
        <p className="text-sm font-medium leading-none">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const prefs = useAppSelector((s) => s.preferences);
  const { mode, preset, custom, setPreset, setCustom, toggleMode } = useTheme();
  const { i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? (isNative ? "mobile" : "layout");

  useEffect(() => { document.title = "Settings · VMS"; }, []);

  const base = PRESETS[preset][mode];
  const tokens: ThemeTokens = { ...base, ...(custom ?? {}) };

  function updateColor(k: keyof ThemeTokens, v: string) {
    setCustom({ ...(custom ?? {}), [k]: v });
  }

  const syncToBackend = useCallback(async (p: UserPreferences) => {
    try { await api.put("/api/preferences/me", { settings: p }); } catch { /* silent */ }
  }, []);

  function handleUpdate(patch: Partial<UserPreferences>) {
    dispatch(updatePreferences(patch));
    syncToBackend({ ...prefs, ...patch });
  }

  function handleReset() {
    dispatch(resetPreferences());
    setCustom(null);
    toast.success("All settings reset to defaults");
  }

  // How many tabs to show
  const tabCount = isNative ? 5 : 4;

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your personal workspace preferences — saved automatically.
          {isNative && <span className="ml-1 text-primary font-medium">({platform})</span>}
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className={cn("grid w-full h-10", `grid-cols-${tabCount}`)}>
          {isNative && (
            <TabsTrigger value="mobile" className="gap-1 text-xs">
              <Smartphone className="h-3.5 w-3.5" />
              Mobile
            </TabsTrigger>
          )}
          <TabsTrigger value="layout"     className="gap-1 text-xs"><Layout          className="h-3.5 w-3.5" />Layout</TabsTrigger>
          <TabsTrigger value="display"    className="gap-1 text-xs"><Eye             className="h-3.5 w-3.5" />Display</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1 text-xs"><Palette         className="h-3.5 w-3.5" />Theme</TabsTrigger>
          <TabsTrigger value="regional"   className="gap-1 text-xs"><SlidersHorizontal className="h-3.5 w-3.5" />Regional</TabsTrigger>
        </TabsList>

        {/* ══ MOBILE TAB (native only) ══ */}
        {isNative && (
          <TabsContent value="mobile" className="space-y-4 animate-fade-in">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Smartphone className="h-4 w-4" /> Device Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Platform</span>
                  <Badge variant="secondary" className="capitalize">{platform}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">App version</span>
                  <span className="font-mono text-xs">1.0.0</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="h-4 w-4" /> Notifications
                </CardTitle>
                <CardDescription>Push and local notification settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row label="Push notifications" description="Receive alerts when the app is closed">
                  <Switch
                    checked={prefs.desktopNotifications}
                    onCheckedChange={async (v) => {
                      if (v) {
                        const { PushNotifications } = await import("@capacitor/push-notifications");
                        const perm = await PushNotifications.requestPermissions();
                        if (perm.receive !== "granted") {
                          toast.error("Notifications blocked — enable in device settings");
                          return;
                        }
                        await PushNotifications.register();
                      }
                      handleUpdate({ desktopNotifications: v });
                    }}
                  />
                </Row>
                <Separator />
                <Row label="Sound alerts" description="Play a sound for new notifications">
                  <Switch checked={prefs.soundAlerts} onCheckedChange={(v) => handleUpdate({ soundAlerts: v })} />
                </Row>
                <Separator />
                <div className="pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => scheduleLocalNotification({
                      id: 1,
                      title: "VMS Test",
                      body: "Notifications are working correctly!",
                    }).then(() => toast.success("Test notification sent"))}
                  >
                    <Bell className="h-3.5 w-3.5" /> Send test notification
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Haptic Feedback</CardTitle>
                <CardDescription>Vibration on button taps and actions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row label="Haptic feedback" description="Vibrate on interactions">
                  <Switch
                    checked={(prefs as any).hapticFeedback ?? true}
                    onCheckedChange={(v) => handleUpdate({ hapticFeedback: v } as any)}
                  />
                </Row>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Display</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row label="Keep screen on" description="Prevent screen from sleeping while app is open">
                  <Switch
                    checked={(prefs as any).keepScreenOn ?? false}
                    onCheckedChange={(v) => handleUpdate({ keepScreenOn: v } as any)}
                  />
                </Row>
                <Separator />
                <Row label="Reduce motion" description="Minimize animations (saves battery)">
                  <Switch
                    checked={!prefs.animationsEnabled}
                    onCheckedChange={(v) => handleUpdate({ animationsEnabled: !v })}
                  />
                </Row>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">GPS & Location</CardTitle>
                <CardDescription>
                  Configure GPS in <Link to="/settings/logistics" className="text-primary underline">Logistics Settings</Link>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild className="gap-2">
                  <Link to="/settings/logistics">
                    Logistics Settings <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ══ LAYOUT TAB ══ */}
        <TabsContent value="layout" className="space-y-4 animate-fade-in">
          {!isNative && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PanelLeft className="h-4 w-4" /> Navigation Style
                </CardTitle>
                <CardDescription>Choose how you move around the app.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {(["navbar", "sidebar"] as NavMode[]).map((nav) => (
                    <button
                      key={nav}
                      onClick={() => {
                        dispatch(setNavMode(nav));
                        syncToBackend({ ...prefs, navMode: nav });
                        toast.success(`Switched to ${nav}`);
                      }}
                      className={cn(
                        "relative rounded-xl border-2 p-4 text-left transition-all duration-200 hover:shadow-md",
                        prefs.navMode === nav ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40",
                      )}
                    >
                      {prefs.navMode === nav && (
                        <span className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary grid place-items-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </span>
                      )}
                      <div className="mb-3">
                        {nav === "navbar" ? <Monitor className="h-9 w-9 text-muted-foreground" /> : <PanelLeft className="h-9 w-9 text-muted-foreground" />}
                      </div>
                      <p className="font-semibold capitalize text-sm">{nav}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {nav === "navbar" ? "Horizontal top bar" : "Collapsible left sidebar"}
                      </p>
                    </button>
                  ))}
                </div>
                {prefs.navMode === "sidebar" && (
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-sm">Sidebar default state</Label>
                    <Select value={prefs.sidebarVariant} onValueChange={(v) => handleUpdate({ sidebarVariant: v as UserPreferences["sidebarVariant"] })}>
                      <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expanded">Expanded — labels visible</SelectItem>
                        <SelectItem value="icon">Icon only</SelectItem>
                        <SelectItem value="collapsed">Collapsed — hidden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Layout className="h-4 w-4" /> Dashboard Widgets</CardTitle>
              <CardDescription>Drag, resize, add or remove widgets.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild className="gap-2">
                <Link to="/dashboard">Customize Dashboard <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Logistics & Map</CardTitle>
              <CardDescription>GPS tracking, map zoom, traffic layer.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild className="gap-2">
                <Link to="/settings/logistics">Logistics Settings <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ DISPLAY TAB ══ */}
        <TabsContent value="display" className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Eye className="h-4 w-4" /> Interface</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row label="Compact mode" description="Tighter padding throughout">
                <Switch checked={prefs.compactMode} onCheckedChange={(v) => handleUpdate({ compactMode: v })} />
              </Row>
              <Separator />
              <Row label="Sticky header" description="Header stays visible while scrolling">
                <Switch checked={prefs.stickyHeader} onCheckedChange={(v) => handleUpdate({ stickyHeader: v })} />
              </Row>
              <Separator />
              <Row label="Show breadcrumbs" description="Navigation path in sidebar mode">
                <Switch checked={prefs.showBreadcrumbs} onCheckedChange={(v) => handleUpdate({ showBreadcrumbs: v })} />
              </Row>
              <Separator />
              <Row label="Quick actions" description="Hover buttons on table rows">
                <Switch checked={prefs.showQuickActions} onCheckedChange={(v) => handleUpdate({ showQuickActions: v })} />
              </Row>
              <Separator />
              <Row label="Animations" description="Page transitions and micro-animations">
                <Switch checked={prefs.animationsEnabled} onCheckedChange={(v) => handleUpdate({ animationsEnabled: v })} />
              </Row>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Rows3 className="h-4 w-4" /> Tables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Row size</Label>
                <div className="flex gap-2">
                  {(["sm", "md", "lg"] as const).map((size) => (
                    <Button key={size} size="sm" variant={prefs.tableRowSize === size ? "default" : "outline"} onClick={() => handleUpdate({ tableRowSize: size })} className="w-16">
                      {size.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm">Default page size — <strong>{prefs.defaultPageSize}</strong> rows</Label>
                <Slider min={10} max={100} step={5} value={[prefs.defaultPageSize]} onValueChange={([v]) => handleUpdate({ defaultPageSize: v })} className="max-w-xs" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Zap className="h-4 w-4" /> Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row label="Auto-refresh data" description="Refresh page data every 30s">
                <Switch checked={prefs.autoRefresh} onCheckedChange={(v) => handleUpdate({ autoRefresh: v })} />
              </Row>
              <Separator />
              <Row label="Reduce motion" description="Disable animations">
                <Switch checked={!prefs.animationsEnabled} onCheckedChange={(v) => handleUpdate({ animationsEnabled: !v })} />
              </Row>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ APPEARANCE TAB ══ */}
        <TabsContent value="appearance" className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Palette className="h-4 w-4" /> Color Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {(["light", "dark"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      if (mode !== m) toggleMode(r.left + r.width / 2, r.top + r.height / 2);
                    }}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200",
                      mode === m ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                    )}
                  >
                    {mode === m && (
                      <span className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary grid place-items-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </span>
                    )}
                    {m === "light" ? <Sun className="h-6 w-6 text-amber-500" /> : <Moon className="h-6 w-6 text-indigo-400" />}
                    <div>
                      <p className="font-semibold text-sm capitalize">{m}</p>
                      <p className="text-xs text-muted-foreground">{m === "light" ? "Bright & clean" : "Easy on the eyes"}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Color Presets</CardTitle>
              <CardDescription>Pick a built-in palette.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(PRESETS) as PresetId[]).map((id) => {
                  const p = PRESETS[id][mode];
                  const active = id === preset && !custom;
                  return (
                    <button
                      key={id}
                      onClick={() => { setCustom(null); setPreset(id); }}
                      className={cn(
                        "rounded-xl border-2 p-3 text-left transition-all duration-200 hover:shadow-md",
                        active ? "border-primary ring-2 ring-primary/20 shadow-sm" : "border-border hover:border-primary/40",
                      )}
                    >
                      <p className="text-sm font-semibold mb-2">{PRESETS[id].label}</p>
                      <div className="flex gap-1.5">
                        {[p.primary, p.accent, p.background, p.foreground].map((c, i) => (
                          <span key={i} className="h-5 w-5 rounded-full border border-black/10" style={{ background: `hsl(${c})` }} />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Custom Colors</CardTitle>
                  <CardDescription>Override individual color tokens.</CardDescription>
                </div>
                {custom && <Badge variant="secondary" className="text-xs">Custom active</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {COLOR_KEYS.map(({ key, label }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={hslToHex(tokens[key] as string)}
                        onChange={(e) => updateColor(key, hexToHsl(e.target.value))}
                        className="h-9 w-12 rounded-lg border border-border bg-transparent cursor-pointer p-0.5"
                      />
                      <code className="text-[11px] text-muted-foreground truncate">{tokens[key]}</code>
                    </div>
                  </div>
                ))}
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Border radius — <strong>{tokens.radius}rem</strong></Label>
                  <Slider value={[parseFloat(tokens.radius)]} min={0} max={1.5} step={0.05} onValueChange={(v) => updateColor("radius", String(v[0]))} className="max-w-xs" />
                </div>
              </div>
              {custom && (
                <Button variant="outline" size="sm" onClick={() => setCustom(null)} className="gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset to preset
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ REGIONAL TAB ══ */}
        <TabsContent value="regional" className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-4 w-4" /> Language</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label className="text-sm">Interface language</Label>
                <Select value={prefs.language} onValueChange={(v) => { handleUpdate({ language: v }); i18n.changeLanguage(v); }}>
                  <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                    <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                    <SelectItem value="uz">🇺🇿 O'zbek</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4" /> Date & Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Date format</Label>
                  <Select value={prefs.dateFormat} onValueChange={(v) => handleUpdate({ dateFormat: v as UserPreferences["dateFormat"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Time format</Label>
                  <Select value={prefs.timeFormat} onValueChange={(v) => handleUpdate({ timeFormat: v as UserPreferences["timeFormat"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24-hour (14:30)</SelectItem>
                      <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Timezone</Label>
                <Select value={prefs.timezone} onValueChange={(v) => handleUpdate({ timezone: v })}>
                  <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Asia/Tashkent">Asia/Tashkent (UTC+5)</SelectItem>
                    <SelectItem value="Europe/Moscow">Europe/Moscow (UTC+3)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai (UTC+4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><DollarSign className="h-4 w-4" /> Currency</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={prefs.currency} onValueChange={(v) => handleUpdate({ currency: v })}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">🇺🇸 USD — US Dollar</SelectItem>
                  <SelectItem value="UZS">🇺🇿 UZS — Uzbek Som</SelectItem>
                  <SelectItem value="RUB">🇷🇺 RUB — Russian Ruble</SelectItem>
                  <SelectItem value="EUR">🇪🇺 EUR — Euro</SelectItem>
                  <SelectItem value="GBP">🇬🇧 GBP — British Pound</SelectItem>
                  <SelectItem value="KZT">🇰🇿 KZT — Kazakhstani Tenge</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4" /> Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row label="Desktop notifications" description="Browser push notifications">
                <Switch
                  checked={prefs.desktopNotifications}
                  onCheckedChange={(v) => {
                    if (v && "Notification" in window) {
                      Notification.requestPermission().then((p) => {
                        if (p === "granted") handleUpdate({ desktopNotifications: true });
                        else toast.error("Notifications blocked in browser settings");
                      });
                    } else {
                      handleUpdate({ desktopNotifications: v });
                    }
                  }}
                />
              </Row>
              <Separator />
              <Row label="Sound alerts" description="Play a sound on new notifications">
                <Switch checked={prefs.soundAlerts} onCheckedChange={(v) => handleUpdate({ soundAlerts: v })} />
              </Row>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-destructive">
                <RotateCcw className="h-4 w-4" /> Reset All Settings
              </CardTitle>
              <CardDescription>Restore every setting to its default value.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" size="sm" onClick={handleReset}>Reset all settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
