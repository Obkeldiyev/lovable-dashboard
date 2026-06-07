import { GenericPage } from "@/components/data/GenericPage";

// Backend: createCycleCount({
//   tenantId*, warehouseId* (used as outbox key),
//   zoneId?, binId?, scheduledDate?, assignedToId?
// })
// Stored as IntegrationOutbox topic="CYCLE_COUNT"
export default function CycleCountsPage() {
  return (
    <GenericPage
      title="Cycle Counts"
      description="Inventory cycle count sessions"
      path="/api/cycle-counts"
      deletable={false}
      columns={[
        { key: "id",        label: "ID",        render: (v: any) => String(v).slice(0, 8) },
        { key: "payload",   label: "Warehouse", render: (v: any) => (v as any)?.warehouseId?.slice(0, 8) ?? "—" },
        { key: "payload",   label: "Status",    render: (v: any) => (v as any)?.status ?? "—" },
        { key: "payload",   label: "Scheduled", render: (v: any) => (v as any)?.scheduledDate ? new Date((v as any).scheduledDate).toLocaleDateString() : "—" },
        { key: "createdAt", label: "Created",   render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
      ]}
      createConfig={{
        title: "Cycle Count",
        postUrl: "/api/cycle-counts",
        fields: [
          { key: "warehouseId",   label: "Warehouse ID",   required: true, type: "uuid", placeholder: "Warehouse UUID" },
          { key: "scheduledDate", label: "Scheduled Date", type: "date" },
          { key: "zoneId",        label: "Zone ID",        type: "uuid", placeholder: "Limit to a zone (optional)" },
        ],
      }}
    />
  );
}
