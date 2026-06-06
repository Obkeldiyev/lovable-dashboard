import { GenericPage } from "@/components/data/GenericPage";

export default function SuppliersPage() {
  return (
    <GenericPage
      title="Suppliers"
      description="Supplier directory"
      path="/api/suppliers"
      columns={[
        { key: "name",    label: "Name",    editable: true },
        { key: "email",   label: "Email",   editable: true },
        { key: "phone",   label: "Phone",   editable: true },
        { key: "address", label: "Address", editable: true },
        { key: "status",  label: "Status",  type: "badge" },
      ]}
      createConfig={{
        title: "Supplier",
        postUrl: "/api/suppliers",
        fields: [
          { key: "name",    label: "Name",    required: true },
          { key: "email",   label: "Email",   type: "email" },
          { key: "phone",   label: "Phone",   type: "tel" },
          { key: "address", label: "Address", type: "textarea" },
          { key: "notes",   label: "Notes",   type: "textarea" },
        ],
      }}
    />
  );
}
