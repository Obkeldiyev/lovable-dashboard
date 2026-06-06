import { GenericPage } from "@/components/data/GenericPage";

export default function OrdersPage() {
  return (
    <GenericPage
      title="Orders"
      description="Order reservations"
      path="/api/orders"
      columns={[
        { key: "id",         label: "ID",        render: (v: any) => String(v).slice(0, 8) },
        { key: "status",     label: "Status",    type: "badge" },
        { key: "warehouse",  label: "Warehouse", render: (v: any) => v?.name ?? "—" },
        { key: "reservedAt", label: "Reserved",  render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
      ]}
      createConfig={{
        title: "Order",
        postUrl: "/api/orders",
        fields: [
          { key: "warehouseId", label: "Warehouse ID", required: true, placeholder: "Warehouse UUID" },
          { key: "notes",       label: "Notes",        type: "textarea" },
        ],
      }}
    />
  );
}
