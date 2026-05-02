import { GenericPage } from "@/components/data/GenericPage";
export default function PurchaseOrdersPage() {
  return <GenericPage title="Purchase Orders" path="/api/purchase-orders"
    columns={[
      { key: "number", label: "Number" },
      { key: "supplierName", label: "Supplier" },
      { key: "status", label: "Status" },
      { key: "total", label: "Total", type: "number" },
    ]} />;
}
