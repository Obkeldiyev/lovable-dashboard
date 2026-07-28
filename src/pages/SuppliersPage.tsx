import { GenericPage } from "@/components/data/GenericPage";
import { useTranslation } from "react-i18next";

// Backend: createSupplier({ tenantId, name, phone?, email?, address?, notes? })
export default function SuppliersPage() {
  const { t } = useTranslation();

  return (
    <GenericPage
      title={t("suppliers.title")}
      description={t("suppliers.description")}
      path="/api/suppliers"
      exportUrl="/api/suppliers/export"
      columns={[
        { key: "name", label: t("suppliers.columns.name"), editable: true },
        { key: "email", label: t("suppliers.columns.email"), editable: true },
        { key: "phone", label: t("suppliers.columns.phone"), editable: true },
        {
          key: "address",
          label: t("suppliers.columns.address"),
          editable: true,
        },
        { key: "status", label: t("suppliers.columns.status"), type: "badge" },
      ]}
      createConfig={{
        title: t("suppliers.create.title"),
        postUrl: "/api/suppliers",
        fields: [
          {
            key: "name",
            label: t("suppliers.create.name"),
            required: true,
            placeholder: t("suppliers.create.namePlaceholder"),
          },
          {
            key: "email",
            label: t("suppliers.create.email"),
            type: "email",
            placeholder: t("suppliers.create.emailPlaceholder"),
          },
          {
            key: "phone",
            label: t("suppliers.create.phone"),
            type: "tel",
            placeholder: t("suppliers.create.phonePlaceholder"),
          },
          {
            key: "address",
            label: t("suppliers.create.address"),
            type: "textarea",
            placeholder: t("suppliers.create.addressPlaceholder"),
          },
          {
            key: "notes",
            label: t("suppliers.create.notes"),
            type: "textarea",
            placeholder: t("suppliers.create.notesPlaceholder"),
          },
        ],
      }}
    />
  );
}
