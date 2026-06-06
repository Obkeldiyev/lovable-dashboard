import { GenericPage } from "@/components/data/GenericPage";

export default function ShipmentsPage() {
  return (
    <GenericPage
      title="Shipments"
      description="Outbound shipments and returns"
      path="/api/shipments/shipments"
      columns={[
        { key: "id",        label: "ID",       render: (v: any) => String(v).slice(0, 8) },
        { key: "topic",     label: "Type",     type: "badge" },
        { key: "payload",   label: "Tracking", render: (v: any) => (v as any)?.trackingNumber ?? "—" },
        { key: "payload",   label: "Status",   render: (v: any) => (v as any)?.status ?? "—" },
        { key: "createdAt", label: "Created",  render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
      ]}
      createConfig={{
        title: "Shipment",
        postUrl: "/api/shipments/shipments",
        fields: [
          { key: "trackingNumber", label: "Tracking Number", required: true },
          { key: "carrierId",      label: "Carrier ID",      placeholder: "Carrier UUID (optional)" },
          {
            key: "type", label: "Type", type: "select",
            options: [
              { value: "OUTBOUND", label: "Outbound" },
              { value: "RETURN",   label: "Return" },
            ],
          },
          { key: "notes", label: "Notes", type: "textarea" },
        ],
      }}
    />
  );
}
