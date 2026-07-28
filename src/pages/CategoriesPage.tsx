import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditableTable, type Column } from "@/components/data/EditableTable";
import {
  makeListLoader,
  makePatcher,
  makeDeleter,
} from "@/components/data/GenericPage";
import { Plus } from "lucide-react";

type CategoryRow = Record<string, unknown> & { id: string | number };
type CategoryOption = { id: string; name: string; path?: string };

// ─── Create Category Dialog ───────────────────────────────────────────────────

function CreateCategoryDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (cat: unknown) => void;
}) {
  const { t } = useTranslation();
  const tenantId = useAppSelector((s) => s.auth.user?.tenantId ?? "");

  const [existing, setExisting] = useState<CategoryOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", parentId: "", path: "" });

  // Load existing categories so the user can pick a parent
  useEffect(() => {
    if (!open) return;
    api
      .get("/api/categories")
      .then(({ data }) =>
        setExisting(Array.isArray(data?.data) ? data.data : []),
      )
      .catch(() => setExisting([]));
  }, [open]);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function reset() {
    setForm({ name: "", parentId: "", path: "" });
    setSaving(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t("categoriesPage.toasts.nameRequired"));
      return;
    }

    const body: Record<string, unknown> = {
      tenantId,
      name: form.name.trim(),
      parentId:
        form.parentId === "__none__" || !form.parentId
          ? undefined
          : form.parentId,
      path: form.path.trim() || undefined,
    };

    setSaving(true);
    try {
      const { data } = await api.post("/api/categories", body);
      const record = data?.data ?? data;
      toast.success(t("categoriesPage.toasts.created"));
      onCreated(record);
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error ?? t("categoriesPage.toasts.createFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  // Label helper: show path if available, otherwise just name
  function catLabel(c: CategoryOption) {
    return c.path ? c.path : c.name;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!saving) {
          onOpenChange(v);
          if (!v) reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("categoriesPage.dialog.title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>
              {t("categoriesPage.dialog.nameLabel")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={t("categoriesPage.dialog.namePlaceholder")}
              className="h-9"
              autoFocus
            />
          </div>

          {/* Parent category — dropdown of existing ones */}
          <div className="space-y-1.5">
            <Label>{t("categoriesPage.dialog.parentLabel")}</Label>
            <Select
              value={form.parentId || "__none__"}
              onValueChange={(v) => set("parentId", v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue
                  placeholder={t("categoriesPage.dialog.noParentPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  {t("categoriesPage.dialog.noParent")}
                </SelectItem>
                {existing.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {catLabel(c)}
                  </SelectItem>
                ))}
                {existing.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    {t("categoriesPage.dialog.noCategoriesYet")}
                  </div>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("categoriesPage.dialog.parentHelpText")}
            </p>
          </div>

          {/* Path — optional, auto-suggest based on parent */}
          <div className="space-y-1.5">
            <Label>
              {t("categoriesPage.dialog.pathLabel")}{" "}
              <span className="text-muted-foreground text-xs font-normal">
                {t("categoriesPage.dialog.optional")}
              </span>
            </Label>
            <Input
              value={form.path}
              onChange={(e) => set("path", e.target.value)}
              placeholder={
                form.parentId
                  ? `e.g. ${catLabel(
                      existing.find((c) => c.id === form.parentId) ?? {
                        name: "Parent",
                      },
                    )} / ${form.name || "Sub"}`
                  : "e.g. Electronics"
              }
              className="h-9"
            />
            <p className="text-xs text-muted-foreground">
              {t("categoriesPage.dialog.pathHelpText")}
            </p>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
            >
              {t("categoriesPage.dialog.cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving
                ? t("categoriesPage.dialog.creating")
                : t("categoriesPage.dialog.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── CategoriesPage ───────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const fetcher = useCallback(makeListLoader("/api/categories"), []);
  const patcher = useCallback(makePatcher("/api/categories"), []);
  const deleter = useCallback(makeDeleter("/api/categories"), []);

  const columns: Column<CategoryRow>[] = useMemo(
    () => [
      { key: "name", label: t("categoriesPage.columns.name"), editable: true },
      {
        key: "parent",
        label: t("categoriesPage.columns.parent"),
        render: (v: any) => v?.name ?? "—",
      },
      {
        key: "path",
        label: t("categoriesPage.columns.path"),
        render: (v: any) => v ?? "—",
      },
      {
        key: "createdAt",
        label: t("categoriesPage.columns.created"),
        render: (v: any) => (v ? new Date(v).toLocaleDateString() : "—"),
      },
    ],
    [t],
  );

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcher()
      .then(setRows)
      .catch((e) =>
        setError(e?.message ?? t("categoriesPage.toasts.loadFailed")),
      )
      .finally(() => setLoading(false));
  }, [fetcher, t]);

  useEffect(() => {
    document.title = `${t("categoriesPage.title")} · VMS`;
    load();
  }, [load, t]);

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {t("categoriesPage.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("categoriesPage.subtitle")}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" /> {t("categoriesPage.newCategory")}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-lg bg-muted/40 animate-pulse"
              style={{ opacity: 1 - i * 0.15 }}
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button size="sm" variant="outline-destructive" onClick={load}>
            {t("categoriesPage.retry")}
          </Button>
        </div>
      ) : (
        <EditableTable
          rows={rows}
          columns={columns}
          onSave={async (id, patch) => {
            setRows((r) =>
              r.map((x) => (x.id === id ? { ...x, ...patch } : x)),
            );
            await patcher(id, patch as Record<string, unknown>);
          }}
          onDelete={async (id) => {
            setRows((r) => r.filter((x) => x.id !== id));
            await deleter(id);
          }}
        />
      )}

      <CreateCategoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(record) => {
          setRows((r) => [record as CategoryRow, ...r]);
        }}
      />
    </div>
  );
}
