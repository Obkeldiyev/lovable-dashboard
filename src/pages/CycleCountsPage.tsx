import { useTranslation } from "react-i18next";
import { GenericPage } from "@/components/data/GenericPage";
import { UuidCell } from "@/components/ui/uuid-cell";

// Backend: createCycleCount({
//   tenantId*, warehouseId* (used as outbox key),
//   zoneId?, binId?, scheduledDate?, assignedToId?
// })
// Stored as IntegrationOutbox topic="CYCLE_COUNT"
export default function CycleCountsPage() {
  const { t } = useTranslation();

  return (
    <GenericPage
      title={t("cycleCountsPage.title")}
      description={t("cycleCountsPage.description")}
      path="/api/cycle-counts"
      deletable={false}
      columns={[
        {
          key: "id",
          label: t("cycleCountsPage.columns.id"),
          render: (v: any) => <UuidCell value={String(v)} />,
        },
        {
          key: "payload",
          label: t("cycleCountsPage.columns.warehouse"),
          render: (v: any) =>
            (v as any)?.warehouseId ? (
              <UuidCell value={String((v as any).warehouseId)} />
            ) : (
              "—"
            ),
        },
        {
          key: "payload",
          label: t("cycleCountsPage.columns.status"),
          render: (v: any) => (v as any)?.status ?? "—",
        },
        {
          key: "payload",
          label: t("cycleCountsPage.columns.scheduled"),
          render: (v: any) =>
            (v as any)?.scheduledDate
              ? new Date((v as any).scheduledDate).toLocaleDateString()
              : "—",
        },
        {
          key: "createdAt",
          label: t("cycleCountsPage.columns.created"),
          render: (v: any) => (v ? new Date(v).toLocaleDateString() : "—"),
        },
      ]}
      createConfig={{
        title: t("cycleCountsPage.createTitle"),
        postUrl: "/api/cycle-counts",
        fields: [
          {
            key: "warehouseId",
            label: t("cycleCountsPage.fields.warehouseLabel"),
            required: true,
            type: "fetchselect",
            fetchUrl: "/api/warehouses",
            labelKey: "name",
            searchKeys: ["code"],
            placeholder: t("cycleCountsPage.fields.warehousePlaceholder"),
          },
          {
            key: "scheduledDate",
            label: t("cycleCountsPage.fields.scheduledDateLabel"),
            type: "date",
          },
          // Zones are scoped to a warehouse, so this is a dependentfetchselect:
          // it stays disabled until a warehouse is chosen above, then loads
          // /api/warehouses/:id/zones. If that endpoint isn't live yet on the
          // backend, the combobox will just show a "Failed to load options"
          // state instead of breaking the form — safe to ship ahead of it.
          {
            key: "zoneId",
            label: t("cycleCountsPage.fields.zoneLabel"),
            type: "dependentfetchselect",
            dependsOn: "warehouseId",
            fetchUrl: (warehouseId) => `/api/warehouses/${warehouseId}/zones`,
            labelKey: "name",
            searchKeys: ["code"],
            placeholder: t("cycleCountsPage.fields.zonePlaceholder"),
            placeholderBeforeParent: t(
              "cycleCountsPage.fields.zonePlaceholderBeforeParent",
            ),
          },
        ],
      }}
    />
  );
}
