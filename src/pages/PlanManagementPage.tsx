import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  Plus,
  RefreshCw,
  User,
  MapPin,
  Trash2,
  ClipboardList,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type Agent = {
  id: string;
  name?: string;
  email?: string;
};

type Shop = {
  id: string;
  name: string;
  address?: string;
  code?: string;
};

type VisitPlan = {
  id: string;
  shopId: string;
  shop: { id: string; name: string; address?: string };
  plannedDate: string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "MISSED";
  priority: number;
  notes?: string;
  assignedToId?: string;
  assignedTo?: { name?: string; email?: string };
};

export default function PlanManagementPage() {
  const { t } = useTranslation();
  const today = new Date().toISOString().split("T")[0];

  // State
  const [agents, setAgents] = useState<Agent[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [plans, setPlans] = useState<VisitPlan[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Form state
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Dialog
  const [addOpen, setAddOpen] = useState(false);
  const [shopSearch, setShopSearch] = useState("");

  // Load agents and shops once
  useEffect(() => {
    document.title = `${t("planManagement.title")} · VMS`;
    async function loadMeta() {
      setLoadingData(true);
      try {
        const [agentsRes, shopsRes] = await Promise.allSettled([
          api.get("/api/users?role=AGENT"),
          api.get("/api/shops"),
        ]);
        if (agentsRes.status === "fulfilled") {
          const d = agentsRes.value.data?.data ?? agentsRes.value.data ?? [];
          setAgents(Array.isArray(d) ? d : []);
        }
        if (shopsRes.status === "fulfilled") {
          const d = shopsRes.value.data?.data ?? shopsRes.value.data ?? [];
          setShops(Array.isArray(d) ? d : []);
        }
      } catch {
        toast.error(t("planManagement.toast.loadDataFailed"));
      } finally {
        setLoadingData(false);
      }
    }
    loadMeta();
  }, [t]);

  // Load plans when date or agent changes
  const loadPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const params = new URLSearchParams({ date: selectedDate });
      if (selectedAgent) params.set("agentId", selectedAgent);
      const { data } = await api.get(
        `/api/field/visit-plans?${params.toString()}`,
      );
      const d = data?.data ?? data ?? [];
      setPlans(Array.isArray(d) ? d : []);
    } catch {
      toast.error(t("planManagement.toast.loadPlansFailed"));
    } finally {
      setLoadingPlans(false);
    }
  }, [selectedDate, selectedAgent, t]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Toggle shop selection
  function toggleShop(shopId: string) {
    setSelectedShops((prev) =>
      prev.includes(shopId)
        ? prev.filter((id) => id !== shopId)
        : [...prev, shopId],
    );
  }

  // Submit — create one plan per shop
  async function handleSubmit() {
    if (!selectedAgent)
      return toast.error(t("planManagement.toast.selectAgentWarning"));
    if (selectedShops.length === 0)
      return toast.error(t("planManagement.toast.selectShopWarning"));

    setSubmitting(true);
    try {
      await Promise.all(
        selectedShops.map((shopId, idx) =>
          api.post("/api/field/visit-plans", {
            agentId: selectedAgent,
            shopId,
            plannedDate: new Date(selectedDate).toISOString(),
            priority: idx + 1,
            notes: notes || undefined,
          }),
        ),
      );
      toast.success(
        t("planManagement.toast.plansCreated", { count: selectedShops.length }),
      );
      setSelectedShops([]);
      setNotes("");
      setAddOpen(false);
      loadPlans();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.error ?? t("planManagement.toast.createFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Delete plan
  async function handleDelete(planId: string) {
    try {
      await api.delete(`/api/field/visit-plans/${planId}`);
      toast.success(t("planManagement.toast.planRemoved"));
      setPlans((p) => p.filter((x) => x.id !== planId));
    } catch {
      toast.error(t("planManagement.toast.deleteFailed"));
    }
  }

  const filteredShops = shops.filter(
    (s) =>
      s.name.toLowerCase().includes(shopSearch.toLowerCase()) ||
      s.code?.toLowerCase().includes(shopSearch.toLowerCase()),
  );

  const statusColor: Record<string, string> = {
    PLANNED: "bg-muted text-muted-foreground",
    IN_PROGRESS:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    COMPLETED:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    CANCELLED: "bg-destructive/10 text-destructive",
    MISSED:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  };

  const planStats = {
    total: plans.length,
    completed: plans.filter((p) => p.status === "COMPLETED").length,
    inProgress: plans.filter((p) => p.status === "IN_PROGRESS").length,
    planned: plans.filter((p) => p.status === "PLANNED").length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            {t("planManagement.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("planManagement.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPlans}
            className="gap-1.5"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", loadingPlans && "animate-spin")}
            />
            {t("planManagement.refresh")}
          </Button>
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" /> {t("planManagement.newPlan")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">{t("planManagement.date")}</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 w-44"
          />
        </div>
        <div className="space-y-1 min-w-[180px]">
          <Label className="text-xs">{t("planManagement.agentOptional")}</Label>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder={t("planManagement.allAgents")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("planManagement.allAgents")}</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name ?? a.email ?? a.id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: t("planManagement.stats.total"),
            value: planStats.total,
            color: "",
          },
          {
            label: t("planManagement.stats.planned"),
            value: planStats.planned,
            color: "text-muted-foreground",
          },
          {
            label: t("planManagement.stats.active"),
            value: planStats.inProgress,
            color: "text-blue-600",
          },
          {
            label: t("planManagement.stats.done"),
            value: planStats.completed,
            color: "text-green-600",
          },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {s.label}
            </p>
            <p className={cn("text-2xl font-bold mt-0.5", s.color)}>
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Plans list */}
      {loadingPlans ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {t("planManagement.noPlansForDate")}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 gap-1.5"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> {t("planManagement.createPlan")}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {plans
            .sort((a, b) => a.priority - b.priority)
            .map((plan) => (
              <Card key={plan.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Priority badge */}
                    <div className="h-8 w-8 rounded-full bg-primary/10 grid place-items-center shrink-0 text-xs font-bold text-primary">
                      {plan.priority}
                    </div>

                    {/* Shop info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {plan.shop.name}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-medium",
                            statusColor[plan.status],
                          )}
                        >
                          {plan.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {plan.shop.address && (
                          <p className="text-xs text-muted-foreground truncate">
                            {plan.shop.address}
                          </p>
                        )}
                        {plan.assignedTo && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {plan.assignedTo.name ?? plan.assignedTo.email}
                          </p>
                        )}
                        {plan.notes && (
                          <p className="text-xs text-muted-foreground italic">
                            "{plan.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Delete (only if PLANNED) */}
                    {plan.status === "PLANNED" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {t("planManagement.dialog.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 space-y-4 py-1 pr-1">
            {/* Date */}
            <div className="space-y-1.5">
              <Label className="text-xs">{t("planManagement.date")}</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Agent */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("planManagement.agentRequired")}
              </Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t("planManagement.selectAgent")} />
                </SelectTrigger>
                <SelectContent>
                  {loadingData ? (
                    <SelectItem value="loading" disabled>
                      {t("planManagement.loadingAgents")}
                    </SelectItem>
                  ) : agents.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      {t("planManagement.noAgentsFound")}
                    </SelectItem>
                  ) : (
                    agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name ?? a.email ?? a.id.slice(0, 8)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Shops */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("planManagement.shopsRequired")}
                {selectedShops.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    {t("planManagement.selectedCount", {
                      count: selectedShops.length,
                    })}
                  </Badge>
                )}
              </Label>
              <Input
                placeholder={t("planManagement.searchShops")}
                value={shopSearch}
                onChange={(e) => setShopSearch(e.target.value)}
                className="h-8 text-xs"
              />
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {filteredShops.length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground text-center">
                    {t("planManagement.noShopsFound")}
                  </div>
                ) : (
                  filteredShops.map((shop) => {
                    const selected = selectedShops.includes(shop.id);
                    return (
                      <button
                        key={shop.id}
                        type="button"
                        onClick={() => toggleShop(shop.id)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors text-sm",
                          selected
                            ? "bg-primary/5 text-primary"
                            : "hover:bg-muted/50",
                        )}
                      >
                        <div
                          className={cn(
                            "h-4 w-4 rounded border-2 shrink-0 grid place-items-center transition-colors",
                            selected
                              ? "bg-primary border-primary"
                              : "border-border",
                          )}
                        >
                          {selected && (
                            <svg
                              className="h-2.5 w-2.5 text-primary-foreground"
                              viewBox="0 0 10 10"
                              fill="none"
                            >
                              <path
                                d="M1.5 5l2.5 2.5L8.5 2.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{shop.name}</p>
                          {shop.address && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {shop.address}
                            </p>
                          )}
                        </div>
                        {shop.code && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] shrink-0"
                          >
                            {shop.code}
                          </Badge>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("planManagement.notesOptional")}
              </Label>
              <Textarea
                rows={2}
                placeholder={t("planManagement.notesPlaceholder")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none text-sm"
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-3 gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddOpen(false)}
            >
              {t("planManagement.cancel")}
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={
                submitting || !selectedAgent || selectedShops.length === 0
              }
              className="gap-1.5"
            >
              {submitting
                ? t("planManagement.creating")
                : t("planManagement.createButton", {
                    count: selectedShops.length,
                  })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
