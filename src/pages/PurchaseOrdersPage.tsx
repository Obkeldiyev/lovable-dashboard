import { GenericPage } from "@/components/data/GenericPage";

export default function PurchaseOrdersPage() {
  return (
    <GenericPage
      title="Purchase Orders"
      description="Procurement purchase orders"
      path="/api/purchase-orders"
      columns={[
        { key: "poNumber",   label: "PO Number" },
        { key: "supplier",   label: "Supplier",  render: (v: any) => v?.name ?? "—" },
        { key: "status",     label: "Status",    type: "badge" },
        { key: "expectedAt", label: "Expected",  render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
        { key: "createdAt",  label: "Created",   render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
      ]}
      createConfig={{
        title: "Purchase Order",
        postUrl: "/api/purchase-orders",
        fields: [
          { key: "poNumber",   label: "PO Number",   required: true, placeholder: "e.g. PO-2024-001" },
          { key: "supplierId", label: "Supplier ID", required: true, placeholder: "Supplier UUID" },
          { key: "expectedAt", label: "Expected Date", type: "date" },
        ],
        // PO requires at least one item — we add a placeholder item with qty 1
        extraBody: (values) => ({
          items: [{
            productId: "00000000-0000-0000-0000-000000000000",
            qty: 1,
            unitCost: 0,
          }],
        }),
      }}
    />
  );
}
