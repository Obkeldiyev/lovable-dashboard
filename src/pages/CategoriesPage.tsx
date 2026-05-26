import { GenericPage } from "@/components/data/GenericPage";

export default function CategoriesPage() {
  return (
    <GenericPage
      title="Categories"
      description="Product category tree"
      path="/api/categories"
      columns={[
        { key: "name",      label: "Name",   editable: true },
        { key: "parent",    label: "Parent", render: (v: any) => v?.name ?? "—" },
        { key: "path",      label: "Path",   render: (v: any) => v ?? "—" },
        { key: "createdAt", label: "Created",render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
      ]}
    />
  );
}
