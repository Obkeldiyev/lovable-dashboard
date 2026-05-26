import { GenericPage } from "@/components/data/GenericPage";

export default function ShipmentsPage() {
  return (
    <GenericPage
      title="Shipments"
      description="Outbound shipments and returns"
      path="/api/shipments"
      columns={[
        { key: "id",        label: "ID",       render: (v: any) => String(v).slice(0, 8) },
        { key: "topic",     label: "Type",     type: "badge" },
        { key: "payload",   label: "Tracking", render: (v: any) => (v as any)?.trackingNumber ?? "—" },
        { key: "payload",   label: "Status",   render: (v: any) => (v as any)?.status ?? "—" },
        { key: "createdAt", label: "Created",  render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
      ]}
    />
  );
}
