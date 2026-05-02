import { GenericPage } from "@/components/data/GenericPage";
export default function SuppliersPage() {
  return <GenericPage title="Suppliers" path="/api/suppliers"
    columns={[
      { key: "name", label: "Name", editable: true },
      { key: "email", label: "Email", editable: true },
      { key: "phone", label: "Phone", editable: true },
      { key: "rating", label: "Rating", type: "number", editable: true },
    ]} />;
}
