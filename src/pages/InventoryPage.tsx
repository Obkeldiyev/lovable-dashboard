/**
 * InventoryPage — Stock on hand across all warehouses.
 *
 * Improvements over GenericPage:
 * - Warehouse filter dropdown (FetchCombobox) — no UUID pasting
 * - Product search input
 * - Export button
 * - UuidCell for ID columns
 */
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Search, X } from "lucide-react";
import { PageHeader, EditableTable, type Column } from "@/components/data/EditableTable";
import { FetchCombobox } from "@/components/ui/fetch-combobox";

type InventoryRow = {
  id: string | number;
  product?: { name?: string; sku?: string };
  warehouse?: { name?: string };
  qtyOnHand?: number;
  qtyReserved?: number;
  qtyAvailable?: number;
  updatedAt?: string;
};

const COLUMNS: Column<InventoryRow>[] = [
  { key: "product",      label: "Product",   render: (v: any) => v?.name ?? v?.sku ?? "—" },
  { key: "warehouse",    label: "Warehouse",  render: (v: any) => v?.name ?? "—" },
  { key: "qtyOnHand",    label: "On Hand",    type: "number" },
  { key: "qtyReserved",  label: "Reserved",   type: "number" },
  { key: "qtyAvailable", label: "Available",  type: "number" },
  { key: "updatedAt",    label: "Updated",    render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
];

export default function InventoryPage() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [warehouseId, setWarehouseId] = useState("");
  const [productSearch, setProductSearch] = useState("");

  function buildParams() {
    const p = new URLSearchParams();
    if (warehouseId) p.set("warehouseId", warehouseId);
    return p;
  }

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/inventory/balances?${buildParams()}`);
      let arr: unknown[] = [];
      if (Array.isArray(data)) arr = data;
      else if (Array.isArray(data?.data)) arr = data.data;
      else if (Array.isArray(data?.items)) arr = data.items;
      else if (Array.isArray(data?.data?.items)) arr = data.data.items;
      setRows(
        arr.map((x: any, i) => ({ id: x.id ?? i, ...x })) as InventoryRow[],
      );
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "Inventory · VMS";
    load();
  }, [warehouseId]);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const { data } = await api.get(
        `/api/inventory/export?${buildParams()}`,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `inventory_${new Date().toISOString().split("T")[0]}.xlsx`);
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

  // Client-side product name filter (avoids extra API call)
  const filtered = productSearch
    ? rows.filter((r) => {
        const name = (r.product?.name ?? "").toLowerCase();
        const sku = (r.product?.sku ?? "").toLowerCase();
        const q = productSearch.toLowerCase();
        return name.includes(q) || sku.includes(q);
      })
    : rows;

  const hasFilter = warehouseId !== "" || productSearch !== "";

  return (
    <div>
      <PageHeader
        title="Inventory"
        description={`Stock on hand across all warehouses — ${rows.length} records`}
        action={
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
        }
      />

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-end mb-4 p-3 rounded-lg border border-border bg-muted/30">
        <div className="space-y-1 min-w-[180px]">
          <Label className="text-xs text-muted-foreground">Warehouse</Label>
          <FetchCombobox
            fetchUrl="/api/warehouses"
            labelKey="name"
            searchKeys={["code"]}
            value={warehouseId}
            onValueChange={setWarehouseId}
            placeholder="All warehouses…"
            className="w-full"
            noBrandFilter
          />
        </div>

        <div className="space-y-1 min-w-[180px]">
          <Label className="text-xs text-muted-foreground">Product</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search by name or SKU…"
              className="h-9 pl-8 pr-8 text-sm w-52"
            />
            {productSearch && (
              <button
                onClick={() => setProductSearch("")}
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {hasFilter && (
          <Button
            size="sm"
            variant="ghost"
            className="h-9 gap-1 text-muted-foreground self-end"
            onClick={() => { setWarehouseId(""); setProductSearch(""); }}
          >
            <X className="h-3.5 w-3.5" /> Clear all
          </Button>
        )}
      </div>

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
      ) : (
        <EditableTable
          rows={filtered}
          columns={COLUMNS}
          empty="No inventory records found"
        />
      )}
    </div>
  );
}