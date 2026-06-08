import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EditableTable, type Column } from "@/components/data/EditableTable";
import { makeListLoader, makePatcher, makeDeleter } from "@/components/data/GenericPage";
import { Plus } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Brand    = { id: string; name: string };
type Category = { id: string; name: string; path?: string };

type ProductRow = Record<string, unknown> & { id: string | number };

const PRODUCT_TYPES = [
  { value: "STOCK",   label: "Stock — physical inventory" },
  { value: "SERVICE", label: "Service — no stock tracking" },
  { value: "DIGITAL", label: "Digital — virtual / download" },
  { value: "BUNDLE",  label: "Bundle — kit of products" },
] as const;

const COLUMNS: Column<ProductRow>[] = [
  { key: "sku",          label: "SKU",      editable: true },
  { key: "name",         label: "Name",     editable: true },
  { key: "type",         label: "Type",     type: "badge" },
  { key: "brand",        label: "Brand",    render: (v: any) => v?.name ?? "—" },
  { key: "category",     label: "Category", render: (v: any) => v?.name ?? "—" },
  { key: "unit",         label: "Unit",     editable: true },
  { key: "defaultCost",  label: "Cost",     type: "number", editable: true },
  { key: "defaultPrice", label: "Price",    type: "number", editable: true },
  { key: "isActive",     label: "Active",   render: (v: any) => v ? "Yes" : "No" },
];

// ─── Create Product Dialog ────────────────────────────────────────────────────

function CreateProductDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (product: unknown) => void;
}) {
  const tenantId = useAppSelector((s) => s.auth.user?.tenantId ?? "");

  const [brands,     setBrands]     = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving,     setSaving]     = useState(false);

  const [form, setForm] = useState({
    sku:          "",
    name:         "",
    type:         "STOCK",
    brandId:      "",
    categoryId:   "",
    unit:         "",
    description:  "",
    defaultCost:  "",
    defaultPrice: "",
    taxRate:      "",
    weightKg:     "",
    lengthCm:     "",
    widthCm:      "",
    heightCm:     "",
  });

  // Load brands and categories when dialog opens
  useEffect(() => {
    if (!open) return;
    api.get("/api/brands")
      .then(({ data }) => setBrands(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setBrands([]));
    api.get("/api/categories")
      .then(({ data }) => setCategories(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setCategories([]));
  }, [open]);

  function set(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function reset() {
    setForm({
      sku: "", name: "", type: "STOCK", brandId: "", categoryId: "",
      unit: "", description: "", defaultCost: "", defaultPrice: "",
      taxRate: "", weightKg: "", lengthCm: "", widthCm: "", heightCm: "",
    });
    setSaving(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sku.trim())  { toast.error("SKU is required");  return; }
    if (!form.name.trim()) { toast.error("Name is required"); return; }

    const num = (v: string) => v.trim() === "" ? undefined : Number(v);

    const body: Record<string, unknown> = {
      tenantId,
      sku:          form.sku.trim(),
      name:         form.name.trim(),
      type:         form.type || undefined,
      unit:         form.unit.trim()         || undefined,
      description:  form.description.trim()  || undefined,
      brandId:      form.brandId             || undefined,
      categoryId:   form.categoryId          || undefined,
      defaultCost:  num(form.defaultCost),
      defaultPrice: num(form.defaultPrice),
      taxRate:      num(form.taxRate),
      weightKg:     num(form.weightKg),
      lengthCm:     num(form.lengthCm),
      widthCm:      num(form.widthCm),
      heightCm:     num(form.heightCm),
    };

    // Remove undefined keys so backend defaults apply
    Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);

    setSaving(true);
    try {
      const { data } = await api.post("/api/products", body);
      const record = data?.data ?? data;
      toast.success("Product created");
      onCreated(record);
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to create product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="sm:max-w-lg max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 gap-0">
          <div className="overflow-y-auto pr-1 space-y-3 py-1 flex-1">

            {/* ── Required ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>SKU <span className="text-destructive">*</span></Label>
                <Input value={form.sku} onChange={(e) => set("sku", e.target.value)}
                  placeholder="e.g. PROD-001" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Input value={form.unit} onChange={(e) => set("unit", e.target.value)}
                  placeholder="pcs / kg / box" className="h-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)}
                placeholder="Product display name" className="h-9" />
            </div>

            {/* ── Type ── */}
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ── Brand & Category (live dropdowns) ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Brand</Label>
                <Select value={form.brandId} onValueChange={(v) => set("brandId", v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select brand…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— None —</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                    {brands.length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        No brands yet — create one first
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select category…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— None —</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.path ? `${c.path}` : c.name}
                      </SelectItem>
                    ))}
                    {categories.length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        No categories yet — create one first
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Description ── */}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder="Optional description…" rows={2} className="resize-none text-sm" />
            </div>

            {/* ── Pricing ── */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Cost Price</Label>
                <Input type="number" value={form.defaultCost} onChange={(e) => set("defaultCost", e.target.value)}
                  placeholder="0.00" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label>Sale Price</Label>
                <Input type="number" value={form.defaultPrice} onChange={(e) => set("defaultPrice", e.target.value)}
                  placeholder="0.00" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label>Tax %</Label>
                <Input type="number" value={form.taxRate} onChange={(e) => set("taxRate", e.target.value)}
                  placeholder="0" className="h-9" />
              </div>
            </div>

            {/* ── Dimensions ── */}
            <div className="grid grid-cols-4 gap-2">
              {(["weightKg", "lengthCm", "widthCm", "heightCm"] as const).map((k) => (
                <div key={k} className="space-y-1.5">
                  <Label className="text-xs">{k === "weightKg" ? "Weight kg" : k === "lengthCm" ? "L cm" : k === "widthCm" ? "W cm" : "H cm"}</Label>
                  <Input type="number" value={form[k]} onChange={(e) => set(k, e.target.value)}
                    placeholder="0" className="h-8 text-xs" />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t shrink-0 gap-2 mt-3">
            <Button type="button" variant="outline" size="sm" disabled={saving}
              onClick={() => { onOpenChange(false); reset(); }}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Creating…" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── ProductsPage ─────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [rows,       setRows]       = useState<ProductRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const fetcher = useCallback(makeListLoader("/api/products"), []);
  const patcher = useCallback(makePatcher("/api/products"), []);
  const deleter = useCallback(makeDeleter("/api/products"), []);

  function load() {
    setLoading(true);
    setError(null);
    fetcher()
      .then(setRows)
      .catch((e) => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    document.title = "Products · VMS";
    load();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Products</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Product catalog</p>
        </div>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-muted/40 animate-pulse" style={{ opacity: 1 - i * 0.12 }} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button size="sm" variant="outline-destructive" onClick={load}>Retry</Button>
        </div>
      ) : (
        <EditableTable
          rows={rows}
          columns={COLUMNS}
          onSave={async (id, patch) => {
            setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
            await patcher(id, patch as Record<string, unknown>);
          }}
          onDelete={async (id) => {
            setRows((r) => r.filter((x) => x.id !== id));
            await deleter(id);
          }}
        />
      )}

      <CreateProductDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(record) => setRows((r) => [record as ProductRow, ...r])}
      />
    </div>
  );
}
