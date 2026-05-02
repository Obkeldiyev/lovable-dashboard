import { GenericPage } from "@/components/data/GenericPage";
export default function ShipmentsPage() {
  return <GenericPage title="Shipments" path="/api/shipments"
    columns={[
      { key: "number", label: "Number" },
      { key: "carrier", label: "Carrier" },
      { key: "status", label: "Status" },
      { key: "trackingNumber", label: "Tracking", editable: true },
    ]} />;
}
