import { GenericPage } from "@/components/data/GenericPage";
export default function ReceivingsPage() {
  return <GenericPage title="Receivings" path="/api/receivings"
    columns={[
      { key: "number", label: "Number" },
      { key: "poNumber", label: "PO" },
      { key: "status", label: "Status" },
    ]} />;
}
