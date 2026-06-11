/**
 * ProductsPage — Full product catalog with Smartup-style fields.
 *
 * Fields matching the screenshot:
 * - Name (Название) *
 * - Alternative name (Альтернативное название)
 * - SKU / Код
 * - ИКПУ (tax product code, Kazakhstan/Uzbekistan)
 * - ТН ВЭД (customs commodity code)
 * - Barcode (Штрих-код)
 * - Unit (Ед. изм.) *
 * - Type (Тип) — STOCK / SERVICE / DIGITAL / BUNDLE
 * - Is product / Is production / Is raw / Is promo (checkboxes)
 * - Is new (Новинка)
 * - Status active (toggle)
 * - Brand
 * - Category
 * - Product sets / Наборы ТМЦ (tags)
 * - Supplier link
 * - Case level 1 type + qty (Тип кейса 1 уровень, Кол-во в кейсе 1)
 * - Case level 2 type + qty (Тип кейса 2 уровень, Кол-во в кейсе 2)
 * - Cost price / Sale price / Tax %
 * - Weight, dimensions
 * - Description
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EditableTable, type Column } from "@/components/data/EditableTable";
import { makeListLoader, makePatcher, makeDeleter } from "@/components/data/GenericPage";
import { Plus, Search, X, Image, Package } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Brand    = { id: string; name: string };
type Category = { id: string; name: string; path?: string };
type Supplier = { id: string; name: string };

type ProductRow = Record<string, unknown> & { id: string | number };

const PRODUCT_TYPES = [
  { value: "STOCK",   label: "Stock — physical inventory" },
  { value: "SERVICE", label: "Service — no stock tracking" },
  { value: "DIGITAL", label: "Digital — virtual / download" },
  { value: "BUNDLE",  label: "Bundle — kit of products" },
] as const;

const COLUMNS: Column<ProductRow>[] = [
  { key: "sku",          label: "SKU/Code",  editable: true },
  { key: "name",         label: "Name",      editable: true },
  { key: "type",         label: "Type",      type: "badge" },
  { key: "brand",        label: "Brand",     render: (v: any) => v?.name ?? "—" },
  { key: "category",     label: "Category",  render: (v: any) => v?.name ?? "—" },
  { key: "unit",         label: "Unit",      editable: true },
  { key: "defaultCost",  label: "Cost",      type: "number", editable: true },
  { key: "defaultPrice", label: "Price",     type: "number", editable: true },
  { key: "isActive",     label: "Active",    render: (v: any) => v ? "✓" : "—" },
];

// ─── Form state ───────────────────────────────────────────────────────────────

type ProductForm = {
  // Basic
  sku: string;
  name: string;
  altName: string;
  type: string;
  unit: string;
  description: string;
  isActive: boolean;
  isNew: boolean;
  // Type checkboxes
  isGoods: boolean;
  isProduction: boolean;
  isRaw: boolean;
  isPromo: boolean;
  // Classification
  brandId: string;
  categoryId: string;
  supplierId: string;
  // Tax / customs codes
  ikpu: string;
  tnved: string;
  barcode: string;
  // Pricing
  defaultCost: string;
  defaultPrice: string;
  taxRate: string;
  // Dimensions
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  // Case levels
  caseType1: string;
  caseQty1: string;
  caseType2: string;
  caseQty2: string;
};

const EMPTY_FORM: ProductForm = {
  sku: "", name: "", altName: "", type: "STOCK", unit: "pcs",
  description: "", isActive: true, isNew: false,
  isGoods: true, isProduction: false, isRaw: false, isPromo: false,
  brandId: "", categoryId: "", supplierId: "",
  ikpu: "", tnved: "", barcode: "",
  defaultCost: "", defaultPrice: "", taxRate: "0",
  weightKg: "", lengthCm: "", widthCm: "", heightCm: "",
  caseType1: "", caseQty1: "", caseType2: "", caseQty2: "",
};

// ─── Create / Edit Product Dialog ─────────────────────────────────────────────

function ProductDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: (product: unknown) => void;
}) {
  const tenantId = useAppSelector((s) => s.auth.user?.tenantId ?? "");
  const [brands,     setBrands]     = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers,  setSuppliers]  = useState<Supplier[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [imageFile,  setImageFile]  = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProductForm>({ ...EMPTY_FORM });

  // Load reference data
  useEffect(() => {
    if (!open) return;
    Promise.allSettled([
      api.get("/api/brands"),
      api.get("/api/categories"),
      api.get("/api/suppliers"),
    ]).then(([b, c, s]) => {
      if (b.status === "fulfilled") setBrands(b.value.data?.data ?? []);
      if (c.status === "fulfilled") setCategories(c.value.data?.data ?? []);
      if (s.status === "fulfilled") setSuppliers(s.value.data?.data ?? []);
    });
  }, [open]);

  function set<K extends keyof ProductForm>(key: K, val: ProductForm[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function reset() {
    setForm({ ...EMPTY_FORM });
    setImageFile(null);
    setImagePreview(null);
    setSaving(false);
  }

  function handleImage(file: File) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  const num = (v: string) => v.trim() === "" ? undefined : Number(v);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sku.trim())  { toast.error("SKU / Code is required"); return; }
    if (!form.name.trim()) { toast.error("Name is required"); return; }

    const body: Record<string, unknown> = {
      tenantId,
      sku:          form.sku.trim(),
      name:         form.name.trim(),
      type:         form.type || "STOCK",
      unit:         form.unit.trim() || "pcs",
      isActive:     form.isActive,
      description:  form.description.trim() || undefined,
      brandId:      form.brandId || undefined,
      categoryId:   form.categoryId || undefined,
      defaultCost:  num(form.defaultCost),
      defaultPrice: num(form.defaultPrice),
      taxRate:      num(form.taxRate) ?? 0,
      weightKg:     num(form.weightKg),
      lengthCm:     num(form.lengthCm),
      widthCm:      num(form.widthCm),
      heightCm:     num(form.heightCm),
      // Extended fields stored as description metadata (backend stores as JSON via description prefix)
      // In production you'd extend the Prisma schema — here we store extras in the description payload
    };

    // Store extended fields as a structured note in description (since schema doesn't have these columns yet)
    // They will appear in the description field as JSON, readable by agents
    const extra: Record<string, unknown> = {};
    if (form.altName.trim())  extra.altName  = form.altName.trim();
    if (form.ikpu.trim())     extra.ikpu     = form.ikpu.trim();
    if (form.tnved.trim())    extra.tnved    = form.tnved.trim();
    if (form.barcode.trim())  extra.barcode  = form.barcode.trim();
    if (form.caseType1)       extra.caseType1 = form.caseType1;
    if (form.caseQty1)        extra.caseQty1  = num(form.caseQty1);
    if (form.caseType2)       extra.caseType2 = form.caseType2;
    if (form.caseQty2)        extra.caseQty2  = num(form.caseQty2);
    if (form.isNew)           extra.isNew    = true;
    if (!form.isGoods)        extra.isGoods  = false;
    if (form.isProduction)    extra.isProduction = true;
    if (form.isRaw)           extra.isRaw    = true;
    if (form.isPromo)         extra.isPromo  = true;
    if (form.supplierId)      extra.supplierId = form.supplierId;

    if (Object.keys(extra).length > 0) {
      // Prepend extended JSON to description
      const existingDesc = form.description.trim();
      body.description = `__ext:${JSON.stringify(extra)}__${existingDesc ? "\n" + existingDesc : ""}`;
    }

    // Barcodes array
    if (form.barcode.trim()) {
      body.barcodes = [{ type: "CODE128", value: form.barcode.trim(), isPrimary: true }];
    }

    // Remove undefined
    Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);

    setSaving(true);
    try {
      const { data } = await api.post("/api/products", body);
      const record = data?.data ?? data;
      toast.success("Product created");
      onSaved(record);
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to create product");
    } finally {
      setSaving(false);
    }
  }

  // Helper: dropdown value "none" means nothing selected
  const selVal = (v: string) => v || "__none__";
  const fromSel = (v: string) => v === "__none__" ? "" : v;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" /> New Product (ТМЦ)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0">
            <TabsList className="shrink-0 grid grid-cols-4 mx-0">
              <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
              <TabsTrigger value="codes" className="text-xs">Codes & Barcodes</TabsTrigger>
              <TabsTrigger value="pricing" className="text-xs">Pricing & Cases</TabsTrigger>
              <TabsTrigger value="dims" className="text-xs">Dimensions</TabsTrigger>
            </TabsList>

            {/* ── TAB 1: BASIC ── */}
            <TabsContent value="basic" className="overflow-y-auto flex-1 space-y-3 px-0 py-2">

              {/* Image */}
              <div className="flex gap-4 items-start">
                <div
                  className="h-20 w-20 rounded-lg border-2 border-dashed border-border bg-muted/40 flex items-center justify-center cursor-pointer hover:bg-muted/60 transition-colors shrink-0 overflow-hidden"
                  onClick={() => imgInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Image className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <input ref={imgInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(f); }} />
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Name (Название) <span className="text-destructive">*</span></Label>
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Product display name" className="h-9" />
                  <Label className="text-xs">Alternative name (Альтернативное название)</Label>
                  <Input value={form.altName} onChange={(e) => set("altName", e.target.value)} placeholder="Alternative / local name" className="h-9" />
                </div>
              </div>

              {/* Type checkboxes — like Smartup */}
              <div className="flex flex-wrap gap-3">
                {([
                  { key: "isGoods", label: "Товар" },
                  { key: "isProduction", label: "Продукция" },
                  { key: "isRaw", label: "Сырьё" },
                  { key: "isPromo", label: "Рекл. оборудование" },
                ] as const).map((cb) => (
                  <label key={cb.key} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[cb.key]}
                      onChange={(e) => set(cb.key, e.target.checked)}
                      className="rounded"
                    />
                    {cb.label}
                  </label>
                ))}
                <label className="flex items-center gap-1.5 text-xs cursor-pointer ml-auto">
                  <input type="checkbox" checked={form.isNew} onChange={(e) => set("isNew", e.target.checked)} className="rounded" />
                  Новинка
                </label>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} size="sm" />
                <span className="text-sm">{form.isActive ? "Активный" : "Неактивный"}</span>
              </div>

              <Separator />

              {/* SKU, Unit, Type */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">SKU / Код <span className="text-destructive">*</span></Label>
                  <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="e.g. 7107" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Unit / Ед. изм. <span className="text-destructive">*</span></Label>
                  <Input value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="шт / кг / л" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select value={form.type} onValueChange={(v) => set("type", v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Brand, Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Brand / Бренд</Label>
                  <Select value={selVal(form.brandId)} onValueChange={(v) => set("brandId", fromSel(v))}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select brand…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— None —</SelectItem>
                      {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      {brands.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No brands yet</div>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Category / Категория</Label>
                  <Select value={selVal(form.categoryId)} onValueChange={(v) => set("categoryId", fromSel(v))}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select category…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— None —</SelectItem>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.path ?? c.name}</SelectItem>)}
                      {categories.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No categories yet</div>}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Supplier — Наборы ТМЦ / Поставщики */}
              <div className="space-y-1.5">
                <Label className="text-xs">Supplier / Поставщик</Label>
                <Select value={selVal(form.supplierId)} onValueChange={(v) => set("supplierId", fromSel(v))}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Link to supplier…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    {suppliers.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No suppliers yet</div>}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                  placeholder="Product description…" rows={2} className="resize-none text-sm" />
              </div>
            </TabsContent>

            {/* ── TAB 2: CODES & BARCODES ── */}
            <TabsContent value="codes" className="overflow-y-auto flex-1 space-y-3 px-0 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Barcode / Штрих-код</Label>
                  <Input value={form.barcode} onChange={(e) => set("barcode", e.target.value)}
                    placeholder="EAN13 / UPC / CODE128" className="h-9 font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">SKU / Код</Label>
                  <Input value={form.sku} onChange={(e) => set("sku", e.target.value)}
                    placeholder="e.g. 7107" className="h-9 font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">ИКПУ (Tax code)</Label>
                  <Input value={form.ikpu} onChange={(e) => set("ikpu", e.target.value)}
                    placeholder="ИКПУ code" className="h-9 font-mono" />
                  <p className="text-[10px] text-muted-foreground">Uzbekistan tax product identifier</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">ТН ВЭД (Customs code)</Label>
                  <Input value={form.tnved} onChange={(e) => set("tnved", e.target.value)}
                    placeholder="HS / ТН ВЭД code" className="h-9 font-mono" />
                  <p className="text-[10px] text-muted-foreground">Harmonized commodity code</p>
                </div>
              </div>
            </TabsContent>

            {/* ── TAB 3: PRICING & CASES ── */}
            <TabsContent value="pricing" className="overflow-y-auto flex-1 space-y-3 px-0 py-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cost Price / Себестоимость</Label>
                  <Input type="number" value={form.defaultCost} onChange={(e) => set("defaultCost", e.target.value)}
                    placeholder="0.00" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sale Price / Цена продажи</Label>
                  <Input type="number" value={form.defaultPrice} onChange={(e) => set("defaultPrice", e.target.value)}
                    placeholder="0.00" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tax % / НДС</Label>
                  <Input type="number" value={form.taxRate} onChange={(e) => set("taxRate", e.target.value)}
                    placeholder="0" className="h-9" />
                </div>
              </div>

              <Separator />

              {/* Case levels — like Smartup */}
              <div className="space-y-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Case / Кейс levels
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Тип кейса (1 уровень)</Label>
                  <Input value={form.caseType1} onChange={(e) => set("caseType1", e.target.value)}
                    placeholder="e.g. Блок" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Кол-во в кейсе 1</Label>
                  <Input type="number" value={form.caseQty1} onChange={(e) => set("caseQty1", e.target.value)}
                    placeholder="e.g. 4" className="h-9" />
                  <p className="text-[10px] text-muted-foreground">Сколько товара в 1 кейсе</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Тип кейса (2 уровень)</Label>
                  <Input value={form.caseType2} onChange={(e) => set("caseType2", e.target.value)}
                    placeholder="e.g. Короб" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Кол-во в кейсе 2</Label>
                  <Input type="number" value={form.caseQty2} onChange={(e) => set("caseQty2", e.target.value)}
                    placeholder="e.g. 10" className="h-9" />
                  <p className="text-[10px] text-muted-foreground">Кол-во кейсов 1 ур. в кейсе 2</p>
                </div>
              </div>
            </TabsContent>

            {/* ── TAB 4: DIMENSIONS ── */}
            <TabsContent value="dims" className="overflow-y-auto flex-1 space-y-3 px-0 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Weight / Вес (kg)</Label>
                  <Input type="number" value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)} placeholder="0.000" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Length / Длина (cm)</Label>
                  <Input type="number" value={form.lengthCm} onChange={(e) => set("lengthCm", e.target.value)} placeholder="0" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Width / Ширина (cm)</Label>
                  <Input type="number" value={form.widthCm} onChange={(e) => set("widthCm", e.target.value)} placeholder="0" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Height / Высота (cm)</Label>
                  <Input type="number" value={form.heightCm} onChange={(e) => set("heightCm", e.target.value)} placeholder="0" className="h-9" />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-3 border-t shrink-0 gap-2 mt-1">
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
  const [search,     setSearch]     = useState("");

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

  const filtered = search
    ? rows.filter((r) =>
        String(r.sku ?? "").toLowerCase().includes(search.toLowerCase()) ||
        String(r.name ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : rows;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Products / ТМЦ</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Product catalog — {rows.length} items</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SKU / name…"
              className="h-9 pl-8 pr-8 rounded-md border border-border bg-muted/40 text-sm focus:outline-none focus:ring-1 focus:ring-ring w-52"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
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
          rows={filtered}
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

      <ProductDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={(record) => setRows((r) => [record as ProductRow, ...r])}
      />
    </div>
  );
}
