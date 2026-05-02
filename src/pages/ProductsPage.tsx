import { GenericPage } from "@/components/data/GenericPage";
export default function ProductsPage() {
  return <GenericPage
    title="Products" path="/api/products"
    columns={[
      { key: "sku", label: "SKU", editable: true },
      { key: "name", label: "Name", editable: true },
      { key: "brandName", label: "Brand" },
      { key: "categoryName", label: "Category" },
      { key: "price", label: "Price", editable: true, type: "number" },
    ]}
  />;
}
