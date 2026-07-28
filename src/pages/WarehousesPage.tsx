import { GenericPage } from "@/components/data/GenericPage";
import { useTranslation } from "react-i18next";

// Backend: createWarehouse({ tenantId, code, name, address? })
// code+name are required
export default function WarehousesPage() {
  const { t } = useTranslation();

  return (
    <GenericPage
      title={t("warehouses.title")}
      description={t("warehouses.description")}
      path="/api/warehouses"
      columns={[
        { key: "code", label: t("warehouses.columns.code"), editable: true },
        { key: "name", label: t("warehouses.columns.name"), editable: true },
        {
          key: "address",
          label: t("warehouses.columns.address"),
          editable: true,
        },
        {
          key: "isActive",
          label: t("warehouses.columns.active"),
          render: (v: any) =>
            v ? t("warehouses.status.yes") : t("warehouses.status.no"),
        },
        {
          key: "createdAt",
          label: t("warehouses.columns.created"),
          render: (v: any) => (v ? new Date(v).toLocaleDateString() : "—"),
        },
      ]}
      createConfig={{
        title: t("warehouses.create.title"),
        postUrl: "/api/warehouses",
        fields: [
          {
            key: "code",
            label: t("warehouses.create.code"),
            required: true,
            placeholder: t("warehouses.create.codePlaceholder"),
          },
          {
            key: "name",
            label: t("warehouses.create.name"),
            required: true,
            placeholder: t("warehouses.create.namePlaceholder"),
          },
          {
            key: "address",
            label: t("warehouses.create.address"),
            type: "textarea",
            placeholder: t("warehouses.create.addressPlaceholder"),
          },
        ],
      }}
    />
  );
}
