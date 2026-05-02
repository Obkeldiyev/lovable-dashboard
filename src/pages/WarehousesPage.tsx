import { GenericPage } from "@/components/data/GenericPage";
export default function WarehousesPage() {
  return <GenericPage title="Warehouses" path="/api/warehouses"
    columns={[
      { key: "name", label: "Name", editable: true },
      { key: "city", label: "City", editable: true },
      { key: "capacity", label: "Capacity", type: "number", editable: true },
    ]} />;
}
