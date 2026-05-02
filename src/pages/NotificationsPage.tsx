import { GenericPage } from "@/components/data/GenericPage";
export default function NotificationsPage() {
  return <GenericPage title="Notifications" path="/api/notifications"
    columns={[
      { key: "title", label: "Title" },
      { key: "type", label: "Type" },
      { key: "createdAt", label: "When" },
      { key: "read", label: "Read" },
    ]} />;
}
