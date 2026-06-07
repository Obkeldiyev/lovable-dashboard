import { GenericPage } from "@/components/data/GenericPage";

// Backend: createShipment({
//   tenantId*, externalOrderId* (used as IntegrationOutbox key),
//   trackingNumber?, carrierId?, shippingAddress?
// })
// Stored as IntegrationOutbox with topic="SHIPMENT"
export default function ShipmentsPage() {
  return (
    <GenericPage
      title="Shipments"
      description="Outbound shipments"
      path="/api/shipments/shipments"
      deletable={false}
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
          { key: "trackingNumber",  label: "Tracking Number",  required: true, placeholder: "e.g. TRK-123456789" },
          { key: "shippingAddress", label: "Shipping Address", type: "textarea", placeholder: "Recipient full address" },
        ],
        // externalOrderId is required as the outbox key — auto-generate a UUID
        extraBody: () => ({ externalOrderId: crypto.randomUUID() }),
      }}
    />
  );
}
