import { GenericPage } from "@/components/data/GenericPage";
export default function BrandsPage() {
  return <GenericPage title="Brands" path="/api/brands"
    columns={[{ key: "name", label: "Name", editable: true }, { key: "description", label: "Description", editable: true }]} />;
}
