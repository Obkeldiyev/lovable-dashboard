import { GenericPage } from "@/components/data/GenericPage";

export default function ReceivingsPage() {
  return (
    <GenericPage
      title="Receivings"
      description="Goods receiving documents"
      path="/api/receivings"
      columns={[
        { key: "receivingNumber", label: "Number" },
        { key: "purchaseOrder",   label: "PO",          render: (v: any) => v?.poNumber ?? "—" },
        { key: "status",          label: "Status",      type: "badge" },
        { key: "receivedBy",      label: "Received By", render: (v: any) => v?.fullName ?? "—" },
        { key: "receivedAt",      label: "Date",        render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
      ]}
      createConfig={{
        title: "Receiving",
        postUrl: "/api/receivings",
        fields: [
          { key: "receivingNumber",  label: "Receiving Number", required: true, placeholder: "e.g. RCV-001" },
          { key: "purchaseOrderId",  label: "Purchase Order ID", placeholder: "PO UUID (optional)" },
          { key: "notes",            label: "Notes", type: "textarea" },
        ],
      }}
    />
  );
}
