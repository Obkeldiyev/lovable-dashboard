import { GenericPage } from "@/components/data/GenericPage";
export default function OrdersPage() {
  return <GenericPage title="Orders" path="/api/orders"
    columns={[
      { key: "number", label: "Number" },
      { key: "customerName", label: "Customer" },
      { key: "status", label: "Status" },
      { key: "total", label: "Total", type: "number" },
    ]} />;
}
