import { GenericPage } from "@/components/data/GenericPage";
export default function CycleCountsPage() {
  return <GenericPage title="Cycle Counts" path="/api/cycle-counts"
    columns={[
      { key: "number", label: "Number" },
      { key: "warehouseName", label: "Warehouse" },
      { key: "status", label: "Status" },
      { key: "scheduledAt", label: "Scheduled" },
    ]} />;
}
