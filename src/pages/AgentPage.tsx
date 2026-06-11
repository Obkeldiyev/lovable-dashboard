/**
 * AgentPage — Field agent visit management.
 *
 * Features:
 * - View today's visit plans (assigned to current user)
 * - Check in / check out with GPS coordinates
 * - Take photos, record voice notes, attach documents
 * - Log orders placed, returns, merchandising score
 * - View visit history per shop
 * - Custom pricing per shop (price list)
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  MapPin, CheckCircle2, LogIn, LogOut, Camera, Mic, MicOff,
  FileText, RefreshCw, Clock, ShoppingBag, RotateCcw, Star,
  ChevronRight, X, Play, Square, Download, Upload,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type VisitPlan = {
  id: string;
  shopId: string;
  shop: { id: string; name: string; address?: string; code?: string; latitude?: number; longitude?: number };
  plannedDate: string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "MISSED";
  priority: number;
  notes?: string;
  assignedToId?: string;
};

type Visit = {
  id: string;
  shopId: string;
  visitPlanId?: string;
  status: "PLANNED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED";
  checkInAt?: string;
  checkOutAt?: string;
  orderCount?: number;
  returnCount?: number;
  merchandisingScore?: number;
  notes?: string;
};

type MediaItem = {
  id: string;
  type: "photo" | "voice" | "document";
  url: string;        // local blob URL
  name: string;
  size?: number;
  duration?: number;  // seconds, for voice
  createdAt: string;
};

// ─── Media capture helpers ────────────────────────────────────────────────────

function usePhotoCapture() {
  const inputRef = useRef<HTMLInputElement>(null);
  const capture = (onCapture: (file: File) => void) => {
    if (!inputRef.current) return;
    inputRef.current.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) onCapture(f);
    };
    inputRef.current.click();
  };
  const el = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      capture="environment"
      className="hidden"
    />
  );
  return { capture, el };
}

function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  }

  function stop(): Promise<File | null> {
    return new Promise((resolve) => {
      const mr = mediaRef.current;
      if (!mr) { resolve(null); return; }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        resolve(file);
      };
      mr.stop();
      mr.stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    });
  }

  return { recording, duration, start, stop };
}

// ─── Visit Card ───────────────────────────────────────────────────────────────

function VisitCard({
  plan,
  activeVisit,
  onStart,
  onCheckIn,
  onCheckOut,
  onOpenDetail,
}: {
  plan: VisitPlan;
  activeVisit?: Visit;
  onStart: (planId: string) => void;
  onCheckIn: (visitId: string) => void;
  onCheckOut: (visit: Visit) => void;
  onOpenDetail: (plan: VisitPlan, visit?: Visit) => void;
}) {
  const statusColor = {
    PLANNED: "bg-muted text-muted-foreground",
    IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    CANCELLED: "bg-destructive/10 text-destructive",
    MISSED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  }[plan.status] ?? "bg-muted text-muted-foreground";

  return (
    <Card className={cn("transition-all", plan.status === "COMPLETED" && "opacity-60")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center shrink-0">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{plan.shop.name}</span>
              {plan.shop.code && (
                <Badge variant="secondary" className="text-[10px]">{plan.shop.code}</Badge>
              )}
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium ml-auto", statusColor)}>
                {plan.status}
              </span>
            </div>
            {plan.shop.address && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{plan.shop.address}</p>
            )}
            {plan.notes && (
              <p className="text-xs text-muted-foreground mt-1 italic">"{plan.notes}"</p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {plan.status === "PLANNED" && !activeVisit && (
                <Button size="xs" onClick={() => onStart(plan.id)} className="gap-1">
                  <Play className="h-3 w-3" /> Start visit
                </Button>
              )}
              {activeVisit && activeVisit.status === "PLANNED" && (
                <Button size="xs" onClick={() => onCheckIn(activeVisit.id)} className="gap-1">
                  <LogIn className="h-3 w-3" /> Check in
                </Button>
              )}
              {activeVisit && activeVisit.status === "CHECKED_IN" && (
                <Button size="xs" variant="outline" onClick={() => onCheckOut(activeVisit)} className="gap-1">
                  <LogOut className="h-3 w-3" /> Check out
                </Button>
              )}
              <Button size="xs" variant="ghost" onClick={() => onOpenDetail(plan, activeVisit)} className="gap-1 ml-auto">
                Details <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Visit Detail Dialog ──────────────────────────────────────────────────────

function VisitDetailDialog({
  open,
  onOpenChange,
  plan,
  visit,
  onCheckOut,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plan: VisitPlan | null;
  visit?: Visit;
  onCheckOut: (data: { orderCount: number; returnCount: number; merchandisingScore: number; notes: string; media: MediaItem[] }) => void;
}) {
  const [orderCount, setOrderCount] = useState(0);
  const [returnCount, setReturnCount] = useState(0);
  const [score, setScore] = useState(5);
  const [notes, setNotes] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [saving, setSaving] = useState(false);

  const photo = usePhotoCapture();
  const voice = useVoiceRecorder();

  useEffect(() => {
    if (open) {
      setOrderCount(visit?.orderCount ?? 0);
      setReturnCount(visit?.returnCount ?? 0);
      setScore(visit?.merchandisingScore ?? 5);
      setNotes(visit?.notes ?? "");
      setMedia([]);
    }
  }, [open, visit]);

  function addPhoto(file: File) {
    const url = URL.createObjectURL(file);
    setMedia((m) => [...m, {
      id: crypto.randomUUID(),
      type: "photo",
      url,
      name: file.name,
      size: file.size,
      createdAt: new Date().toISOString(),
    }]);
    toast.success("Photo added");
  }

  async function handleVoice() {
    if (voice.recording) {
      const file = await voice.stop();
      if (file) {
        const url = URL.createObjectURL(file);
        setMedia((m) => [...m, {
          id: crypto.randomUUID(),
          type: "voice",
          url,
          name: file.name,
          duration: voice.duration,
          createdAt: new Date().toISOString(),
        }]);
        toast.success(`Voice note saved (${voice.duration}s)`);
      }
    } else {
      voice.start();
    }
  }

  function addDocument(file: File) {
    const url = URL.createObjectURL(file);
    setMedia((m) => [...m, {
      id: crypto.randomUUID(),
      type: "document",
      url,
      name: file.name,
      size: file.size,
      createdAt: new Date().toISOString(),
    }]);
    toast.success("Document attached");
  }

  function removeMedia(id: string) {
    setMedia((m) => m.filter((x) => x.id !== id));
  }

  async function handleCheckOut() {
    setSaving(true);
    try {
      onCheckOut({ orderCount, returnCount, merchandisingScore: score, notes, media });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  const docInputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            {plan?.shop.name ?? "Visit"}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-4 py-1 pr-1">
          {/* Visit status */}
          {visit && (
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground flex items-center gap-4">
              {visit.checkInAt && (
                <span className="flex items-center gap-1">
                  <LogIn className="h-3.5 w-3.5" />
                  In: {new Date(visit.checkInAt).toLocaleTimeString()}
                </span>
              )}
              <Badge variant="outline" className="text-[10px]">{visit.status}</Badge>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <ShoppingBag className="h-3 w-3" /> Orders
              </Label>
              <Input
                type="number" min={0}
                value={orderCount}
                onChange={(e) => setOrderCount(Number(e.target.value))}
                className="h-9 text-center text-lg font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <RotateCcw className="h-3 w-3" /> Returns
              </Label>
              <Input
                type="number" min={0}
                value={returnCount}
                onChange={(e) => setReturnCount(Number(e.target.value))}
                className="h-9 text-center text-lg font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Star className="h-3 w-3" /> Score (1-10)
              </Label>
              <Input
                type="number" min={1} max={10}
                value={score}
                onChange={(e) => setScore(Math.min(10, Math.max(1, Number(e.target.value))))}
                className="h-9 text-center text-lg font-bold"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea
              rows={3}
              placeholder="Visit notes, observations…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none text-sm"
            />
          </div>

          <Separator />

          {/* Media capture */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Media & Documents</Label>
            <div className="flex gap-2 flex-wrap">
              {/* Photo */}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => photo.capture(addPhoto)}
              >
                <Camera className="h-3.5 w-3.5" /> Photo
              </Button>
              {photo.el}

              {/* Voice */}
              <Button
                type="button"
                size="sm"
                variant={voice.recording ? "destructive" : "outline"}
                className="gap-1.5"
                onClick={handleVoice}
              >
                {voice.recording ? (
                  <><Square className="h-3.5 w-3.5" /> Stop ({voice.duration}s)</>
                ) : (
                  <><Mic className="h-3.5 w-3.5" /> Voice note</>
                )}
              </Button>

              {/* Document */}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => docInputRef.current?.click()}
              >
                <FileText className="h-3.5 w-3.5" /> Document
              </Button>
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) addDocument(f);
                }}
              />
            </div>

            {/* Media list */}
            {media.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {media.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    {m.type === "photo" ? (
                      <img src={m.url} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
                    ) : m.type === "voice" ? (
                      <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                        <Mic className="h-4 w-4 text-primary" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {m.type === "voice" ? `${m.duration}s` : m.size ? `${Math.round((m.size ?? 0) / 1024)}KB` : ""}
                      </p>
                    </div>
                    {m.type === "voice" && (
                      <audio src={m.url} controls className="h-8 w-24 shrink-0" />
                    )}
                    <Button
                      size="icon-xs"
                      variant="ghost-destructive"
                      onClick={() => removeMedia(m.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-3 gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {visit?.status === "CHECKED_IN" && (
            <Button
              size="sm"
              onClick={handleCheckOut}
              disabled={saving}
              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              {saving ? "Saving…" : "Check out & Save"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main AgentPage ───────────────────────────────────────────────────────────

export default function AgentPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [plans, setPlans] = useState<VisitPlan[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("today");
  const [detailPlan, setDetailPlan] = useState<VisitPlan | null>(null);
  const [detailVisit, setDetailVisit] = useState<Visit | undefined>(undefined);
  const [detailOpen, setDetailOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, visitsRes] = await Promise.allSettled([
        api.get("/api/field/visit-plans"),
        api.get("/api/field/visits"),
      ]);
      if (plansRes.status === "fulfilled") {
        const data = plansRes.value.data?.data ?? plansRes.value.data ?? [];
        setPlans(Array.isArray(data) ? data : []);
      }
      if (visitsRes.status === "fulfilled") {
        const data = visitsRes.value.data?.data ?? visitsRes.value.data ?? [];
        setVisits(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("Failed to load visit plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "My Visits · VMS";
    load();
  }, [load]);

  // Get GPS position
  function getPos(): Promise<GeolocationCoordinates | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(p.coords),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    });
  }

  async function handleStart(planId: string) {
    try {
      const { data } = await api.post(`/api/field/visit-plans/${planId}/start`);
      toast.success("Visit started");
      const visit = data?.data?.visit ?? data?.visit;
      if (visit) setVisits((v) => [...v.filter((x) => x.visitPlanId !== planId), visit]);
      setPlans((p) => p.map((x) => x.id === planId ? { ...x, status: "IN_PROGRESS" } : x));
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Failed to start visit");
    }
  }

  async function handleCheckIn(visitId: string) {
    const coords = await getPos();
    try {
      await api.post(`/api/field/visits/${visitId}/check-in`, {
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      toast.success("Checked in");
      setVisits((v) => v.map((x) => x.id === visitId ? { ...x, status: "CHECKED_IN", checkInAt: new Date().toISOString() } : x));
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Failed to check in");
    }
  }

  async function handleCheckOut(
    visit: Visit,
    data: { orderCount: number; returnCount: number; merchandisingScore: number; notes: string; media: MediaItem[] }
  ) {
    const coords = await getPos();
    try {
      await api.post(`/api/field/visits/${visit.id}/check-out`, {
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        orderCount: data.orderCount,
        returnCount: data.returnCount,
        merchandisingScore: data.merchandisingScore,
        notes: data.notes,
      });
      // Media is stored locally (blob URLs) — in a production setup you'd upload to S3/storage here
      toast.success(`Visit completed — ${data.orderCount} orders, ${data.media.length} media items`);
      setVisits((v) => v.map((x) => x.id === visit.id ? { ...x, status: "COMPLETED", checkOutAt: new Date().toISOString() } : x));
      setPlans((p) => p.map((x) => x.id === visit.visitPlanId ? { ...x, status: "COMPLETED" } : x));
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Failed to check out");
    }
  }

  const todayPlans = plans.filter((p) => {
    const pd = new Date(p.plannedDate).toISOString().split("T")[0];
    return pd === today;
  });
  const upcomingPlans = plans.filter((p) => {
    const pd = new Date(p.plannedDate).toISOString().split("T")[0];
    return pd > today && p.status !== "COMPLETED";
  });
  const completedPlans = plans.filter((p) => p.status === "COMPLETED");

  const getVisitForPlan = (planId: string) =>
    visits.find((v) => v.visitPlanId === planId);

  const todayStats = {
    total: todayPlans.length,
    completed: todayPlans.filter((p) => p.status === "COMPLETED").length,
    inProgress: todayPlans.filter((p) => p.status === "IN_PROGRESS").length,
    orders: visits
      .filter((v) => v.status === "COMPLETED")
      .reduce((s, v) => s + (v.orderCount ?? 0), 0),
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">My Visits</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: todayStats.total, color: "" },
          { label: "Done", value: todayStats.completed, color: "text-green-600" },
          { label: "Active", value: todayStats.inProgress, color: "text-blue-600" },
          { label: "Orders", value: todayStats.orders, color: "text-primary" },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
            <p className={cn("text-2xl font-bold mt-0.5", s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="today">
            Today
            {todayPlans.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">{todayPlans.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="done">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4 space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
            ))
          ) : todayPlans.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No visits planned for today
            </div>
          ) : (
            todayPlans
              .sort((a, b) => a.priority - b.priority)
              .map((plan) => (
                <VisitCard
                  key={plan.id}
                  plan={plan}
                  activeVisit={getVisitForPlan(plan.id)}
                  onStart={handleStart}
                  onCheckIn={handleCheckIn}
                  onCheckOut={(v) => {
                    setDetailPlan(plan);
                    setDetailVisit(v);
                    setDetailOpen(true);
                  }}
                  onOpenDetail={(p, v) => {
                    setDetailPlan(p);
                    setDetailVisit(v);
                    setDetailOpen(true);
                  }}
                />
              ))
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {upcomingPlans.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No upcoming visits
            </div>
          ) : (
            upcomingPlans.map((plan) => (
              <VisitCard
                key={plan.id}
                plan={plan}
                onStart={() => {}}
                onCheckIn={() => {}}
                onCheckOut={() => {}}
                onOpenDetail={(p, v) => {
                  setDetailPlan(p);
                  setDetailVisit(v);
                  setDetailOpen(true);
                }}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="done" className="mt-4 space-y-3">
          {completedPlans.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No completed visits
            </div>
          ) : (
            completedPlans.map((plan) => {
              const v = getVisitForPlan(plan.id);
              return (
                <Card key={plan.id} className="opacity-70">
                  <CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{plan.shop.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {v?.checkOutAt ? new Date(v.checkOutAt).toLocaleString() : new Date(plan.plannedDate).toLocaleDateString()}
                        {v && ` · ${v.orderCount ?? 0} orders · Score: ${v.merchandisingScore ?? "—"}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Visit detail dialog */}
      <VisitDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        plan={detailPlan}
        visit={detailVisit}
        onCheckOut={(data) => {
          if (detailVisit) {
            handleCheckOut(detailVisit, data);
          }
        }}
      />
    </div>
  );
}
