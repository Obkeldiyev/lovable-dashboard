import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  CreateDialog,
  type CreateDialogConfig,
} from "@/components/data/CreateDialog";

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
};

// Define status transitions - what statuses can follow the current one
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

// Status badge colors
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  async function loadOrders() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/orders");
      let arr: unknown[] = [];
      if (Array.isArray(data)) {
        arr = data;
      } else if (Array.isArray(data?.data)) {
        arr = data.data;
      } else if (Array.isArray(data?.items)) {
        arr = data.items;
      }
      setOrders(arr as Order[]);
    } catch (error) {
      toast.error("Failed to load orders");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    document.title = "Orders · VMS";
  }, []);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    try {
      await api.patch(`/api/orders/${orderId}`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);

      // Invalidate queries and reload
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      await loadOrders();
    } catch (error) {
      toast.error("Failed to update order status");
      console.error(error);
    }
  }

  async function handleSave(id: string | number, patch: Partial<Order>) {
    await api.put(`/api/orders/${id}`, patch);
  }

  const columns: Column<Order>[] = [
    {
      key: "id",
      label: "ID",
      render: (v: any) => String(v).slice(0, 8),
    },
    {
      key: "externalOrderId",
      label: "Order Ref",
      render: (v: any) => String(v ?? "").slice(0, 8),
    },
    {
      key: "status",
      label: "Status",
      render: (val: any, row: Order) => {
        const status = val as OrderStatus;
        const nextStatuses = STATUS_TRANSITIONS[status] || [];

        // If no transitions available, just show the badge
        if (nextStatuses.length === 0) {
          return (
            <Badge
              variant={STATUS_VARIANTS[status]}
              className="text-xs font-medium"
            >
              {status}
            </Badge>
          );
        }

        // Show interactive dropdown
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
              >
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
                  <Badge
                    variant={STATUS_VARIANTS[nextStatus]}
                    className="text-xs font-medium mr-2"
                  >
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
  ];

  const createConfig: CreateDialogConfig = {
    title: "Order Reservation",
    postUrl: "/api/orders",
    fields: [
      {
        key: "warehouseId",
        label: "Warehouse ID",
        required: true,
        type: "uuid",
        placeholder: "Paste warehouse UUID",
      },
      {
        key: "items",
        label: "Reserved Items",
        type: "items",
        required: true,
        columns: [
          {
            key: "productId",
            label: "Product ID",
            type: "uuid",
            placeholder: "Product UUID",
          },
          {
            key: "qtyReserved",
            label: "Qty",
            type: "number",
            placeholder: "1",
          },
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
          <Button
            onClick={() => setCreateOpen(true)}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" /> New
          </Button>
        }
      />

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
        onSuccess={() => {
          setCreateOpen(false);
          loadOrders();
        }}
      />
    </>
  );
}
