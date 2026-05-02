import { GenericPage } from "@/components/data/GenericPage";
export default function CategoriesPage() {
  return <GenericPage title="Categories" path="/api/categories"
    columns={[{ key: "name", label: "Name", editable: true }, { key: "parentName", label: "Parent" }]} />;
}
