import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Column<T> = {
  key: keyof T & string;
  label: string;
  editable?: boolean;
  type?: "text" | "number";
};

type Props<T extends { id: string | number }> = {
  rows: T[];
  columns: Column<T>[];
  onSave?: (id: T["id"], patch: Partial<T>) => Promise<void> | void;
  empty?: string;
};

export function EditableTable<T extends { id: string | number }>({
  rows, columns, onSave, empty = "No rows",
}: Props<T>) {
  const [editing, setEditing] = useState<{ id: T["id"]; key: string } | null>(null);
  const [draft, setDraft] = useState<string>("");

  useEffect(() => { setEditing(null); }, [rows.length]);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2 text-left font-medium">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row.id)} className="border-t border-border hover:bg-accent/40 transition-colors">
              {columns.map((c) => {
                const isEditing = editing?.id === row.id && editing.key === c.key;
                return (
                  <td
                    key={c.key}
                    className="px-3 py-2 align-middle"
                    onDoubleClick={() => {
                      if (!c.editable) return;
                      setEditing({ id: row.id, key: c.key });
                      setDraft(String(row[c.key] ?? ""));
                    }}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <Input
                          autoFocus
                          type={c.type === "number" ? "number" : "text"}
                          className="h-7 w-full"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === "Escape") setEditing(null);
                            if (e.key === "Enter") {
                              const v = c.type === "number" ? Number(draft) : draft;
                              await onSave?.(row.id, { [c.key]: v } as Partial<T>);
                              setEditing(null);
                            }
                          }}
                          onBlur={() => setEditing(null)}
                        />
                      </div>
                    ) : (
                      <span className={c.editable ? "cursor-text" : ""}>
                        {String(row[c.key] ?? "—")}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 text-[11px] text-muted-foreground border-t border-border">
        Tip: double-click any cell to edit · Enter to save · Esc to cancel
      </div>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function DataPageScaffold({
  title, description, fetcher, columns, saveEndpoint,
}: {
  title: string;
  description?: string;
  fetcher: () => Promise<Array<Record<string, unknown> & { id: string | number }>>;
  columns: Column<Record<string, unknown> & { id: string | number }>[];
  saveEndpoint?: (id: string | number, patch: Record<string, unknown>) => Promise<void>;
}) {
  const [rows, setRows] = useState<Array<Record<string, unknown> & { id: string | number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    fetcher()
      .then((d) => { if (live) setRows(d); })
      .catch(() => { if (live) setRows([]); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [fetcher]);

  return (
    <div>
      <PageHeader title={title} description={description}
        action={<Button size="sm" variant="outline">New</Button>} />
      {loading ? (
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Loading…</CardTitle></CardHeader><CardContent /></Card>
      ) : (
        <EditableTable
          rows={rows}
          columns={columns}
          onSave={async (id, patch) => {
            setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
            if (saveEndpoint) {
              try { await saveEndpoint(id, patch as Record<string, unknown>); }
              catch { /* keep optimistic */ }
            }
          }}
        />
      )}
    </div>
  );
}
