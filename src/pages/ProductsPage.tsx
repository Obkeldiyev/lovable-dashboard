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
      createConfig={{
        title: "Product",
        postUrl: "/api/products",
        fields: [
          { key: "sku",          label: "SKU",         required: true, placeholder: "e.g. PROD-001" },
          { key: "name",         label: "Name",        required: true },
          { key: "description",  label: "Description", type: "textarea" },
          { key: "unit",         label: "Unit",        placeholder: "e.g. pcs, kg, box" },
          { key: "defaultCost",  label: "Cost Price",  type: "number" },
          { key: "defaultPrice", label: "Sale Price",  type: "number" },
          {
            key: "type", label: "Type", type: "select",
            options: [
              { value: "STOCK",   label: "Stock item" },
              { value: "SERVICE", label: "Service" },
              { value: "KIT",     label: "Kit / bundle" },
            ],
          },
        ],
      }}
    />
  );
}
