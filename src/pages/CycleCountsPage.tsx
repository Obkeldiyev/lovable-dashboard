import { GenericPage } from "@/components/data/GenericPage";

export default function CycleCountsPage() {
  return (
    <GenericPage
      title="Cycle Counts"
      description="Inventory cycle count sessions"
      path="/api/cycle-counts"
      columns={[
        { key: "id",        label: "ID",        render: (v: any) => String(v).slice(0, 8) },
        { key: "payload",   label: "Warehouse", render: (v: any) => (v as any)?.warehouseId?.slice(0, 8) ?? "—" },
        { key: "payload",   label: "Status",    render: (v: any) => (v as any)?.status ?? "—" },
        { key: "payload",   label: "Scheduled", render: (v: any) => (v as any)?.scheduledDate ? new Date((v as any).scheduledDate).toLocaleDateString() : "—" },
        { key: "createdAt", label: "Created",   render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
      ]}
    />
  );
}
