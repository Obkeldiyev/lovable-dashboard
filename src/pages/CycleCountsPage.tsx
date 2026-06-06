import { GenericPage } from "@/components/data/GenericPage";

export default function CycleCountsPage() {
  return (
    <GenericPage
      title="Cycle Counts"
      description="Inventory cycle count sessions"
      path="/api/cycle-counts"
      columns={[
        { key: "id",        label: "ID",        render: (v: any) => String(v).slice(0, 8) },
        { key: "warehouse", label: "Warehouse", render: (v: any) => (v as any)?.name ?? "—" },
        { key: "status",    label: "Status",    type: "badge" },
        { key: "createdAt", label: "Created",   render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
      ]}
      createConfig={{
        title: "Cycle Count",
        postUrl: "/api/cycle-counts",
        fields: [
          { key: "warehouseId",    label: "Warehouse ID",   required: true, placeholder: "Warehouse UUID" },
          { key: "scheduledDate",  label: "Scheduled Date", type: "date" },
          { key: "notes",          label: "Notes",          type: "textarea" },
        ],
      }}
    />
  );
}
