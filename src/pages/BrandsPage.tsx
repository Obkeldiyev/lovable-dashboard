import { useTranslation } from "react-i18next";
import { GenericPage } from "@/components/data/GenericPage";

// Backend: createBrand({ tenantId, name })
// Schema: Brand { tenantId, name } — no description field
export default function BrandsPage() {
  const { t } = useTranslation();

  return (
    <GenericPage
      title={t("brandsPage.title")}
      description={t("brandsPage.description")}
      path="/api/brands"
      exportUrl="/api/brands/export"
      columns={[
        { key: "name", label: t("brandsPage.columns.name"), editable: true },
        {
          key: "createdAt",
          label: t("brandsPage.columns.created"),
          render: (v: any) => (v ? new Date(v).toLocaleDateString() : "—"),
        },
      ]}
      createConfig={{
        title: t("brandsPage.createTitle"),
        postUrl: "/api/brands",
        fields: [
          {
            key: "name",
            label: t("brandsPage.fields.nameLabel"),
            required: true,
            placeholder: t("brandsPage.fields.namePlaceholder"),
          },
        ],
      }}
    />
  );
}