import { GenericPage } from "@/components/data/GenericPage";

export default function BrandsPage() {
  return (
    <GenericPage
      title="Brands"
      description="Product brands"
      path="/api/brands"
      columns={[
        { key: "name",        label: "Name",        editable: true },
        { key: "description", label: "Description", editable: true },
      ]}
      createConfig={{
        title: "Brand",
        postUrl: "/api/brands",
        fields: [
          { key: "name",        label: "Name",        required: true },
          { key: "description", label: "Description", type: "textarea" },
        ],
      }}
    />
  );
}
