import { GenericPage } from "@/components/data/GenericPage";

// Backend: createReservation({
//   tenantId*, externalOrderId* (UUID), warehouseId*,
//   items*: [{ productId*, qtyReserved*, lotId?, binId? }]
// })
// externalOrderId must be a valid UUID — auto-generated via crypto.randomUUID()
export default function OrdersPage() {
  return (
    <GenericPage
      title="Orders"
      description="Order reservations"
      path="/api/orders"
      deletable={false}
      columns={[
        { key: "id",              label: "ID",        render: (v: any) => String(v).slice(0, 8) },
        { key: "externalOrderId", label: "Order Ref", render: (v: any) => String(v ?? "").slice(0, 8) },
        { key: "status",          label: "Status",    type: "badge" },
        { key: "warehouse",       label: "Warehouse", render: (v: any) => v?.name ?? "—" },
        { key: "reservedAt",      label: "Reserved",  render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
      ]}
      createConfig={{
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
              { key: "productId",   label: "Product ID", type: "uuid",   placeholder: "Product UUID" },
              { key: "qtyReserved", label: "Qty",        type: "number", placeholder: "1" },
            ],
          },
        ],
        // externalOrderId must be a UUID — auto-generate via Web Crypto API (no dependency)
        extraBody: () => ({ externalOrderId: crypto.randomUUID() }),
      }}
    />
  );
}
