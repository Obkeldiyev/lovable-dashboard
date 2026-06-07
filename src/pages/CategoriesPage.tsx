import { GenericPage } from "@/components/data/GenericPage";

// Backend: createCategory({ tenantId, name, parentId?, path? })
export default function CategoriesPage() {
  return (
    <GenericPage
      title="Categories"
      description="Product category tree"
      path="/api/categories"
      columns={[
        { key: "name",      label: "Name",    editable: true },
        { key: "parent",    label: "Parent",  render: (v: any) => v?.name ?? "—" },
        { key: "path",      label: "Path",    render: (v: any) => v ?? "—" },
        { key: "createdAt", label: "Created", render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
      ]}
      createConfig={{
        title: "Category",
        postUrl: "/api/categories",
        fields: [
          { key: "name", label: "Name", required: true, placeholder: "e.g. Electronics" },
          { key: "path", label: "Path", placeholder: "e.g. Electronics / Phones (optional)" },
        ],
      }}
    />
  );
}
