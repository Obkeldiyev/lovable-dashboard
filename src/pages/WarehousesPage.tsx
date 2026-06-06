import { GenericPage } from "@/components/data/GenericPage";

export default function WarehousesPage() {
  return (
    <GenericPage
      title="Warehouses"
      description="Warehouse locations and status"
      path="/api/warehouses"
      columns={[
        { key: "code",      label: "Code",    editable: true },
        { key: "name",      label: "Name",    editable: true },
        { key: "address",   label: "Address", editable: true },
        { key: "isActive",  label: "Active",  render: (v: any) => v ? "Yes" : "No" },
        { key: "createdAt", label: "Created", render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
      ]}
      createConfig={{
        title: "Warehouse",
        postUrl: "/api/warehouses",
        fields: [
          { key: "code",    label: "Code",    required: true, placeholder: "e.g. WH-01" },
          { key: "name",    label: "Name",    required: true },
          { key: "address", label: "Address", type: "textarea" },
        ],
      }}
    />
  );
}
