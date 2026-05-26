import { GenericPage } from "@/components/data/GenericPage";

export default function InventoryPage() {
  return (
    <GenericPage
      title="Inventory"
      description="Stock on hand across all warehouses"
      path="/api/inventory"
      columns={[
        { key: "product", label: "Product", render: (v: any) => v?.name ?? v?.sku ?? "—" },
        { key: "warehouse", label: "Warehouse", render: (v: any) => v?.name ?? "—" },
        { key: "qtyOnHand", label: "On Hand", type: "number" },
        { key: "qtyReserved", label: "Reserved", type: "number" },
        { key: "qtyAvailable", label: "Available", type: "number" },
        { key: "updatedAt", label: "Updated", render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
      ]}
    />
  );
}
