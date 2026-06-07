import { GenericPage } from "@/components/data/GenericPage";

// Backend: createBrand({ tenantId, name })
// Schema: Brand { tenantId, name } — no description field
export default function BrandsPage() {
  return (
    <GenericPage
      title="Brands"
      description="Product brands"
      path="/api/brands"
      columns={[
        { key: "name",      label: "Name",     editable: true },
        { key: "createdAt", label: "Created",  render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
      ]}
      createConfig={{
        title: "Brand",
        postUrl: "/api/brands",
        fields: [
          { key: "name", label: "Name", required: true, placeholder: "e.g. Samsung" },
        ],
      }}
    />
  );
}
