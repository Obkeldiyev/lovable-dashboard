import { useTranslation } from "react-i18next";
import { GenericPage } from "@/components/data/GenericPage";

// Backend: createPurchaseOrder({
//   tenantId*, supplierId*, poNumber*, expectedAt?,
//   items*: [{ productId*, qty*, unitCost*, taxRate?, notes? }]
// })
export default function PurchaseOrdersPage() {
  const { t } = useTranslation();

  return (
    <GenericPage
      title={t("purchaseOrders.title")}
      description={t("purchaseOrders.description")}
      path="/api/purchase-orders"
      exportUrl="/api/purchase-orders/export"
      deletable={false}
      columns={[
        { key: "poNumber", label: t("purchaseOrders.columns.poNumber") },
        {
          key: "supplier",
          label: t("purchaseOrders.columns.supplier"),
          render: (v: any) => v?.name ?? "—",
        },
        {
          key: "status",
          label: t("purchaseOrders.columns.status"),
          type: "badge",
        },
        {
          key: "expectedAt",
          label: t("purchaseOrders.columns.expected"),
          render: (v: any) => (v ? new Date(v).toLocaleDateString() : "—"),
        },
        {
          key: "createdAt",
          label: t("purchaseOrders.columns.created"),
          render: (v: any) => (v ? new Date(v).toLocaleDateString() : "—"),
        },
      ]}
      createConfig={{
        title: t("purchaseOrders.create.title"),
        postUrl: "/api/purchase-orders",
        fields: [
          {
            key: "poNumber",
            label: t("purchaseOrders.create.poNumber"),
            required: true,
            placeholder: t("purchaseOrders.create.poNumberPlaceholder"),
          },
          {
            key: "supplierId",
            label: t("purchaseOrders.create.supplier"),
            required: true,
            type: "fetchselect",
            fetchUrl: "/api/suppliers",
            labelKey: "name",
            searchKeys: ["code"],
            placeholder: t("purchaseOrders.create.supplierPlaceholder"),
          },
          {
            key: "expectedAt",
            label: t("purchaseOrders.create.expectedDelivery"),
            type: "date",
          },
          {
            key: "items",
            label: t("purchaseOrders.create.lineItems"),
            type: "items",
            required: true,
            columns: [
              {
                key: "productId",
                label: t("purchaseOrders.create.itemsColumns.product"),
                type: "fetchselect",
                fetchUrl: "/api/products",
                labelKey: "name",
                searchKeys: ["sku"],
                placeholder: t(
                  "purchaseOrders.create.itemsColumns.productPlaceholder",
                ),
              },
              {
                key: "qty",
                label: t("purchaseOrders.create.itemsColumns.qty"),
                type: "number",
                placeholder: t(
                  "purchaseOrders.create.itemsColumns.qtyPlaceholder",
                ),
              },
              {
                key: "unitCost",
                label: t("purchaseOrders.create.itemsColumns.unitCost"),
                type: "number",
                placeholder: t(
                  "purchaseOrders.create.itemsColumns.unitCostPlaceholder",
                ),
              },
              {
                key: "taxRate",
                label: t("purchaseOrders.create.itemsColumns.taxRate"),
                type: "number",
                placeholder: t(
                  "purchaseOrders.create.itemsColumns.taxRatePlaceholder",
                ),
              },
            ],
          },
        ],
      }}
    />
  );
}
