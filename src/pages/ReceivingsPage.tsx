import { useTranslation } from "react-i18next";
import { GenericPage } from "@/components/data/GenericPage";

// Backend: createReceivingDoc({
//   tenantId*, receivingNumber*, purchaseOrderId?,
//   items*: [{ productId*, qtyReceived*, unitCost*, notes? }]
// })
export default function ReceivingsPage() {
  const { t } = useTranslation();

  return (
    <GenericPage
      title={t("receivings.title")}
      description={t("receivings.description")}
      path="/api/receivings"
      exportUrl="/api/receivings/export"
      deletable={false}
      columns={[
        { key: "receivingNumber", label: t("receivings.columns.number") },
        {
          key: "purchaseOrder",
          label: t("receivings.columns.po"),
          render: (v: any) => v?.poNumber ?? "—",
        },
        { key: "status", label: t("receivings.columns.status"), type: "badge" },
        {
          key: "receivedBy",
          label: t("receivings.columns.receivedBy"),
          render: (v: any) => v?.fullName ?? "—",
        },
        {
          key: "receivedAt",
          label: t("receivings.columns.date"),
          render: (v: any) => (v ? new Date(v).toLocaleDateString() : "—"),
        },
      ]}
      createConfig={{
        title: t("receivings.create.title"),
        postUrl: "/api/receivings",
        fields: [
          {
            key: "receivingNumber",
            label: t("receivings.create.receivingNumber"),
            required: true,
            placeholder: t("receivings.create.receivingNumberPlaceholder"),
          },
          {
            key: "purchaseOrderId",
            label: t("receivings.create.purchaseOrder"),
            type: "fetchselect",
            fetchUrl: "/api/purchase-orders",
            labelKey: "poNumber",
            searchKeys: [],
            placeholder: t("receivings.create.purchaseOrderPlaceholder"),
          },
          {
            key: "items",
            label: t("receivings.create.receivedItems"),
            type: "items",
            required: true,
            columns: [
              {
                key: "productId",
                label: t("receivings.create.itemsColumns.product"),
                type: "fetchselect",
                fetchUrl: "/api/products",
                labelKey: "name",
                searchKeys: ["sku"],
                placeholder: t(
                  "receivings.create.itemsColumns.productPlaceholder",
                ),
              },
              {
                key: "qtyReceived",
                label: t("receivings.create.itemsColumns.qtyReceived"),
                type: "number",
                placeholder: t(
                  "receivings.create.itemsColumns.qtyReceivedPlaceholder",
                ),
              },
              {
                key: "unitCost",
                label: t("receivings.create.itemsColumns.unitCost"),
                type: "number",
                placeholder: t(
                  "receivings.create.itemsColumns.unitCostPlaceholder",
                ),
              },
            ],
          },
        ],
      }}
    />
  );
}
