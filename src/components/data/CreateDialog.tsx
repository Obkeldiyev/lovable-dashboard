/**
 * CreateDialog — generic "New record" dialog.
 *
 * Pass a `fields` array describing the form, a `postUrl` to POST to,
 * and an `onCreated` callback. Automatically injects tenantId from auth.
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── Field definition ─────────────────────────────────────────────────────────

export type FieldDef =
  | { key: string; label: string; type?: "text" | "email" | "tel" | "number" | "date"; required?: boolean; placeholder?: string }
  | { key: string; label: string; type: "textarea"; required?: boolean; placeholder?: string }
  | { key: string; label: string; type: "select"; required?: boolean; options: { value: string; label: string }[] }
  | { key: string; label: string; type: "items"; required?: boolean };  // handled per-page via custom render

export type CreateDialogConfig = {
  /** Title shown in the dialog header */
  title: string;
  /** POST endpoint, e.g. "/api/brands" */
  postUrl: string;
  /** Field definitions */
  fields: FieldDef[];
  /** Extra static body fields merged on submit (e.g. for complex nested objects) */
  extraBody?: (values: Record<string, string>) => Record<string, unknown>;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  config: CreateDialogConfig;
  onCreated: (record: unknown) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateDialog({ open, onOpenChange, config, onCreated }: Props) {
  const tenantId = useAppSelector((s) => s.auth.user?.tenantId ?? "");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function reset() {
    setValues({});
    setSaving(false);
  }

  function set(key: string, val: string) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate required
    for (const f of config.fields) {
      if (f.required && !values[f.key]?.trim()) {
        toast.error(`${f.label} is required`);
        return;
      }
    }

    // Build body
    const body: Record<string, unknown> = { tenantId };
    for (const f of config.fields) {
      if (f.type === "number") {
        if (values[f.key] !== undefined && values[f.key] !== "")
          body[f.key] = Number(values[f.key]);
      } else if (f.type !== "items") {
        if (values[f.key] !== undefined && values[f.key] !== "")
          body[f.key] = values[f.key];
      }
    }
    if (config.extraBody) {
      Object.assign(body, config.extraBody(values));
    }

    setSaving(true);
    try {
      const { data } = await api.post(config.postUrl, body);
      const record = data?.data ?? data;
      toast.success(`${config.title} created`);
      onCreated(record);
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? `Failed to create ${config.title}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New {config.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 py-1">
          {config.fields.filter((f) => f.type !== "items").map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={f.key} className="text-sm">
                {f.label}
                {f.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>

              {f.type === "select" ? (
                <Select
                  value={values[f.key] ?? ""}
                  onValueChange={(v) => set(f.key, v)}
                >
                  <SelectTrigger id={f.key} className="h-9">
                    <SelectValue placeholder={`Select ${f.label.toLowerCase()}…`} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea
                  id={f.key}
                  placeholder={f.placeholder ?? `Enter ${f.label.toLowerCase()}…`}
                  rows={3}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="resize-none text-sm"
                />
              ) : (
                <Input
                  id={f.key}
                  type={f.type ?? "text"}
                  placeholder={f.placeholder ?? `Enter ${f.label.toLowerCase()}…`}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="h-9 text-sm"
                />
              )}
            </div>
          ))}

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => { onOpenChange(false); reset(); }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Creating…" : `Create ${config.title}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
