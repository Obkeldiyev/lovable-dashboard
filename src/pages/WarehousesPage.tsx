import { GenericPage } from "@/components/data/GenericPage";

export default function WarehousesPage() {
  return (
    <GenericPage
      title="Warehouses"
      description="Warehouse locations and status"
      path="/api/warehouses"
      columns={[
        { key: "code",     label: "Code",    editable: true },
        { key: "name",     label: "Name",    editable: true },
        { key: "address",  label: "Address", editable: true },
        { key: "isActive", label: "Active",  render: (v: any) => v ? "Yes" : "No" },
        { key: "createdAt",label: "Created", render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
      ]}
    />
  );
}
