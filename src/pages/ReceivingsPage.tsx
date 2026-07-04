import { GenericPage } from "@/components/data/GenericPage";

// Backend: createReceivingDoc({
//   tenantId*, receivingNumber*, purchaseOrderId?,
//   items*: [{ productId*, qtyReceived*, unitCost*, notes? }]
// })
export default function ReceivingsPage() {
  return (
    <GenericPage
      title="Receivings"
      description="Goods receiving documents"
      path="/api/receivings"
      deletable={false}
      columns={[
        { key: "receivingNumber", label: "Number" },
        {
          key: "purchaseOrder",
          label: "PO",
          render: (v: any) => v?.poNumber ?? "—",
        },
        { key: "status", label: "Status", type: "badge" },
        {
          key: "receivedBy",
          label: "Received By",
          render: (v: any) => v?.fullName ?? "—",
        },
        {
          key: "receivedAt",
          label: "Date",
          render: (v: any) => (v ? new Date(v).toLocaleDateString() : "—"),
        },
      ]}
      createConfig={{
        title: "Receiving",
        postUrl: "/api/receivings",
        fields: [
          {
            key: "receivingNumber",
            label: "Receiving Number",
            required: true,
            placeholder: "e.g. RCV-2024-001",
          },
          {
            key: "purchaseOrderId",
            label: "Purchase Order",
            type: "fetchselect",
            fetchUrl: "/api/purchase-orders",
            labelKey: "poNumber",
            searchKeys: [],
            placeholder: "Link to PO (optional)…",
          },
          {
            key: "items",
            label: "Received Items",
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
              {
                key: "qtyReceived",
                label: "Qty Received",
                type: "number",
                placeholder: "1",
              },
              {
                key: "unitCost",
                label: "Unit Cost",
                type: "number",
                placeholder: "0.00",
              },
            ],
          },
        ],
      }}
    />
  );
}
