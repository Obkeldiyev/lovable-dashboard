import { GenericPage } from "@/components/data/GenericPage";
export default function InventoryPage() {
  return <GenericPage
    title="Inventory" description="Stock on hand across warehouses"
    path="/api/inventory"
    columns={[
      { key: "sku", label: "SKU" },
      { key: "productName", label: "Product" },
      { key: "warehouseName", label: "Warehouse" },
      { key: "onHand", label: "On hand", editable: true, type: "number" },
      { key: "reorderPoint", label: "Reorder", editable: true, type: "number" },
    ]}
  />;
}
