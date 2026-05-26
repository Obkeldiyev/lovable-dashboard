import { GenericPage } from "@/components/data/GenericPage";

export default function PurchaseOrdersPage() {
  return (
    <GenericPage
      title="Purchase Orders"
      description="Procurement purchase orders"
      path="/api/purchase-orders"
      columns={[
        { key: "poNumber",  label: "PO Number" },
        { key: "supplier",  label: "Supplier",  render: (v: any) => v?.name ?? "—" },
        { key: "status",    label: "Status",    type: "badge" },
        { key: "expectedAt",label: "Expected",  render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
        { key: "createdAt", label: "Created",   render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
      ]}
    />
  );
}
