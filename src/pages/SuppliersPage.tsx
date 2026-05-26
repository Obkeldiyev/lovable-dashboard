import { GenericPage } from "@/components/data/GenericPage";

export default function SuppliersPage() {
  return (
    <GenericPage
      title="Suppliers"
      description="Supplier directory"
      path="/api/suppliers"
      columns={[
        { key: "name",    label: "Name",   editable: true },
        { key: "email",   label: "Email",  editable: true },
        { key: "phone",   label: "Phone",  editable: true },
        { key: "address", label: "Address",editable: true },
        { key: "status",  label: "Status", type: "badge" },
      ]}
    />
  );
}
