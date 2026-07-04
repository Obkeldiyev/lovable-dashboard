import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Download, X } from "lucide-react";
import { api } from "@/lib/api";
import {
  PageHeader,
  EditableTable,
  type Column,
} from "@/components/data/EditableTable";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  CreateDialog,
  type CreateDialogConfig,
} from "@/components/data/CreateDialog";
import { UuidCell } from "@/components/ui/uuid-cell";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "RESERVED"
  | "PICKING"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

type Order = {
  id: string;
  externalOrderId?: string;
  status: OrderStatus;
  warehouse?: { name?: string };
  reservedAt?: string;
  totalAmount?: number;
};

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["RESERVED", "CANCELLED"],
  RESERVED: ["PICKING", "CANCELLED"],
  PICKING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const STATUS_VARIANTS: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  CONFIRMED: "secondary",
  RESERVED: "secondary",
  PICKING: "secondary",
  PACKED: "secondary",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
};

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState({
    min: searchParams.get("minPrice") || "",
    max: searchParams.get("maxPrice") || "",
  });
  const queryClient = useQueryClient();

  const hasFilter = priceFilter.min !== "" || priceFilter.max !== "";

  async function loadOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (priceFilter.min) params.set("minPrice", priceFilter.min);
      if (priceFilter.max) params.set("maxPrice", priceFilter.max);
      const { data } = await api.get(`/api/orders?${params.toString()}`);
      setSearchParams(params, { replace: true });

      let arr: unknown[] = [];
      if (Array.isArray(data)) arr = data;
      else if (Array.isArray(data?.data)) arr = data.data;
      else if (Array.isArray(data?.items)) arr = data.items;
      setOrders(arr as Order[]);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    document.title = "Orders · VMS";
  }, [priceFilter.min, priceFilter.max]);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    try {
      await api.patch(`/api/orders/${orderId}`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      await loadOrders();
    } catch {
      toast.error("Failed to update order status");
    }
  }

  async function handleExport() {
    try {
      const params = new URLSearchParams();
      if (priceFilter.min) params.set("minPrice", priceFilter.min);
      if (priceFilter.max) params.set("maxPrice", priceFilter.max);
      const { data } = await api.get(
        `/api/orders/export?${params.toString()}`,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `orders_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export started");
    } catch {
      toast.error("Failed to export orders");
    }
  }

  async function handleSave(id: string | number, patch: Partial<Order>) {
    await api.put(`/api/orders/${id}`, patch);
  }

  const columns: Column<Order>[] = [
    {
      key: "id",
      label: "ID",
      render: (v: any) => <UuidCell value={String(v)} />,
    },
    {
      key: "externalOrderId",
      label: "Order Ref",
      render: (v: any) => v ? <UuidCell value={String(v)} /> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (val: any, row: Order) => {
        const status = val as OrderStatus;
        const nextStatuses = STATUS_TRANSITIONS[status] || [];
        if (nextStatuses.length === 0) {
          return (
            <Badge variant={STATUS_VARIANTS[status]} className="text-xs font-medium">
              {status}
            </Badge>
          );
        }
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
                <Badge
                  variant={STATUS_VARIANTS[status]}
                  className="text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {status}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {nextStatuses.map((nextStatus) => (
                <DropdownMenuItem
                  key={nextStatus}
                  onClick={() => handleStatusChange(row.id, nextStatus)}
                  className="cursor-pointer"
                >
                  <Badge variant={STATUS_VARIANTS[nextStatus]} className="text-xs font-medium mr-2">
                    {nextStatus}
                  </Badge>
                  Change to {nextStatus}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    {
      key: "warehouse",
      label: "Warehouse",
      render: (v: any) => v?.name ?? "—",
    },
    {
      key: "reservedAt",
      label: "Reserved",
      render: (v: any) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    {
      key: "totalAmount",
      label: "Amount",
      type: "number",
      filterable: true,
      filterType: "number",
      render: (v: number) => (v ? `$${v.toFixed(2)}` : "—"),
    },
  ];

  const createConfig: CreateDialogConfig = {
    title: "Order Reservation",
    postUrl: "/api/orders",
    fields: [
      {
        key: "warehouseId",
        label: "Warehouse",
        required: true,
        type: "fetchselect",
        fetchUrl: "/api/warehouses",
        labelKey: "name",
        searchKeys: ["code"],
        placeholder: "Select warehouse…",
      },
      {
        key: "items",
        label: "Reserved Items",
        type: "items",
        required: true,
        columns: [
          {
            key: "productId",
            label: "Product",
            type: "fetchselect",
            fetchUrl: "/api/products",
            labelKey: "name",
            searchKeys: ["sku"],
            placeholder: "Select product…",
          },
          { key: "qtyReserved", label: "Qty", type: "number", placeholder: "1" },
        ],
      },
    ],
    extraBody: () => ({ externalOrderId: crypto.randomUUID() }),
  };

  return (
    <>
      <PageHeader
        title="Orders"
        description="Order reservations"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> New
            </Button>
          </div>
        }
      />

      {/* Price filter bar */}
      <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-lg border border-border bg-muted/30">
        <Label className="text-sm shrink-0 text-muted-foreground">Filter by amount:</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={priceFilter.min}
            onChange={(e) => setPriceFilter((p) => ({ ...p, min: e.target.value }))}
            className="h-8 w-24 text-sm"
          />
          <span className="text-muted-foreground text-sm">—</span>
          <Input
            type="number"
            placeholder="Max"
            value={priceFilter.max}
            onChange={(e) => setPriceFilter((p) => ({ ...p, max: e.target.value }))}
            className="h-8 w-24 text-sm"
          />
        </div>
        {hasFilter && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1 text-muted-foreground"
            onClick={() => setPriceFilter({ min: "", max: "" })}
          >
            <X className="h-3.5 w-3.5" /> Clear filter
          </Button>
        )}
        {hasFilter && (
          <span className="text-xs text-muted-foreground ml-auto">
            Showing filtered results
          </span>
        )}
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      ) : (
        <EditableTable
          rows={orders}
          columns={columns}
          onSave={handleSave}
          empty="No orders found"
        />
      )}

      <CreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        config={createConfig}
        onCreated={() => {
          setCreateOpen(false);
          loadOrders();
        }}
      />
    </>
  );
}