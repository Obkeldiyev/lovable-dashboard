import { GenericPage } from "@/components/data/GenericPage";
export default function OpsPage() {
  return <GenericPage title="Operations" description="Pick, pack and ops tasks" path="/api/ops/tasks"
    columns={[
      { key: "type", label: "Type" },
      { key: "reference", label: "Reference" },
      { key: "assigneeName", label: "Assignee" },
      { key: "status", label: "Status" },
    ]} />;
}
