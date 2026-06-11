/**
 * ReportsPage — Data export with filters and Excel/CSV download.
 *
 * Supported reports:
 * - Products (with category, brand, price, stock)
 * - Inventory balances (by warehouse, product)
 * - Purchase Orders (by supplier, status, date range)
 * - Suppliers
 * - Shops + visit stats
 * - Users
 */
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, Filter, RefreshCw, FileSpreadsheet, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportType = "products" | "inventory" | "purchase-orders" | "suppliers" | "shops" | "users";

type FilterState = {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  warehouseId: string;
  supplierId: string;
  categoryId: string;
};

const REPORTS: { key: ReportType; label: string; endpoint: string; columns: { key: string; label: string }[] }[] = [
  {
    key: "products",
    label: "Products",
    endpoint: "/api/products",
    columns: [
      { key: "sku", label: "SKU" },
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
      { key: "brand.name", label: "Brand" },
      { key: "category.name", label: "Category" },
      { key: "unit", label: "Unit" },
      { key: "defaultCost", label: "Cost" },
      { key: "defaultPrice", label: "Price" },
      { key: "isActive", label: "Active" },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    endpoint: "/api/inventory/balances",
    columns: [
      { key: "product.sku", label: "SKU" },
      { key: "product.name", label: "Product" },
      { key: "warehouse.name", label: "Warehouse" },
      { key: "qtyOnHand", label: "On Hand" },
      { key: "qtyReserved", label: "Reserved" },
      { key: "qtyAvailable", label: "Available" },
    ],
  },
  {
    key: "purchase-orders",
    label: "Purchase Orders",
    endpoint: "/api/purchase-orders",
    columns: [
      { key: "poNumber", label: "PO Number" },
      { key: "supplier.name", label: "Supplier" },
      { key: "status", label: "Status" },
      { key: "expectedAt", label: "Expected" },
      { key: "createdAt", label: "Created" },
    ],
  },
  {
    key: "suppliers",
    label: "Suppliers",
    endpoint: "/api/suppliers",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "address", label: "Address" },
      { key: "status", label: "Status" },
    ],
  },
  {
    key: "shops",
    label: "Shops",
    endpoint: "/api/shops",
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Name" },
      { key: "address", label: "Address" },
      { key: "phone", label: "Phone" },
      { key: "status", label: "Status" },
      { key: "lastVisitAt", label: "Last Visit" },
      { key: "merchandisingScore", label: "Score" },
    ],
  },
  {
    key: "users",
    label: "Users",
    endpoint: "/api/users",
    columns: [
      { key: "fullName", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "role", label: "Role" },
      { key: "status", label: "Status" },
      { key: "lastLoginAt", label: "Last Login" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNestedValue(obj: Record<string, any>, path: string): string {
  const parts = path.split(".");
  let val: any = obj;
  for (const p of parts) {
    if (val == null) return "—";
    val = val[p];
  }
  if (val == null) return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return new Date(val).toLocaleDateString();
  }
  return String(val);
}

function rowsToCSV(rows: Record<string, any>[], columns: { key: string; label: string }[]): string {
  const header = columns.map((c) => `"${c.label}"`).join(",");
  const body = rows.map((row) =>
    columns.map((c) => `"${getNestedValue(row, c.key).replace(/"/g, '""')}"`).join(",")
  );
  return [header, ...body].join("\n");
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel(rows: Record<string, any>[], columns: { key: string; label: string }[], filename: string) {
  // Build a basic HTML table that Excel can open
  const header = `<tr>${columns.map((c) => `<th>${c.label}</th>`).join("")}</tr>`;
  const body = rows.map((row) =>
    `<tr>${columns.map((c) => `<td>${getNestedValue(row, c.key)}</td>`).join("")}</tr>`
  ).join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"/></head><body><table>${header}${body}</table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportsPage() {
  const tenantId = useAppSelector((s) => s.auth.user?.tenantId);
  const [reportType, setReportType] = useState<ReportType>("products");
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "", status: "", dateFrom: "", dateTo: "",
    warehouseId: "", supplierId: "", categoryId: "",
  });

  const report = REPORTS.find((r) => r.key === reportType)!;

  useEffect(() => { document.title = "Reports · VMS"; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (tenantId) params.tenantId = tenantId;
      if (filters.search)     params.q = filters.search;
      if (filters.status)     params.status = filters.status;
      if (filters.dateFrom)   params.startDate = filters.dateFrom;
      if (filters.dateTo)     params.endDate = filters.dateTo;
      if (filters.warehouseId) params.warehouseId = filters.warehouseId;
      if (filters.supplierId)  params.supplierId = filters.supplierId;
      if (filters.categoryId)  params.categoryId = filters.categoryId;

      const { data } = await api.get(report.endpoint, { params });
      const arr = data?.data ?? data?.items ?? data ?? [];
      setRows(Array.isArray(arr) ? arr : []);
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Failed to load report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [reportType, filters, tenantId, report.endpoint]);

  useEffect(() => { load(); }, [reportType]);

  // Client-side filter for search
  const filtered = filters.search
    ? rows.filter((row) =>
        report.columns.some((c) =>
          getNestedValue(row, c.key).toLowerCase().includes(filters.search.toLowerCase())
        )
      )
    : rows;

  const filename = `${report.label}-${new Date().toISOString().split("T")[0]}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" /> Reports & Export
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Filter and download data as Excel or CSV
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={filtered.length === 0}
            onClick={() => downloadCSV(rowsToCSV(filtered, report.columns), `${filename}.csv`)}
          >
            <FileText className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={filtered.length === 0}
            onClick={() => downloadExcel(filtered, report.columns, filename)}
          >
            <Download className="h-3.5 w-3.5" /> Excel
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        {/* Left: Report selector + Filters */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Report type */}
            <div className="space-y-1.5">
              <Label className="text-xs">Report type</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORTS.map((r) => (
                    <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Search */}
            <div className="space-y-1.5">
              <Label className="text-xs">Search</Label>
              <Input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Filter results…"
                className="h-9 text-sm"
              />
            </div>

            {/* Status */}
            {["purchase-orders", "suppliers", "shops", "users"].includes(reportType) && (
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Input
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                  placeholder="e.g. ACTIVE, DRAFT…"
                  className="h-9 text-sm"
                />
              </div>
            )}

            {/* Date range */}
            {["purchase-orders"].includes(reportType) && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date from</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date to</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
              </>
            )}

            <Button size="sm" className="w-full gap-1.5" onClick={load}>
              <Filter className="h-3.5 w-3.5" /> Apply filters
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setFilters({ search: "", status: "", dateFrom: "", dateTo: "", warehouseId: "", supplierId: "", categoryId: "" })}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>

        {/* Right: Data table */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">{report.label}</CardTitle>
            <Badge variant="secondary">{filtered.length} rows</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-9 rounded-lg bg-muted/40 animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No data found. Try adjusting the filters.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[calc(100vh-18rem)] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow className="bg-muted/40">
                      {report.columns.map((c) => (
                        <TableHead key={c.key} className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                          {c.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row, i) => (
                      <TableRow key={row.id ?? i} className="hover:bg-accent/20 text-sm">
                        {report.columns.map((c) => (
                          <TableCell key={c.key} className="whitespace-nowrap max-w-[200px] truncate">
                            {c.key.includes("status") || c.key.includes("type") ? (
                              <Badge variant="secondary" className="text-[10px]">
                                {getNestedValue(row, c.key)}
                              </Badge>
                            ) : (
                              getNestedValue(row, c.key)
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
