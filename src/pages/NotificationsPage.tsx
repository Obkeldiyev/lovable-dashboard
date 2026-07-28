import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Bell, Check, CheckCheck, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type Notification = {
  id: string;
  title: string;
  body?: string;
  channel: string;
  status: string;
  createdAt: string;
  readAt?: string | null;
};

const CHANNEL_COLOR: Record<string, string> = {
  IN_APP: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  EMAIL:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  SMS: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  PUSH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    document.title = `${t("notifications.title")} · VMS`;
  }, [t]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/notifications");
      const arr: Notification[] = Array.isArray(data)
        ? data
        : (data?.data ?? []);
      setItems(arr);
      setUnread(arr.filter((n) => n.status !== "READ").length);
    } catch {
      toast.error(t("notifications.toast.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: string) {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, status: "READ", readAt: new Date().toISOString() }
            : n,
        ),
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      toast.error(t("notifications.toast.markReadFailed"));
    }
  }

  async function markAllRead() {
    try {
      await api.post("/api/notifications/mark-all-read");
      setItems((prev) =>
        prev.map((n) => ({
          ...n,
          status: "READ",
          readAt: new Date().toISOString(),
        })),
      );
      setUnread(0);
      toast.success(t("notifications.toast.markAllReadSuccess"));
    } catch {
      toast.error(t("notifications.toast.markAllReadFailed"));
    }
  }

  async function deleteNotif(id: string) {
    try {
      await api.delete(`/api/notifications/${id}`);
      setItems((prev) => prev.filter((n) => n.id !== id));
      toast.success(t("notifications.toast.deletedSuccess"));
    } catch {
      toast.error(t("notifications.toast.deleteFailed"));
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t("notifications.title")}
            {unread > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unread}
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("notifications.summary", { total: items.length, unread })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            {t("notifications.refresh")}
          </Button>
          {unread > 0 && (
            <Button size="sm" onClick={markAllRead} className="gap-1.5">
              <CheckCheck className="h-4 w-4" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-muted/40 animate-pulse"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {t("notifications.noNotifications")}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[70vh]">
              <ul className="divide-y divide-border">
                {items.map((n) => {
                  const isRead = n.status === "READ";
                  return (
                    <li
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/30",
                        !isRead && "bg-primary/3",
                      )}
                    >
                      {/* Unread dot */}
                      <div className="mt-1.5 shrink-0">
                        {isRead ? (
                          <div className="h-2 w-2 rounded-full bg-transparent" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm leading-snug",
                              !isRead && "font-medium",
                            )}
                          >
                            {n.title}
                          </p>
                          <span
                            className={cn(
                              "shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                              CHANNEL_COLOR[n.channel] ??
                                "bg-muted text-muted-foreground",
                            )}
                          >
                            {n.channel}
                          </span>
                        </div>
                        {n.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {n.body}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground/60 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => markRead(n.id)}
                            title={t("notifications.markAsRead")}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNotif(n.id)}
                          title={t("notifications.delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
