import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, MoreHorizontal, Check, X, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store";

export type Column<T> = {
  key: keyof T & string;
  label: string;
  editable?: boolean;
  type?: "text" | "number" | "badge";
  badgeVariant?: (val: unknown) => "default" | "secondary" | "destructive" | "outline";
  render?: (val: unknown, row: T) => React.ReactNode;
};

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

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  active: "default",
  COMPLETED: "default",
  completed: "default",
  DELIVERED: "default",
  delivered: "default",
  PENDING: "secondary",
  pending: "secondary",
  IN_PROGRESS: "secondary",
  in_progress: "secondary",
  SUSPENDED: "destructive",
  suspended: "destructive",
  CANCELLED: "destructive",
  cancelled: "destructive",
  DELETED: "destructive",
  deleted: "destructive",
  INVITED: "outline",
  invited: "outline",
  BLOCKED: "destructive",
  blocked: "destructive",
};

function statusVariant(val: unknown): "default" | "secondary" | "destructive" | "outline" {
  return STATUS_COLORS[String(val)] ?? "secondary";
}

export function EditableTable<T extends { id: string | number }>({
  rows,
  columns,
  onSave,
  onDelete,
  onCreate,
  empty = "No records found",
  searchable = true,
}: Props<T>) {
  const prefs = useAppSelector((s) => s.preferences);
  const [editing, setEditing] = useState<{ id: T["id"]; key: string } | null>(null);
  const [draft, setDraft] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<T["id"] | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const pageSize = prefs.defaultPageSize;

  useEffect(() => { setEditing(null); setPage(1); }, [rows.length]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const filtered = search
    ? rows.filter((row) =>
        columns.some((c) => String(row[c.key] ?? "").toLowerCase().includes(search.toLowerCase()))
      )
    : rows;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const rowPadding = prefs.tableRowSize === "sm" ? "py-1.5" : prefs.tableRowSize === "lg" ? "py-3" : "py-2";

  async function commitEdit(row: T, col: Column<T>) {
    if (!editing) return;
    const v = col.type === "number" ? Number(draft) : draft;
    const current = String(row[col.key as keyof T] ?? "");
    if (String(v) === current) { setEditing(null); return; }
    setSaving(true);
    try {
      await onSave?.(row.id, { [col.key]: v } as Partial<T>);
      toast.success("Saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
      setEditing(null);
    }
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    try {
      await onDelete?.(deleteId);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">{empty}</p>
        {onCreate && (
          <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={onCreate}>
            <Plus className="h-4 w-4" /> Add first record
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Search bar */}
      {searchable && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-9 pl-8 bg-muted/40"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {search && (
            <span className="text-xs text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {c.label}
                </th>
              ))}
              {(onSave || onDelete) && (
                <th className="w-10 px-2 py-2.5" />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.map((row, rowIdx) => (
              <tr
                key={String(row.id)}
                className={cn(
                  "group transition-colors hover:bg-accent/30",
                  rowIdx % 2 === 0 ? "bg-card" : "bg-muted/10",
                )}
              >
                {columns.map((c) => {
                  const isEditing = editing?.id === row.id && editing.key === c.key;
                  const val = row[c.key as keyof T];

                  return (
                    <td
                      key={c.key}
                      className={cn("px-3 align-middle", rowPadding)}
                      onDoubleClick={() => {
                        if (!c.editable || !onSave) return;
                        setEditing({ id: row.id, key: c.key });
                        setDraft(String(val ?? ""));
                      }}
                    >
                      {isEditing ? (
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
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0 text-green-600"
                            disabled={saving}
                            onMouseDown={(e) => { e.preventDefault(); commitEdit(row, c); }}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0"
                            onMouseDown={(e) => { e.preventDefault(); setEditing(null); }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : c.render ? (
                        c.render(val, row)
                      ) : c.type === "badge" || c.key === "status" || c.key === "role" ? (
                        <Badge variant={c.badgeVariant ? c.badgeVariant(val) : statusVariant(val)} className="text-xs">
                          {String(val ?? "—")}
                        </Badge>
                      ) : (
                        <span
                          className={cn(
                            "block truncate max-w-[200px]",
                            c.editable && onSave && "cursor-text group-hover:underline group-hover:decoration-dashed group-hover:underline-offset-2 group-hover:decoration-muted-foreground/40",
                          )}
                          title={String(val ?? "")}
                        >
                          {String(val ?? "—")}
                        </span>
                      )}
                    </td>
                  );
                })}

                {/* Row actions */}
                {(onSave || onDelete) && (
                  <td className="px-2 align-middle">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onSave && (
                          <DropdownMenuItem
                            onClick={() => {
                              const firstEditable = columns.find((c) => c.editable);
                              if (firstEditable) {
                                setEditing({ id: row.id, key: firstEditable.key });
                                setDraft(String(row[firstEditable.key as keyof T] ?? ""));
                              }
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(row.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer: tip + pagination */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/20">
          <p className="text-[11px] text-muted-foreground">
            {onSave ? "Double-click any cell to edit · Enter to save · Esc to cancel" : ""}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-1">
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId != null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The record will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
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

export function DataPageScaffold({
  title,
  description,
  fetcher,
  columns,
  saveEndpoint,
  deleteEndpoint,
}: {
  title: string;
  description?: string;
  fetcher: () => Promise<Array<Record<string, unknown> & { id: string | number }>>;
  columns: Column<Record<string, unknown> & { id: string | number }>[];
  saveEndpoint?: (id: string | number, patch: Record<string, unknown>) => Promise<void>;
  deleteEndpoint?: (id: string | number) => Promise<void>;
}) {
  const [rows, setRows] = useState<Array<Record<string, unknown> & { id: string | number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    fetcher()
      .then((d) => { if (live) setRows(d); })
      .catch((e) => { if (live) setError(e?.message ?? "Failed to load"); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [fetcher]);

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        action={
          <Button size="sm" className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" />
            New
          </Button>
        }
      />
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 rounded-md bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => {
              setLoading(true);
              setError(null);
              fetcher()
                .then(setRows)
                .catch((e) => setError(e?.message ?? "Failed to load"))
                .finally(() => setLoading(false));
            }}
          >
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
                  setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
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
    </div>
  );
}
