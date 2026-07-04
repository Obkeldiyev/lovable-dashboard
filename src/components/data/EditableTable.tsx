import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pencil,
  Trash2,
  MoreHorizontal,
  Check,
  X,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Copy,
  SlidersHorizontal,
  Download,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store";
import {
  CreateDialog,
  type CreateDialogConfig,
} from "@/components/data/CreateDialog";
import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// ─── Column definition ────────────────────────────────────────────────────────

export type Column<T> = {
  key: keyof T & string;
  label: string;
  editable?: boolean;
  /** text | number | badge | boolean — boolean renders a Switch toggle */
  type?: "text" | "number" | "badge" | "boolean";
  badgeVariant?: (
    val: unknown,
  ) => "default" | "secondary" | "destructive" | "outline";
  render?: (val: unknown, row: T) => ReactNode;
  filterable?: boolean;
  filterType?: "text" | "number" | "boolean" | "select" | "date";
  filterValue?: (val: unknown, row: T) => string;
  filterOptions?: { value: string; label: string }[];
};

// ─── Status → badge colour map ────────────────────────────────────────────────

const STATUS_COLORS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ACTIVE: "default",
  active: "default",
  COMPLETED: "default",
  completed: "default",
  DELIVERED: "default",
  delivered: "default",
  ONLINE: "default",
  online: "default",
  AVAILABLE: "default",
  available: "default",
  APPROVED: "default",
  approved: "default",

  PENDING: "secondary",
  pending: "secondary",
  IN_PROGRESS: "secondary",
  in_progress: "secondary",
  IN_TRANSIT: "secondary",
  in_transit: "secondary",
  ASSIGNED: "secondary",
  assigned: "secondary",
  INVITED: "outline",
  invited: "outline",
  DRAFT: "outline",
  draft: "outline",

  SUSPENDED: "destructive",
  suspended: "destructive",
  CANCELLED: "destructive",
  cancelled: "destructive",
  DELETED: "destructive",
  deleted: "destructive",
  BLOCKED: "destructive",
  blocked: "destructive",
  FAILED: "destructive",
  failed: "destructive",
  REJECTED: "destructive",
  rejected: "destructive",
  OFFLINE: "destructive",
  offline: "destructive",
};

function statusVariant(
  val: unknown,
): "default" | "secondary" | "destructive" | "outline" {
  return STATUS_COLORS[String(val)] ?? "secondary";
}

// ─── Filter helpers ────────────────────────────────────────────────────────────

type ColumnFilter =
  | { kind: "text"; query: string }
  | { kind: "number"; min: string; max: string }
  | { kind: "boolean"; checked: boolean | null }
  | { kind: "select"; selected: string[] }
  | { kind: "date"; from: string; to: string };

function getColumnFilterType(
  col: Column<unknown>,
): "text" | "number" | "boolean" | "select" | "date" {
  if (col.filterType) return col.filterType;
  if (col.type === "number") return "number";
  if (col.type === "boolean") return "boolean";
  if (col.type === "badge" || col.key === "status" || col.key === "role")
    return "select";
  const k = String(col.key).toLowerCase();
  if (k.includes("date") || k.endsWith("at")) return "date";
  return "text";
}

function getFilterValue<T>(col: Column<T>, row: T): string {
  if (col.filterValue) return col.filterValue(row[col.key as keyof T], row);
  const v = row[col.key as keyof T];
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function isFilterEmpty(f: ColumnFilter): boolean {
  switch (f.kind) {
    case "text":
      return !f.query;
    case "number":
      return !f.min && !f.max;
    case "boolean":
      return f.checked === null;
    case "select":
      return f.selected.length === 0;
    case "date":
      return !f.from && !f.to;
  }
}

function summarizeFilter(f: ColumnFilter, col: Column<unknown>): string {
  switch (f.kind) {
    case "text":
      return f.query ? `"${f.query}"` : "";
    case "number": {
      const parts: string[] = [];
      if (f.min) parts.push(`≥ ${f.min}`);
      if (f.max) parts.push(`≤ ${f.max}`);
      return parts.join(" ");
    }
    case "boolean":
      return f.checked ? "Yes" : f.checked === false ? "No" : "";
    case "select":
      return f.selected.join(", ");
    case "date": {
      const parts: string[] = [];
      if (f.from) parts.push(`from ${f.from}`);
      if (f.to) parts.push(`to ${f.to}`);
      return parts.join(" ");
    }
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props<T extends { id: string | number }> = {
  rows: T[];
  columns: Column<T>[];
  onSave?: (id: T["id"], patch: Partial<T>) => Promise<void> | void;
  onDelete?: (id: T["id"]) => Promise<void> | void;
  onCreate?: () => void;
  empty?: string;
  title?: string;
  searchable?: boolean;
};

// ─── EditableTable ────────────────────────────────────────────────────────────

export function EditableTable<T extends { id: string | number }>({
  rows,
  columns,
  onSave,
  onDelete,
  onCreate,
  empty,
  title,
  searchable = true,
}: Props<T>) {
  const prefs = useAppSelector((s) => s.preferences);
  const { t } = useTranslation();
  const [editing, setEditing] = useState<{ id: T["id"]; key: string } | null>(
    null,
  );
  const [draft, setDraft] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<T["id"] | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, ColumnFilter>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pageSize = prefs.defaultPageSize;

  useEffect(() => {
    setEditing(null);
    setPage(1);
  }, [rows.length]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const filterableColumns = columns.filter((c) => c.filterable !== false);

  const selectColumnOptions = useMemo(() => {
    const result: Record<string, { value: string; label: string }[]> = {};
    for (const col of filterableColumns) {
      if (getColumnFilterType(col) !== "select") continue;
      if (col.filterOptions) {
        result[col.key] = col.filterOptions;
      } else {
        const map = new Map<string, { value: string; label: string }>();
        for (const row of rows) {
          const v = getFilterValue(col, row);
          if (!map.has(v)) map.set(v, { value: v, label: v || "—" });
        }
        result[col.key] = Array.from(map.values());
      }
    }
    return result;
  }, [filterableColumns, rows]);

  function setColumnFilter(key: string, filter: ColumnFilter | null) {
    setFilters((prev) => {
      if (!filter) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: filter };
    });
  }

  function clearAllFilters() {
    setFilters({});
    setFilterOpen(false);
  }

  const activeFilterCount = Object.keys(filters).length;

  function applyFilters(data: T[]): T[] {
    return data.filter((row) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matched = columns.some((c) => {
          if (c.filterable === false) return false;
          return getFilterValue(c, row).toLowerCase().includes(q);
        });
        if (!matched) return false;
      }

      for (const [key, filter] of Object.entries(filters)) {
        const col = columns.find((c) => c.key === key);
        if (!col || col.filterable === false) continue;
        const raw = getFilterValue(col, row);

        switch (filter.kind) {
          case "text":
            if (
              filter.query &&
              !raw.toLowerCase().includes(filter.query.toLowerCase())
            )
              return false;
            break;
          case "number":
            if (filter.min !== "" && Number(raw) < Number(filter.min))
              return false;
            if (filter.max !== "" && Number(raw) > Number(filter.max))
              return false;
            break;
          case "boolean": {
            const boolVal = Boolean(row[col.key as keyof T]);
            if (filter.checked !== null && boolVal !== filter.checked)
              return false;
            break;
          }
          case "select":
            if (filter.selected.length > 0 && !filter.selected.includes(raw))
              return false;
            break;
          case "date": {
            if (filter.from || filter.to) {
              const d = new Date(raw);
              if (filter.from && isNaN(d.getTime())) return false;
              if (filter.from && d < new Date(filter.from)) return false;
              if (filter.to && d > new Date(filter.to)) return false;
            }
            break;
          }
        }
      }
      return true;
    });
  }

  const filtered = applyFilters(rows);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const rowPy =
    prefs.tableRowSize === "sm"
      ? "py-1.5"
      : prefs.tableRowSize === "lg"
        ? "py-3"
        : "py-2";

  // ── Save helpers ────────────────────────────────────────────────────────────

  async function commitEdit(row: T, col: Column<T>, overrideValue?: unknown) {
    if (!editing && overrideValue === undefined) return;
    const raw = overrideValue !== undefined ? overrideValue : draft;
    const v = col.type === "number" ? Number(raw) : raw;
    const current = row[col.key as keyof T];
    if (String(v) === String(current)) {
      setEditing(null);
      return;
    }
    setSaving(true);
    try {
      await onSave?.(row.id, { [col.key]: v } as Partial<T>);
      toast.success(t("common.saved"));
    } catch {
      toast.error(t("common.failedSave"));
    } finally {
      setSaving(false);
      setEditing(null);
    }
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    try {
      await onDelete?.(deleteId);
      toast.success(t("common.deleted"));
    } catch {
      toast.error(t("common.failedDelete"));
    } finally {
      setDeleteId(null);
    }
  }

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          {empty ?? t("common.empty")}
        </p>
        {onCreate && (
          <Button
            size="sm"
            variant="outline"
            className="mt-3 gap-1.5"
            onClick={onCreate}
          >
            <Plus className="h-4 w-4" /> {t("common.addFirst")}
          </Button>
        )}
      </div>
    );
  }

  // ── Table ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Toolbar */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        {searchable && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-8 pl-8 bg-muted/40 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {filterableColumns.length > 0 && (
          <>
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-8">
                  <SlidersHorizontal className="h-4 w-4" />
                  {t("table.filters")}
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 min-w-[1.25rem] px-1 text-xs rounded-full leading-none flex items-center justify-center"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <span className="text-sm font-semibold">
                    {t("table.filters")}
                  </span>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-7 text-xs"
                    >
                      {t("table.clearAll")}
                    </Button>
                  )}
                </div>
                <ScrollArea className="max-h-[60vh] overflow-y-visible">
                  <div className="p-3 space-y-4">
                    {filterableColumns.map((col) => {
                      const kind = getColumnFilterType(col);
                      const current = filters[col.key];
                      const options = selectColumnOptions[col.key] ?? [];

                      return (
                        <div key={col.key} className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {col.label}
                          </label>

                          {kind === "text" && (
                            <Input
                              placeholder={`Filter ${col.label.toLowerCase()}…`}
                              value={
                                current?.kind === "text" ? current.query : ""
                              }
                              onChange={(e) =>
                                setColumnFilter(col.key, {
                                  kind: "text",
                                  query: e.target.value,
                                })
                              }
                              className="h-8 text-sm"
                            />
                          )}

                          {kind === "number" && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="Min"
                                value={
                                  current?.kind === "number" ? current.min : ""
                                }
                                onChange={(e) =>
                                  setColumnFilter(col.key, {
                                    kind: "number",
                                    min: e.target.value,
                                    max:
                                      current?.kind === "number"
                                        ? current.max
                                        : "",
                                  })
                                }
                                className="h-8 text-sm"
                              />
                              <Input
                                type="number"
                                placeholder="Max"
                                value={
                                  current?.kind === "number" ? current.max : ""
                                }
                                onChange={(e) =>
                                  setColumnFilter(col.key, {
                                    kind: "number",
                                    min:
                                      current?.kind === "number"
                                        ? current.min
                                        : "",
                                    max: e.target.value,
                                  })
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                          )}

                          {kind === "boolean" && (
                            <select
                              value={
                                current?.kind === "boolean"
                                  ? current.checked === null
                                    ? "any"
                                    : current.checked
                                      ? "yes"
                                      : "no"
                                  : "any"
                              }
                              onChange={(e) => {
                                const v = e.target.value;
                                setColumnFilter(col.key, {
                                  kind: "boolean",
                                  checked: v === "any" ? null : v === "yes",
                                });
                              }}
                              className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm"
                            >
                              <option value="any">
                                {t("table.filterAny")}
                              </option>
                              <option value="yes">{t("common.yes")}</option>
                              <option value="no">{t("common.no")}</option>
                            </select>
                          )}

                          {kind === "select" && (
                            <ScrollArea className="max-h-40">
                              <div className="space-y-1">
                                {options.map((opt) => {
                                  const checked =
                                    current?.kind === "select" &&
                                    current.selected.includes(opt.value);
                                  return (
                                    <label
                                      key={opt.value}
                                      className="flex items-center gap-2 text-sm cursor-pointer py-0.5"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => {
                                          const next = new Set(
                                            current?.kind === "select"
                                              ? current.selected
                                              : [],
                                          );
                                          if (e.target.checked)
                                            next.add(opt.value);
                                          else next.delete(opt.value);
                                          setColumnFilter(col.key, {
                                            kind: "select",
                                            selected: Array.from(next),
                                          });
                                        }}
                                        className="rounded border-border"
                                      />
                                      <span className="truncate">
                                        {opt.label}
                                      </span>
                                    </label>
                                  );
                                })}
                                {options.length === 0 && (
                                  <p className="text-xs text-muted-foreground py-1">
                                    No values
                                  </p>
                                )}
                              </div>
                            </ScrollArea>
                          )}

                          {kind === "date" && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="date"
                                value={
                                  current?.kind === "date" ? current.from : ""
                                }
                                onChange={(e) =>
                                  setColumnFilter(col.key, {
                                    kind: "date",
                                    from: e.target.value,
                                    to:
                                      current?.kind === "date"
                                        ? current.to
                                        : "",
                                  })
                                }
                                className="h-8 text-sm"
                              />
                              <Input
                                type="date"
                                value={
                                  current?.kind === "date" ? current.to : ""
                                }
                                onChange={(e) =>
                                  setColumnFilter(col.key, {
                                    kind: "date",
                                    from:
                                      current?.kind === "date"
                                        ? current.from
                                        : "",
                                    to: e.target.value,
                                  })
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                          )}

                          {current && !isFilterEmpty(current) && (
                            <button
                              onClick={() => setColumnFilter(col.key, null)}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {t("table.clearFilter")}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 text-xs"
              >
                {t("table.clearAll")}
              </Button>
            )}
          </>
        )}

        {(search || activeFilterCount > 0) && (
          <span className="text-xs text-muted-foreground">
            {filtered.length}{" "}
            {filtered.length !== 1
              ? t("table.results_plural")
              : t("table.results")}
          </span>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          {Object.entries(filters).map(([key, filter]) => {
            const col = columns.find((c) => c.key === key);
            if (!col) return null;
            const summary = summarizeFilter(filter, col);
            if (!summary) return null;
            return (
              <Badge
                key={key}
                variant="secondary"
                className="gap-1 pl-2 pr-1 text-xs"
              >
                {col.label}: {summary}
                <button
                  onClick={() => setColumnFilter(key, null)}
                  className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground select-none"
                >
                  {c.label}
                </th>
              ))}
              {(onSave || onDelete) && <th className="w-10 px-2 py-2.5" />}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {paged.map((row, rowIdx) => (
              <tr
                key={String(row.id)}
                className={cn(
                  "group transition-colors hover:bg-accent/20",
                  rowIdx % 2 === 0 ? "bg-card" : "bg-muted/10",
                )}
              >
                {columns.map((c) => {
                  const isEditing =
                    editing?.id === row.id && editing.key === c.key;
                  const val = row[c.key as keyof T];

                  return (
                    <td
                      key={c.key}
                      className={cn("px-3 align-middle", rowPy)}
                      onDoubleClick={() => {
                        if (!c.editable || !onSave || c.type === "boolean")
                          return;
                        setEditing({ id: row.id, key: c.key });
                        setDraft(String(val ?? ""));
                      }}
                    >
                      {/* ── Boolean / Switch cell ── */}
                      {c.type === "boolean" && c.editable && onSave ? (
                        <Switch
                          size="sm"
                          checked={Boolean(val)}
                          disabled={saving}
                          onCheckedChange={(checked) =>
                            commitEdit(row, c, checked)
                          }
                        />
                      ) : isEditing ? (
                        /* ── Inline text/number edit ── */
                        <div className="flex items-center gap-1">
                          <Input
                            ref={inputRef}
                            type={c.type === "number" ? "number" : "text"}
                            className="h-7 min-w-[80px] w-full text-sm"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            disabled={saving}
                            onKeyDown={async (e) => {
                              if (e.key === "Escape") setEditing(null);
                              if (e.key === "Enter") await commitEdit(row, c);
                            }}
                            onBlur={() => setEditing(null)}
                          />
                          <Button
                            size="icon-sm"
                            variant="ghost-primary"
                            disabled={saving}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              commitEdit(row, c);
                            }}
                            title="Save (Enter)"
                          >
                            <Check />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setEditing(null);
                            }}
                            title="Cancel (Esc)"
                          >
                            <X />
                          </Button>
                        </div>
                      ) : c.render ? (
                        c.render(val, row)
                      ) : c.type === "boolean" ? (
                        /* boolean read-only */
                        <Switch size="sm" checked={Boolean(val)} disabled />
                      ) : c.type === "badge" ||
                        c.key === "status" ||
                        c.key === "role" ? (
                        <Badge
                          variant={
                            c.badgeVariant
                              ? c.badgeVariant(val)
                              : statusVariant(val)
                          }
                          className="text-xs font-medium"
                        >
                          {String(val ?? "—")}
                        </Badge>
                      ) : (
                        <span
                          className={cn(
                            "block truncate max-w-[220px]",
                            c.editable &&
                              onSave &&
                              "cursor-text rounded px-0.5 -mx-0.5 group-hover:bg-muted/60 group-hover:ring-1 group-hover:ring-border transition-all",
                          )}
                          title={String(val ?? "")}
                        >
                          {String(val ?? "—")}
                        </span>
                      )}
                    </td>
                  );
                })}

                {/* ── Row actions ── */}
                {(onSave || onDelete) && (
                  <td className="px-2 align-middle">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {onSave && (
                          <DropdownMenuItem
                            onClick={() => {
                              const firstEditable = columns.find(
                                (c) => c.editable && c.type !== "boolean",
                              );
                              if (firstEditable) {
                                setEditing({
                                  id: row.id,
                                  key: firstEditable.key,
                                });
                                setDraft(
                                  String(
                                    row[firstEditable.key as keyof T] ?? "",
                                  ),
                                );
                              }
                            }}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            const id = String(row.id);
                            navigator.clipboard.writeText(id);
                            toast.success("ID copied");
                          }}
                        >
                          <Copy className="mr-2 h-3.5 w-3.5" /> Copy ID
                        </DropdownMenuItem>
                        {onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => setDeleteId(row.id)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/20">
          <p className="text-[11px] text-muted-foreground">
            {onSave
              ? "Double-click a cell to edit · Enter to save · Esc to cancel"
              : ""}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft />
              </Button>
              <span className="text-xs text-muted-foreground px-1 tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Delete confirmation ── */}
      <AlertDialog
        open={deleteId != null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The record will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                "bg-destructive text-destructive-foreground",
                "hover:bg-destructive/90 focus-visible:ring-destructive",
              )}
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── DataPageScaffold ─────────────────────────────────────────────────────────

export function DataPageScaffold({
  title,
  description,
  fetcher,
  columns,
  saveEndpoint,
  deleteEndpoint,
  createConfig,
  exportUrl,
}: {
  title: string;
  description?: string;
  fetcher: () => Promise<
    Array<Record<string, unknown> & { id: string | number }>
  >;
  columns: Column<Record<string, unknown> & { id: string | number }>[];
  saveEndpoint?: (
    id: string | number,
    patch: Record<string, unknown>,
  ) => Promise<void>;
  deleteEndpoint?: (id: string | number) => Promise<void>;
  createConfig?: CreateDialogConfig;
  /** If provided, shows an Export button that downloads from this URL as .xlsx */
  exportUrl?: string;
}) {
  const [rows, setRows] = useState<
    Array<Record<string, unknown> & { id: string | number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    fetcher()
      .then(setRows)
      .catch((e) => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    fetcher()
      .then((d) => {
        if (live) setRows(d);
      })
      .catch((e) => {
        if (live) setError(e?.message ?? "Failed to load");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [fetcher]);

  async function handleExport() {
    if (!exportUrl || exporting) return;
    setExporting(true);
    try {
      const { data } = await api.get(exportUrl, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      const filename = `${title.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        action={
          (exportUrl || createConfig) ? (
            <div className="flex gap-2">
              {exportUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 shrink-0"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  <Download className="h-4 w-4" />
                  {exporting ? "Exporting…" : "Export"}
                </Button>
              )}
              {createConfig && (
                <Button
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-lg bg-muted/40 animate-pulse"
              style={{ opacity: 1 - i * 0.12 }}
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button size="sm" variant="outline-destructive" onClick={load}>
            Retry
          </Button>
        </div>
      ) : (
        <EditableTable
          rows={rows}
          columns={columns}
          onSave={
            saveEndpoint
              ? async (id, patch) => {
                  setRows((r) =>
                    r.map((x) => (x.id === id ? { ...x, ...patch } : x)),
                  );
                  await saveEndpoint(id, patch as Record<string, unknown>);
                }
              : undefined
          }
          onDelete={
            deleteEndpoint
              ? async (id) => {
                  setRows((r) => r.filter((x) => x.id !== id));
                  await deleteEndpoint(id);
                }
              : undefined
          }
        />
      )}

      {/* Create dialog */}
      {createConfig && (
        <CreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          config={createConfig}
          onCreated={(record) => setRows((r) => [record as any, ...r])}
        />
      )}
    </div>
  );
}