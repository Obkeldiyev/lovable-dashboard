import { GenericPage } from "@/components/data/GenericPage";

// Backend: createProduct({ tenantId, sku*, name*, type?, description?, brandId?,
//   categoryId?, unit?, weightKg?, lengthCm?, widthCm?, heightCm?,
//   defaultCost?, defaultPrice?, taxRate? })
// Schema enum ProductType: STOCK | SERVICE | DIGITAL | BUNDLE
export default function ProductsPage() {
  return (
    <GenericPage
      title="Products"
      description="Product catalog"
      path="/api/products"
      columns={[
        { key: "sku",          label: "SKU",      editable: true },
        { key: "name",         label: "Name",     editable: true },
        { key: "type",         label: "Type",     type: "badge" },
        { key: "brand",        label: "Brand",    render: (v: any) => v?.name ?? "—" },
        { key: "category",     label: "Category", render: (v: any) => v?.name ?? "—" },
        { key: "unit",         label: "Unit",     editable: true },
        { key: "defaultCost",  label: "Cost",     type: "number", editable: true },
        { key: "defaultPrice", label: "Price",    type: "number", editable: true },
        { key: "isActive",     label: "Active",   render: (v: any) => v ? "Yes" : "No" },
      ]}
      createConfig={{
        title: "Product",
        postUrl: "/api/products",
        fields: [
          // Required
          { key: "sku",  label: "SKU",  required: true, placeholder: "e.g. PROD-001" },
          { key: "name", label: "Name", required: true, placeholder: "Product display name" },
          // Type
          {
            key: "type", label: "Type", type: "select",
            options: [
              { value: "STOCK",   label: "Stock — physical inventory item" },
              { value: "SERVICE", label: "Service — no inventory tracking" },
              { value: "DIGITAL", label: "Digital — downloadable / virtual" },
              { value: "BUNDLE",  label: "Bundle — kit of other products" },
            ],
          },
          // Identifiers & classification
          { key: "unit",        label: "Unit",         placeholder: "pcs / kg / box / L" },
          { key: "description", label: "Description",  type: "textarea", placeholder: "Optional product description" },
          // Pricing
          { key: "defaultCost",  label: "Cost Price",  type: "number", placeholder: "0.00" },
          { key: "defaultPrice", label: "Sale Price",  type: "number", placeholder: "0.00" },
          { key: "taxRate",      label: "Tax Rate %",  type: "number", placeholder: "0" },
          // Dimensions (optional)
          { key: "weightKg", label: "Weight (kg)",   type: "number", placeholder: "0.000" },
          { key: "lengthCm", label: "Length (cm)",   type: "number", placeholder: "0" },
          { key: "widthCm",  label: "Width (cm)",    type: "number", placeholder: "0" },
          { key: "heightCm", label: "Height (cm)",   type: "number", placeholder: "0" },
        ],
      }}
    />
  );
}
