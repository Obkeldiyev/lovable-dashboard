import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PanelLeft,
  Monitor,
  Palette,
  RotateCcw,
  Check,
  Bell,
  Globe,
  Eye,
  Zap,
  SlidersHorizontal,
  Layout,
  Rows3,
  Clock,
  DollarSign,
  Sun,
  Moon,
  ArrowRight,
  Smartphone,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  updatePreferences,
  resetPreferences,
  setNavMode,
  type NavMode,
  type UserPreferences,
} from "@/store/preferencesSlice";
import {
  PRESETS,
  useTheme,
  type PresetId,
  type ThemeTokens,
} from "@/components/theme/ThemeProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { isNative, platform, scheduleLocalNotification } from "@/lib/native";

/* ── Color helpers ── */
function hslToHex(hsl: string): string {
  const m = hsl.match(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  if (!m) return "#000000";
  const h = +m[1] / 360,
    s = +m[2] / 100,
    l = +m[3] / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const COLOR_KEYS: { key: keyof ThemeTokens; labelKey: string }[] = [
  { key: "primary", labelKey: "settings.appearance.colorKeys.primary" },
  { key: "accent", labelKey: "settings.appearance.colorKeys.accent" },
  { key: "background", labelKey: "settings.appearance.colorKeys.background" },
  { key: "foreground", labelKey: "settings.appearance.colorKeys.foreground" },
  { key: "muted", labelKey: "settings.appearance.colorKeys.muted" },
  { key: "border", labelKey: "settings.appearance.colorKeys.border" },
];

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <div className="min-w-0">
        <p className="text-sm font-medium leading-none">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const prefs = useAppSelector((s) => s.preferences);
  const { mode, preset, custom, setPreset, setCustom, toggleMode } = useTheme();
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const defaultTab =
    searchParams.get("tab") ?? (isNative ? "mobile" : "layout");

  useEffect(() => {
    document.title = "Settings · VMS";
  }, []);

  const base = PRESETS[preset][mode];
  const tokens: ThemeTokens = { ...base, ...(custom ?? {}) };

  function updateColor(k: keyof ThemeTokens, v: string) {
    setCustom({ ...(custom ?? {}), [k]: v });
  }

  function handleUpdate(patch: Partial<UserPreferences>) {
    dispatch(updatePreferences(patch));
  }

  function handleReset() {
    dispatch(resetPreferences());
    setCustom(null);
    toast.success(t("settings.resetSuccess"));
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t("settings.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("settings.subtitle")}
          {isNative && (
            <span className="ml-1 text-primary font-medium">({platform})</span>
          )}
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList
          className={cn(
            "grid w-full h-10",
            isNative ? "grid-cols-5" : "grid-cols-4",
          )}
        >
          {isNative && (
            <TabsTrigger value="mobile" className="gap-1 text-xs">
              <Smartphone className="h-3.5 w-3.5" />
              {t("settings.tabs.mobile")}
            </TabsTrigger>
          )}
          <TabsTrigger value="layout" className="gap-1 text-xs">
            <Layout className="h-3.5 w-3.5" />
            {t("settings.tabs.layout")}
          </TabsTrigger>
          <TabsTrigger value="display" className="gap-1 text-xs">
            <Eye className="h-3.5 w-3.5" />
            {t("settings.tabs.display")}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1 text-xs">
            <Palette className="h-3.5 w-3.5" />
            {t("settings.tabs.appearance")}
          </TabsTrigger>
          <TabsTrigger value="regional" className="gap-1 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {t("settings.tabs.regional")}
          </TabsTrigger>
        </TabsList>

        {/* ══ MOBILE TAB (native only) ══ */}
        {isNative && (
          <TabsContent value="mobile" className="space-y-4 animate-fade-in">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Smartphone className="h-4 w-4" />{" "}
                  {t("settings.mobile.deviceInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("settings.mobile.platform")}
                  </span>
                  <Badge variant="secondary" className="capitalize">
                    {platform}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("settings.mobile.appVersion")}
                  </span>
                  <span className="font-mono text-xs">1.0.0</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="h-4 w-4" />{" "}
                  {t("settings.mobile.notifications")}
                </CardTitle>
                <CardDescription>
                  {t("settings.mobile.notificationsDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row
                  label={t("settings.mobile.pushNotifications")}
                  description={t("settings.mobile.pushNotificationsDesc")}
                >
                  <Switch
                    checked={prefs.desktopNotifications}
                    onCheckedChange={async (v) => {
                      if (v) {
                        const { PushNotifications } =
                          await import("@capacitor/push-notifications");
                        const perm =
                          await PushNotifications.requestPermissions();
                        if (perm.receive !== "granted") {
                          toast.error(t("settings.mobile.pushBlocked"));
                          return;
                        }
                        await PushNotifications.register();
                      }
                      handleUpdate({ desktopNotifications: v });
                    }}
                  />
                </Row>
                <Separator />
                <Row
                  label={t("settings.mobile.soundAlerts")}
                  description={t("settings.mobile.soundAlertsDesc")}
                >
                  <Switch
                    checked={prefs.soundAlerts}
                    onCheckedChange={(v) => handleUpdate({ soundAlerts: v })}
                  />
                </Row>
                <Separator />
                <div className="pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() =>
                      scheduleLocalNotification({
                        id: 1,
                        title: t("settings.mobile.testTitle"),
                        body: t("settings.mobile.testBody"),
                      }).then(() =>
                        toast.success(t("settings.mobile.testSent")),
                      )
                    }
                  >
                    <Bell className="h-3.5 w-3.5" />{" "}
                    {t("settings.mobile.sendTestNotification")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("settings.mobile.hapticTitle")}
                </CardTitle>
                <CardDescription>
                  {t("settings.mobile.hapticDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row
                  label={t("settings.mobile.hapticFeedback")}
                  description={t("settings.mobile.hapticSub")}
                >
                  <Switch
                    checked={(prefs as any).hapticFeedback ?? true}
                    onCheckedChange={(v) =>
                      handleUpdate({ hapticFeedback: v } as any)
                    }
                  />
                </Row>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("settings.mobile.display")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row
                  label={t("settings.mobile.keepScreenOn")}
                  description={t("settings.mobile.keepScreenOnDesc")}
                >
                  <Switch
                    checked={(prefs as any).keepScreenOn ?? false}
                    onCheckedChange={(v) =>
                      handleUpdate({ keepScreenOn: v } as any)
                    }
                  />
                </Row>
                <Separator />
                <Row
                  label={t("settings.mobile.reduceMotion")}
                  description={t("settings.mobile.reduceMotionDesc")}
                >
                  <Switch
                    checked={!prefs.animationsEnabled}
                    onCheckedChange={(v) =>
                      handleUpdate({ animationsEnabled: !v })
                    }
                  />
                </Row>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("settings.mobile.gpsTitle")}
                </CardTitle>
                <CardDescription>
                  {t("settings.mobile.gpsDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild className="gap-2">
                  <Link to="/settings/logistics">
                    {t("settings.mobile.logisticsSettings")}{" "}
                    <ArrowRight className="h-3.5 w-3.5" />
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
                  <PanelLeft className="h-4 w-4" />{" "}
                  {t("settings.layout.navStyle")}
                </CardTitle>
                <CardDescription>
                  {t("settings.layout.navStyleDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {(["navbar", "sidebar"] as NavMode[]).map((nav) => (
                    <button
                      key={nav}
                      onClick={() => {
                        dispatch(setNavMode(nav));
                        toast.success(
                          t("settings.layout.switchedTo", { mode: nav }),
                        );
                      }}
                      className={cn(
                        "relative rounded-xl border-2 p-4 text-left transition-all duration-200 hover:shadow-md",
                        prefs.navMode === nav
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      {prefs.navMode === nav && (
                        <span className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary grid place-items-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </span>
                      )}
                      <div className="mb-3">
                        {nav === "navbar" ? (
                          <Monitor className="h-9 w-9 text-muted-foreground" />
                        ) : (
                          <PanelLeft className="h-9 w-9 text-muted-foreground" />
                        )}
                      </div>
                      <p className="font-semibold capitalize text-sm">
                        {t(`settings.layout.${nav}`)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t(`settings.layout.${nav}Desc`)}
                      </p>
                    </button>
                  ))}
                </div>
                {prefs.navMode === "sidebar" && (
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-sm">
                      {t("settings.layout.sidebarDefaultState")}
                    </Label>
                    <Select
                      value={prefs.sidebarVariant}
                      onValueChange={(v) =>
                        handleUpdate({
                          sidebarVariant:
                            v as UserPreferences["sidebarVariant"],
                        })
                      }
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expanded">
                          {t("settings.layout.sidebarVariants.expanded")}
                        </SelectItem>
                        <SelectItem value="icon">
                          {t("settings.layout.sidebarVariants.icon")}
                        </SelectItem>
                        <SelectItem value="collapsed">
                          {t("settings.layout.sidebarVariants.collapsed")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layout className="h-4 w-4" />{" "}
                {t("settings.layout.dashboardWidgets")}
              </CardTitle>
              <CardDescription>
                {t("settings.layout.dashboardWidgetsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild className="gap-2">
                <Link to="/dashboard">
                  {t("settings.layout.customizeDashboard")}{" "}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("settings.layout.logisticsMap")}
              </CardTitle>
              <CardDescription>
                {t("settings.layout.logisticsMapDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild className="gap-2">
                <Link to="/settings/logistics">
                  {t("settings.layout.logisticsSettings")}{" "}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ DISPLAY TAB ══ */}
        <TabsContent value="display" className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4" /> {t("settings.display.interface")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row
                label={t("settings.display.compactMode")}
                description={t("settings.display.compactModeDesc")}
              >
                <Switch
                  checked={prefs.compactMode}
                  onCheckedChange={(v) => handleUpdate({ compactMode: v })}
                />
              </Row>
              <Separator />
              <Row
                label={t("settings.display.stickyHeader")}
                description={t("settings.display.stickyHeaderDesc")}
              >
                <Switch
                  checked={prefs.stickyHeader}
                  onCheckedChange={(v) => handleUpdate({ stickyHeader: v })}
                />
              </Row>
              <Separator />
              <Row
                label={t("settings.display.showBreadcrumbs")}
                description={t("settings.display.showBreadcrumbsDesc")}
              >
                <Switch
                  checked={prefs.showBreadcrumbs}
                  onCheckedChange={(v) => handleUpdate({ showBreadcrumbs: v })}
                />
              </Row>
              <Separator />
              <Row
                label={t("settings.display.showQuickActions")}
                description={t("settings.display.showQuickActionsDesc")}
              >
                <Switch
                  checked={prefs.showQuickActions}
                  onCheckedChange={(v) => handleUpdate({ showQuickActions: v })}
                />
              </Row>
              <Separator />
              <Row
                label={t("settings.display.animations")}
                description={t("settings.display.animationsDesc")}
              >
                <Switch
                  checked={prefs.animationsEnabled}
                  onCheckedChange={(v) =>
                    handleUpdate({ animationsEnabled: v })
                  }
                />
              </Row>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Rows3 className="h-4 w-4" /> {t("settings.display.tables")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">
                  {t("settings.display.rowSize")}
                </Label>
                <div className="flex gap-2">
                  {(["sm", "md", "lg"] as const).map((size) => (
                    <Button
                      key={size}
                      size="sm"
                      variant={
                        prefs.tableRowSize === size ? "default" : "outline"
                      }
                      onClick={() => handleUpdate({ tableRowSize: size })}
                      className="w-16"
                    >
                      {size.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm">
                  {t("settings.display.defaultPageSize", {
                    count: prefs.defaultPageSize,
                  })}
                </Label>
                <Slider
                  min={10}
                  max={100}
                  step={5}
                  value={[prefs.defaultPageSize]}
                  onValueChange={([v]) => handleUpdate({ defaultPageSize: v })}
                  className="max-w-xs"
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4" /> {t("settings.display.performance")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row
                label={t("settings.display.autoRefresh")}
                description={t("settings.display.autoRefreshDesc")}
              >
                <Switch
                  checked={prefs.autoRefresh}
                  onCheckedChange={(v) => handleUpdate({ autoRefresh: v })}
                />
              </Row>
              <Separator />
              <Row
                label={t("settings.display.reduceMotion")}
                description={t("settings.display.reduceMotionDesc")}
              >
                <Switch
                  checked={!prefs.animationsEnabled}
                  onCheckedChange={(v) =>
                    handleUpdate({ animationsEnabled: !v })
                  }
                />
              </Row>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ APPEARANCE TAB ══ */}
        <TabsContent value="appearance" className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4" />{" "}
                {t("settings.appearance.colorMode")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {(["light", "dark"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      if (mode !== m)
                        toggleMode(r.left + r.width / 2, r.top + r.height / 2);
                    }}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200",
                      mode === m
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    {mode === m && (
                      <span className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary grid place-items-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </span>
                    )}
                    {m === "light" ? (
                      <Sun className="h-6 w-6 text-amber-500" />
                    ) : (
                      <Moon className="h-6 w-6 text-indigo-400" />
                    )}
                    <div>
                      <p className="font-semibold text-sm capitalize">
                        {t(`settings.appearance.${m}`)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(`settings.appearance.${m}Desc`)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("settings.appearance.colorPresets")}
              </CardTitle>
              <CardDescription>
                {t("settings.appearance.colorPresetsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(PRESETS) as PresetId[]).map((id) => {
                  const p = PRESETS[id][mode];
                  const active = id === preset && !custom;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setCustom(null);
                        setPreset(id);
                      }}
                      className={cn(
                        "rounded-xl border-2 p-3 text-left transition-all duration-200 hover:shadow-md",
                        active
                          ? "border-primary ring-2 ring-primary/20 shadow-sm"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <p className="text-sm font-semibold mb-2">
                        {PRESETS[id].label}
                      </p>
                      <div className="flex gap-1.5">
                        {[p.primary, p.accent, p.background, p.foreground].map(
                          (c, i) => (
                            <span
                              key={i}
                              className="h-5 w-5 rounded-full border border-black/10"
                              style={{ background: `hsl(${c})` }}
                            />
                          ),
                        )}
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
                  <CardTitle className="text-base">
                    {t("settings.appearance.customColors")}
                  </CardTitle>
                  <CardDescription>
                    {t("settings.appearance.customColorsDesc")}
                  </CardDescription>
                </div>
                {custom && (
                  <Badge variant="secondary" className="text-xs">
                    {t("settings.appearance.customActive")}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {COLOR_KEYS.map(({ key, labelKey }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      {t(labelKey)}
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={hslToHex(tokens[key] as string)}
                        onChange={(e) =>
                          updateColor(key, hexToHsl(e.target.value))
                        }
                        className="h-9 w-12 rounded-lg border border-border bg-transparent cursor-pointer p-0.5"
                      />
                      <code className="text-[11px] text-muted-foreground truncate">
                        {tokens[key]}
                      </code>
                    </div>
                  </div>
                ))}
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">
                    {t("settings.appearance.borderRadius", {
                      radius: tokens.radius,
                    })}
                  </Label>
                  <Slider
                    value={[parseFloat(tokens.radius)]}
                    min={0}
                    max={1.5}
                    step={0.05}
                    onValueChange={(v) => updateColor("radius", String(v[0]))}
                    className="max-w-xs"
                  />
                </div>
              </div>
              {custom && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustom(null)}
                  className="gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />{" "}
                  {t("settings.appearance.resetToPreset")}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ REGIONAL TAB ══ */}
        <TabsContent value="regional" className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4" /> {t("settings.regional.language")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label className="text-sm">
                  {t("settings.regional.interfaceLanguage")}
                </Label>
                <Select
                  value={prefs.language}
                  onValueChange={(v) => {
                    handleUpdate({ language: v });
                    i18n.changeLanguage(v);
                  }}
                >
                  <SelectTrigger className="w-52">
                    <SelectValue />
                  </SelectTrigger>
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
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" /> {t("settings.regional.dateTime")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">
                    {t("settings.regional.dateFormat")}
                  </Label>
                  <Select
                    value={prefs.dateFormat}
                    onValueChange={(v) =>
                      handleUpdate({
                        dateFormat: v as UserPreferences["dateFormat"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">
                    {t("settings.regional.timeFormat")}
                  </Label>
                  <Select
                    value={prefs.timeFormat}
                    onValueChange={(v) =>
                      handleUpdate({
                        timeFormat: v as UserPreferences["timeFormat"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">
                        {t("settings.regional.timeFormat24")}
                      </SelectItem>
                      <SelectItem value="12h">
                        {t("settings.regional.timeFormat12")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">
                  {t("settings.regional.timezone")}
                </Label>
                <Select
                  value={prefs.timezone}
                  onValueChange={(v) => handleUpdate({ timezone: v })}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Asia/Tashkent">
                      Asia/Tashkent (UTC+5)
                    </SelectItem>
                    <SelectItem value="Europe/Moscow">
                      Europe/Moscow (UTC+3)
                    </SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="America/New_York">
                      America/New_York
                    </SelectItem>
                    <SelectItem value="Asia/Dubai">
                      Asia/Dubai (UTC+4)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" />{" "}
                {t("settings.regional.currency")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={prefs.currency}
                onValueChange={(v) => handleUpdate({ currency: v })}
              >
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">
                    {t("settings.regional.currencies.usd")}
                  </SelectItem>
                  <SelectItem value="UZS">
                    {t("settings.regional.currencies.uzs")}
                  </SelectItem>
                  <SelectItem value="RUB">
                    {t("settings.regional.currencies.rub")}
                  </SelectItem>
                  <SelectItem value="EUR">
                    {t("settings.regional.currencies.eur")}
                  </SelectItem>
                  <SelectItem value="GBP">
                    {t("settings.regional.currencies.gbp")}
                  </SelectItem>
                  <SelectItem value="KZT">
                    {t("settings.regional.currencies.kzt")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4" />{" "}
                {t("settings.regional.notifications")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row
                label={t("settings.regional.desktopNotifications")}
                description={t("settings.regional.desktopNotificationsDesc")}
              >
                <Switch
                  checked={prefs.desktopNotifications}
                  onCheckedChange={(v) => {
                    if (v && "Notification" in window) {
                      Notification.requestPermission().then((p) => {
                        if (p === "granted")
                          handleUpdate({ desktopNotifications: true });
                        else
                          toast.error(
                            t("settings.regional.notificationsBlocked"),
                          );
                      });
                    } else {
                      handleUpdate({ desktopNotifications: v });
                    }
                  }}
                />
              </Row>
              <Separator />
              <Row
                label={t("settings.regional.soundAlerts")}
                description={t("settings.regional.soundAlertsDesc")}
              >
                <Switch
                  checked={prefs.soundAlerts}
                  onCheckedChange={(v) => handleUpdate({ soundAlerts: v })}
                />
              </Row>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-destructive">
                <RotateCcw className="h-4 w-4" />{" "}
                {t("settings.regional.resetAll")}
              </CardTitle>
              <CardDescription>
                {t("settings.regional.resetAllDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" size="sm" onClick={handleReset}>
                {t("settings.regional.resetAllButton")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
