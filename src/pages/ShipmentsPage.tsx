import { GenericPage } from "@/components/data/GenericPage";
import { UuidCell } from "@/components/ui/uuid-cell";
import { useTranslation } from "react-i18next";

// Backend: createShipment({
//   tenantId*, externalOrderId* (used as IntegrationOutbox key),
//   trackingNumber?, carrierId?, shippingAddress?
// })
// Stored as IntegrationOutbox with topic="SHIPMENT"
export default function ShipmentsPage() {
  const { t } = useTranslation();

  return (
    <GenericPage
      title={t("shipments.title")}
      description={t("shipments.description")}
      path="/api/shipments/shipments"
      exportUrl="/api/shipments/export"
      deletable={false}
      columns={[
        {
          key: "id",
          label: t("shipments.columns.id"),
          render: (v: any) => <UuidCell value={String(v)} />,
        },
        { key: "topic", label: t("shipments.columns.type"), type: "badge" },
        {
          key: "payload",
          label: t("shipments.columns.tracking"),
          render: (v: any) => (v as any)?.trackingNumber ?? "—",
        },
        {
          key: "payload",
          label: t("shipments.columns.status"),
          render: (v: any) => (v as any)?.status ?? "—",
        },
        {
          key: "createdAt",
          label: t("shipments.columns.created"),
          render: (v: any) => (v ? new Date(v).toLocaleDateString() : "—"),
        },
      ]}
      createConfig={{
        title: t("shipments.create.title"),
        postUrl: "/api/shipments/shipments",
        fields: [
          {
            key: "trackingNumber",
            label: t("shipments.create.trackingNumber"),
            required: true,
            placeholder: t("shipments.create.trackingNumberPlaceholder"),
          },
          {
            key: "orderId",
            label: t("shipments.create.linkedOrder"),
            type: "fetchselect",
            fetchUrl: "/api/orders",
            labelKey: "externalOrderId",
            searchKeys: [],
            placeholder: t("shipments.create.linkedOrderPlaceholder"),
          },
          {
            key: "shippingAddress",
            label: t("shipments.create.shippingAddress"),
            type: "textarea",
            placeholder: t("shipments.create.shippingAddressPlaceholder"),
          },
        ],
        // externalOrderId is required as the outbox key — auto-generate if not linked
        extraBody: () => ({ externalOrderId: crypto.randomUUID() }),
      }}
    />
  );
}
