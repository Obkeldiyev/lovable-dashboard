import { GenericPage } from "@/components/data/GenericPage";

export default function ProductsPage() {
  return (
    <GenericPage
      title="Products"
      description="Product catalog"
      path="/api/products"
      columns={[
        { key: "sku",          label: "SKU",      editable: true },
        { key: "name",         label: "Name",     editable: true },
        { key: "brand",        label: "Brand",    render: (v: any) => v?.name ?? "—" },
        { key: "category",     label: "Category", render: (v: any) => v?.name ?? "—" },
        { key: "defaultPrice", label: "Price",    editable: true, type: "number" },
        { key: "isActive",     label: "Active",   render: (v: any) => v ? "Yes" : "No" },
      ]}
    />
  );
}
