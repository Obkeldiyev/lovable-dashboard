import { GenericPage } from "@/components/data/GenericPage";

// Backend: createSupplier({ tenantId, name, phone?, email?, address?, notes? })
export default function SuppliersPage() {
  return (
    <GenericPage
      title="Suppliers"
      description="Supplier directory"
      path="/api/suppliers"
      exportUrl="/api/suppliers/export"
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
          { key: "name",    label: "Name",    required: true, placeholder: "Company name" },
          { key: "email",   label: "Email",   type: "email",  placeholder: "orders@supplier.com" },
          { key: "phone",   label: "Phone",   type: "tel",    placeholder: "+1 234 567 8900" },
          { key: "address", label: "Address", type: "textarea", placeholder: "Street, City, Country" },
          { key: "notes",   label: "Notes",   type: "textarea", placeholder: "Any additional notes…" },
        ],
      }}
    />
  );
}
