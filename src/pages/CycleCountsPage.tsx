import { GenericPage } from "@/components/data/GenericPage";
import { UuidCell } from "@/components/ui/uuid-cell";

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
        {
          key: "id",
          label: "ID",
          render: (v: any) => <UuidCell value={String(v)} />,
        },
        {
          key: "payload",
          label: "Warehouse",
          render: (v: any) =>
            (v as any)?.warehouseId ? <UuidCell value={String((v as any).warehouseId)} /> : "—",
        },
        {
          key: "payload",
          label: "Status",
          render: (v: any) => (v as any)?.status ?? "—",
        },
        {
          key: "payload",
          label: "Scheduled",
          render: (v: any) =>
            (v as any)?.scheduledDate
              ? new Date((v as any).scheduledDate).toLocaleDateString()
              : "—",
        },
        {
          key: "createdAt",
          label: "Created",
          render: (v: any) => (v ? new Date(v).toLocaleDateString() : "—"),
        },
      ]}
      createConfig={{
        title: "Cycle Count",
        postUrl: "/api/cycle-counts",
        fields: [
          {
            key: "warehouseId",
            label: "Warehouse",
            required: true,
            type: "fetchselect",
            fetchUrl: "/api/warehouses",
            labelKey: "name",
            searchKeys: ["code"],
            placeholder: "Select warehouse…",
          },
          { key: "scheduledDate", label: "Scheduled Date", type: "date" },
          // Zones are scoped to a warehouse, so this is a dependentfetchselect:
          // it stays disabled until a warehouse is chosen above, then loads
          // /api/warehouses/:id/zones. If that endpoint isn't live yet on the
          // backend, the combobox will just show a "Failed to load options"
          // state instead of breaking the form — safe to ship ahead of it.
          {
            key: "zoneId",
            label: "Zone (optional)",
            type: "dependentfetchselect",
            dependsOn: "warehouseId",
            fetchUrl: (warehouseId) => `/api/warehouses/${warehouseId}/zones`,
            labelKey: "name",
            searchKeys: ["code"],
            placeholder: "Select zone…",
            placeholderBeforeParent: "Select a warehouse first…",
          },
        ],
      }}
    />
  );
}
