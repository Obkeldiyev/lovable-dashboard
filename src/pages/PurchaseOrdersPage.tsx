import { GenericPage } from "@/components/data/GenericPage";

// Backend: createPurchaseOrder({
//   tenantId*, supplierId*, poNumber*, expectedAt?,
//   items*: [{ productId*, qty*, unitCost*, taxRate?, notes? }]
// })
export default function PurchaseOrdersPage() {
  return (
    <GenericPage
      title="Purchase Orders"
      description="Procurement purchase orders"
      path="/api/purchase-orders"
      deletable={false}
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
          { key: "poNumber",   label: "PO Number",       required: true, placeholder: "e.g. PO-2024-001" },
          { key: "supplierId", label: "Supplier ID",      required: true, type: "uuid", placeholder: "Paste supplier UUID" },
          { key: "expectedAt", label: "Expected Delivery", type: "date" },
          {
            key: "items",
            label: "Line Items",
            type: "items",
            required: true,
            columns: [
              { key: "productId", label: "Product ID", type: "uuid",   placeholder: "Product UUID" },
              { key: "qty",       label: "Qty",        type: "number", placeholder: "1" },
              { key: "unitCost",  label: "Unit Cost",  type: "number", placeholder: "0.00" },
              { key: "taxRate",   label: "Tax %",      type: "number", placeholder: "0" },
            ],
          },
        ],
      }}
    />
  );
}
