import { GenericPage } from "@/components/data/GenericPage";
import { UuidCell } from "@/components/ui/uuid-cell";

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
      exportUrl="/api/shipments/export"
      deletable={false}
      columns={[
        {
          key: "id",
          label: "ID",
          render: (v: any) => <UuidCell value={String(v)} />,
        },
        { key: "topic", label: "Type", type: "badge" },
        {
          key: "payload",
          label: "Tracking",
          render: (v: any) => (v as any)?.trackingNumber ?? "—",
        },
        {
          key: "payload",
          label: "Status",
          render: (v: any) => (v as any)?.status ?? "—",
        },
        {
          key: "createdAt",
          label: "Created",
          render: (v: any) => (v ? new Date(v).toLocaleDateString() : "—"),
        },
      ]}
      createConfig={{
        title: "Shipment",
        postUrl: "/api/shipments/shipments",
        fields: [
          {
            key: "trackingNumber",
            label: "Tracking Number",
            required: true,
            placeholder: "e.g. TRK-123456789",
          },
          {
            key: "orderId",
            label: "Linked Order",
            type: "fetchselect",
            fetchUrl: "/api/orders",
            labelKey: "externalOrderId",
            searchKeys: [],
            placeholder: "Link to order (optional)…",
          },
          {
            key: "shippingAddress",
            label: "Shipping Address",
            type: "textarea",
            placeholder: "Recipient full address",
          },
        ],
        // externalOrderId is required as the outbox key — auto-generate if not linked
        extraBody: () => ({ externalOrderId: crypto.randomUUID() }),
      }}
    />
  );
}
