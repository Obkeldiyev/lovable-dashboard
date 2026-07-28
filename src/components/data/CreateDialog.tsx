/**
 * CreateDialog — generic "New record" dialog.
 *
 * Supports flat fields AND dynamic line-item arrays for entities like
 * Purchase Orders, Receivings, and Order Reservations.
 *
 * Field types:
 *  - text / email / tel / number / date / uuid — plain Input
 *  - textarea — Textarea
 *  - select — static Select with predefined options
 *  - fetchselect — FetchCombobox that loads options from an API endpoint
 *  - items — repeatable table rows, each column can also use fetchselect
 */
import { useState } from "react";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FetchCombobox } from "@/components/ui/fetch-combobox";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

// ─── Field type definitions ───────────────────────────────────────────────────

export type ScalarFieldDef = {
  key: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "date" | "uuid";
  required?: boolean;
  placeholder?: string;
};

export type TextareaFieldDef = {
  key: string;
  label: string;
  type: "textarea";
  required?: boolean;
  placeholder?: string;
};

export type SelectFieldDef = {
  key: string;
  label: string;
  type: "select";
  required?: boolean;
  options: { value: string; label: string }[];
};

/**
 * A combobox that fetches its options from an API endpoint.
 * The user sees names/labels and the form stores UUIDs.
 */
export type FetchSelectFieldDef = {
  key: string;
  label: string;
  type: "fetchselect";
  /** API endpoint to GET options from, e.g. "/api/warehouses" */
  fetchUrl: string;
  /** Field on each item to display as the option label. Default: "name" */
  labelKey?: string;
  /** Field on each item to use as the form value (UUID). Default: "id" */
  valueKey?: string;
  /** Extra fields to include in the search index. E.g. ["sku", "code"] */
  searchKeys?: string[];
  required?: boolean;
  placeholder?: string;
};

/**
 * A combobox whose options depend on the current value of another field
 * (e.g. zones depend on the selected warehouse).
 *
 * `fetchUrl` is a builder fn — it receives the parent field's current value
 * and returns the endpoint to query. The field is disabled until the parent
 * has a value, and its own value is cleared whenever the parent changes.
 */
export type DependentFetchSelectFieldDef = {
  key: string;
  label: string;
  type: "dependentfetchselect";
  /** key of the field this one depends on, e.g. "warehouseId" */
  dependsOn: string;
  /** URL builder: (parentValue) => `/api/warehouses/${parentValue}/zones` */
  fetchUrl: (parentValue: string) => string;
  labelKey?: string;
  valueKey?: string;
  searchKeys?: string[];
  required?: boolean;
  placeholder?: string;
  /** Shown in place of the combobox while the parent field is empty */
  placeholderBeforeParent?: string;
};

/**
 * A repeatable set of sub-fields (line items like PO items, receiving items).
 * The value is stored as an array of objects, one per row.
 */
export type ItemsFieldDef = {
  key: string;
  label: string;
  type: "items";
  required?: boolean;
  columns: (ScalarFieldDef | SelectFieldDef | FetchSelectFieldDef)[];
};

export type FieldDef =
  | ScalarFieldDef
  | TextareaFieldDef
  | SelectFieldDef
  | FetchSelectFieldDef
  | DependentFetchSelectFieldDef
  | ItemsFieldDef;

export type CreateDialogConfig = {
  title: string;
  postUrl: string;
  fields: FieldDef[];
  /** Extra computed fields merged into the body after form values are collected */
  extraBody?: (values: Record<string, string>, items: Record<string, string>[]) => Record<string, unknown>;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  config: CreateDialogConfig;
  onCreated: (record: unknown) => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyRow(columns: (ScalarFieldDef | SelectFieldDef | FetchSelectFieldDef)[]): Record<string, string> {
  return Object.fromEntries(columns.map((c) => [c.key, ""]));
}

function castRowValue(val: string, type?: string): unknown {
  if (type === "number") return val === "" ? undefined : Number(val);
  return val === "" ? undefined : val;
}

// ─── Field renderer helpers ───────────────────────────────────────────────────

/** Renders a scalar (non-items) field */
function ScalarField({
  f,
  value,
  onChange,
  values,
}: {
  f: ScalarFieldDef | TextareaFieldDef | SelectFieldDef | FetchSelectFieldDef | DependentFetchSelectFieldDef;
  value: string;
  onChange: (v: string) => void;
  /** Full form values — needed by dependentfetchselect to read its parent field */
  values: Record<string, string>;
}) {
  const { t } = useTranslation();
  if (f.type === "fetchselect") {
    const ff = f as FetchSelectFieldDef;
    return (
      <FetchCombobox
        fetchUrl={ff.fetchUrl}
        labelKey={ff.labelKey}
        valueKey={ff.valueKey}
        searchKeys={ff.searchKeys}
        placeholder={ff.placeholder ?? t("createDialog.selectPlaceholder",{label: ff.label.toLowerCase()})}
        value={value}
        onValueChange={onChange}
      />
    );
  }

  if (f.type === "dependentfetchselect") {
    const df = f as DependentFetchSelectFieldDef;
    const parentValue = values[df.dependsOn];

    if (!parentValue) {
      return (
        <Button
          type="button"
          variant="outline"
          disabled
          className="w-full justify-start font-normal h-9 text-sm text-muted-foreground"
        >
          {df.placeholderBeforeParent ?? t("createDialog.selectParentFirst")}
        </Button>
      );
    }

    return (
      <FetchCombobox
        // Remount when the parent value changes so stale options/state
        // from the previous parent never leak into the new list.
        key={parentValue}
        fetchUrl={df.fetchUrl(parentValue)}
        labelKey={df.labelKey}
        valueKey={df.valueKey}
        searchKeys={df.searchKeys}
        placeholder={df.placeholder ?? `Select ${df.label.toLowerCase()}…`}
        value={value}
        onValueChange={onChange}
      />
    );
  }

  if (f.type === "select") {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={f.key} className="h-9">
          <SelectValue placeholder={`Select ${f.label.toLowerCase()}…`} />
        </SelectTrigger>
        <SelectContent>
          {(f as SelectFieldDef).options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (f.type === "textarea") {
    return (
      <Textarea
        id={f.key}
        placeholder={(f as TextareaFieldDef).placeholder ?? t("createDialog.inputPlaceholder", {label: f.label.toLowerCase()})}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="resize-none text-sm"
      />
    );
  }

  // text / email / tel / number / date / uuid
  return (
    <Input
      id={f.key}
      type={(f as ScalarFieldDef).type === "uuid" ? "text" : ((f as ScalarFieldDef).type ?? "text")}
      placeholder={(f as ScalarFieldDef).placeholder ?? t("createDialog.inputPlaceholder", {label: f.label.toLowerCase()})}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 text-sm"
    />
  );
}

/** Renders a single cell inside an items row */
function RowCell({
  col,
  value,
  onChange,
}: {
  col: ScalarFieldDef | SelectFieldDef | FetchSelectFieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  if (col.type === "fetchselect") {
    const fc = col as FetchSelectFieldDef;
    return (
      <FetchCombobox
        fetchUrl={fc.fetchUrl}
        labelKey={fc.labelKey}
        valueKey={fc.valueKey}
        searchKeys={fc.searchKeys}
        placeholder={fc.placeholder ?? col.label}
        value={value}
        onValueChange={onChange}
        compact
      />
    );
  }

  if (col.type === "select") {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 text-xs">
          <SelectValue placeholder={col.label} />
        </SelectTrigger>
        <SelectContent>
          {(col as SelectFieldDef).options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      type={(col as ScalarFieldDef).type === "number" ? "number" : "text"}
      placeholder={(col as ScalarFieldDef).placeholder ?? col.label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 text-xs"
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CreateDialog({ open, onOpenChange, config, onCreated }: Props) {
  const tenantId = useAppSelector((s) => s.auth.user?.tenantId ?? "");
  const [values, setValues] = useState<Record<string, string>>({});
  const [itemsMap, setItemsMap] = useState<Record<string, Record<string, string>[]>>({});
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  const itemFields = config.fields.filter((f): f is ItemsFieldDef => f.type === "items");
  const scalarFields = config.fields.filter(
    (f): f is ScalarFieldDef | TextareaFieldDef | SelectFieldDef | FetchSelectFieldDef | DependentFetchSelectFieldDef =>
      f.type !== "items",
  );
  // Fields that depend on another field's value — used to clear them when their parent changes.
  const dependentFields = scalarFields.filter(
    (f): f is DependentFetchSelectFieldDef => f.type === "dependentfetchselect",
  );

  function reset() {
    setValues({});
    setItemsMap({});
    setSaving(false);
  }

  function setVal(key: string, val: string) {
    setValues((v) => {
      const next = { ...v, [key]: val };
      // Clear any field whose options depend on this one, since its
      // previously selected option may no longer be valid.
      for (const df of dependentFields) {
        if (df.dependsOn === key) next[df.key] = "";
      }
      return next;
    });
  }

  function getItems(
    key: string,
    columns: (ScalarFieldDef | SelectFieldDef | FetchSelectFieldDef)[],
  ): Record<string, string>[] {
    return itemsMap[key] ?? [emptyRow(columns)];
  }

  function addRow(key: string, columns: (ScalarFieldDef | SelectFieldDef | FetchSelectFieldDef)[]) {
    setItemsMap((m) => ({
      ...m,
      [key]: [...(m[key] ?? [emptyRow(columns)]), emptyRow(columns)],
    }));
  }

  function removeRow(key: string, idx: number) {
    setItemsMap((m) => {
      const rows = m[key] ?? [];
      if (rows.length <= 1) return m;
      return { ...m, [key]: rows.filter((_, i) => i !== idx) };
    });
  }

  function setRowVal(key: string, idx: number, col: string, val: string) {
    setItemsMap((m) => {
      const rows = [...(m[key] ?? [])];
      rows[idx] = { ...rows[idx], [col]: val };
      return { ...m, [key]: rows };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate required scalar fields
    for (const f of scalarFields) {
      if (f.required && !values[f.key]?.trim()) {
        toast.error(t("createDialog.requiredField",{label: f.label}));
        return;
      }
    }

    // Validate required item fields
    for (const f of itemFields) {
      const rows = getItems(f.key, f.columns);
      if (f.required) {
        const hasData = rows.some((r) => Object.values(r).some((v) => v.trim() !== ""));
        if (!hasData) {
          toast.error(t("createDialog.requiredRow",{label: f.label}));
          return;
        }
      }
    }

    // Build body
    const body: Record<string, unknown> = { tenantId };

    for (const f of scalarFields) {
      const val = values[f.key];
      if (val === undefined || val === "") continue;
      body[f.key] = (f as ScalarFieldDef).type === "number" ? Number(val) : val;
    }

    for (const f of itemFields) {
      const rows = getItems(f.key, f.columns);
      const coerced = rows
        .filter((r) => Object.values(r).some((v) => v.trim() !== ""))
        .map((r) => {
          const obj: Record<string, unknown> = {};
          for (const col of f.columns) {
            const v = r[col.key];
            const cast = castRowValue(v ?? "", (col as ScalarFieldDef).type);
            if (cast !== undefined) obj[col.key] = cast;
          }
          return obj;
        });
      if (coerced.length > 0) body[f.key] = coerced;
    }

    if (config.extraBody) {
      const firstItems =
        itemFields.length > 0 ? getItems(itemFields[0].key, itemFields[0].columns) : [];
      Object.assign(body, config.extraBody(values, firstItems));
    }

    setSaving(true);
    try {
      const { data } = await api.post(config.postUrl, body);
      const record = data?.data ?? data;
      toast.success(t("createDialog.createdSuccess", { title: config.title }));
      onCreated(record);
      reset();
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? t("createDialog.createFailed", { title: config.title });
      toast.error(msg);
    } finally {
      setSaving(false);
    }
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("createdDialog.newRecord",{label: config.title})}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-0 min-h-0">
          <div className="overflow-y-auto pr-1 space-y-3 py-1 flex-1">

            {/* ── Scalar / FetchSelect / Select / Textarea fields ── */}
            {scalarFields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={f.key} className="text-sm">
                  {f.label}
                  {f.required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                <ScalarField
                  f={f}
                  value={values[f.key] ?? ""}
                  onChange={(v) => setVal(f.key, v)}
                  values={values}
                />
              </div>
            ))}

            {/* ── Items fields ── */}
            {itemFields.map((f) => {
              const rows = getItems(f.key, f.columns);
              return (
                <div key={f.key} className="space-y-2">
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      {f.label}
                      {f.required && <span className="text-destructive ml-0.5">*</span>}
                    </Label>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => addRow(f.key, f.columns)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> {t("createDialog.addRow")}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {/* Column headers */}
                    <div
                      className="grid gap-1.5 text-xs font-medium text-muted-foreground"
                      style={{
                        gridTemplateColumns: `repeat(${f.columns.length}, 1fr) 24px`,
                      }}
                    >
                      {f.columns.map((c) => (
                        <span key={c.key}>{c.label}</span>
                      ))}
                      <span />
                    </div>

                    {rows.map((row, idx) => (
                      <div
                        key={idx}
                        className="grid gap-1.5 items-center"
                        style={{
                          gridTemplateColumns: `repeat(${f.columns.length}, 1fr) 24px`,
                        }}
                      >
                        {f.columns.map((col) => (
                          <RowCell
                            key={col.key}
                            col={col}
                            value={row[col.key] ?? ""}
                            onChange={(v) => setRowVal(f.key, idx, col.key, v)}
                          />
                        ))}
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="ghost-destructive"
                          onClick={() => removeRow(f.key, idx)}
                          disabled={rows.length === 1}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="pt-3 gap-2 shrink-0 border-t mt-3">
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
              {t("createDialog.cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? t("createDialog.creating") : t("createDialog.create", { label: config.title })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}