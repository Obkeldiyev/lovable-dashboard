import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAppSelector } from "@/store";
import {
  Shield,
  RefreshCw,
  Save,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const ROLES = [
  "SUPER_ADMIN",
  "DIRECTOR",
  "MANAGER",
  "WAREHOUSE_STAFF",
  "AGENT",
  "ACCOUNTANT",
  "SUPPORT",
] as const;

type Role = (typeof ROLES)[number];

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  DIRECTOR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  MANAGER: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  WAREHOUSE_STAFF:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  AGENT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  ACCOUNTANT:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  SUPPORT: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
};

// Group permissions by category
const PERMISSION_GROUPS: { labelKey: string; codes: string[] }[] = [
  {
    labelKey: "permissions.groups.pages",
    codes: [
      "page.dashboard.view",
      "page.inventory.view",
      "page.products.view",
      "page.procurement.view",
      "page.fulfillment.view",
      "page.logistics.view",
      "page.fleet.view",
      "page.shops.view",
      "page.reports.view",
      "page.users.view",
      "page.settings.view",
      "page.notifications.view",
    ],
  },
  {
    labelKey: "permissions.groups.inventory",
    codes: ["inventory.edit", "inventory.delete"],
  },
  {
    labelKey: "permissions.groups.products",
    codes: ["products.edit", "products.delete"],
  },
  {
    labelKey: "permissions.groups.orders",
    codes: ["orders.create", "orders.edit", "orders.delete"],
  },
  {
    labelKey: "permissions.groups.users",
    codes: ["users.create", "users.edit", "users.delete", "users.suspend"],
  },
  {
    labelKey: "permissions.groups.tenants",
    codes: ["tenants.manage"],
  },
  {
    labelKey: "permissions.groups.reports",
    codes: ["reports.export"],
  },
  {
    labelKey: "permissions.groups.logistics",
    codes: ["logistics.dispatch", "logistics.track"],
  },
];

export default function PermissionsPage() {
  const { t } = useTranslation();
  const currentUser = useAppSelector((s) => s.auth.user);
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const [allPerms, setAllPerms] = useState<string[]>([]);
  const [rolePerms, setRolePerms] = useState<Record<string, string[]>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>("MANAGER");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${t("permissions.title")} · VMS`;
  }, [t]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [permsRes, rolePermsRes] = await Promise.all([
        api.get("/api/permissions"),
        api.get("/api/permissions/roles"),
      ]);
      const perms: string[] = Array.isArray(permsRes.data?.data)
        ? permsRes.data.data
        : Array.isArray(permsRes.data)
          ? permsRes.data
          : [];
      const rp: Record<string, string[]> =
        rolePermsRes.data?.data ?? rolePermsRes.data ?? {};
      setAllPerms(perms);
      setRolePerms(rp);
      setDirty({});
    } catch {
      toast.error(t("permissions.toast.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  function togglePerm(role: string, code: string) {
    if (!isSuperAdmin) return;
    setRolePerms((prev) => {
      const current = prev[role] ?? [];
      const next = current.includes(code)
        ? current.filter((c) => c !== code)
        : [...current, code];
      return { ...prev, [role]: next };
    });
    setDirty((d) => ({ ...d, [role]: true }));
  }

  async function saveRole(role: string) {
    setSaving(role);
    try {
      await api.put(`/api/permissions/roles/${role}`, {
        permissions: rolePerms[role] ?? [],
      });
      setDirty((d) => ({ ...d, [role]: false }));
      toast.success(t("permissions.toast.saved", { role }));
    } catch (e: any) {
      toast.error(
        e?.response?.data?.error ?? t("permissions.toast.saveFailed"),
      );
    } finally {
      setSaving(null);
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-lg font-semibold">
          {t("permissions.unauthorized.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("permissions.unauthorized.description")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("permissions.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("permissions.subtitle")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
          {t("permissions.refresh")}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {ROLES.filter((r) => r !== "SUPER_ADMIN").map((role) => {
            const perms = rolePerms[role] ?? [];
            const isExpanded = expanded === role;
            const isDirty = dirty[role];

            return (
              <Card key={role} className={cn(isDirty && "border-primary/40")}>
                <CardHeader
                  className="cursor-pointer select-none py-3"
                  onClick={() => setExpanded(isExpanded ? null : role)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span
                        className={cn(
                          "text-[11px] px-2 py-0.5 rounded-full font-medium",
                          ROLE_COLORS[role],
                        )}
                      >
                        {role}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t("permissions.permissionCount", {
                          count: perms.length,
                        })}
                      </span>
                      {isDirty && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-primary border-primary/40"
                        >
                          {t("permissions.unsavedChanges")}
                        </Badge>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isDirty && (
                        <Button
                          size="sm"
                          onClick={() => saveRole(role)}
                          disabled={saving === role}
                          className="gap-1.5 h-7 text-xs"
                        >
                          <Save className="h-3.5 w-3.5" />
                          {saving === role
                            ? t("permissions.saving")
                            : t("permissions.save")}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 pb-4">
                    <div className="space-y-4">
                      {PERMISSION_GROUPS.map((group) => {
                        const groupPerms = group.codes.filter((c) =>
                          allPerms.includes(c),
                        );
                        if (groupPerms.length === 0) return null;
                        const allOn = groupPerms.every((c) =>
                          perms.includes(c),
                        );

                        return (
                          <div key={group.labelKey}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t(group.labelKey)}
                              </span>
                              <button
                                className="text-[10px] text-primary hover:underline"
                                onClick={() => {
                                  setRolePerms((prev) => {
                                    const current = prev[role] ?? [];
                                    const next = allOn
                                      ? current.filter(
                                          (c) => !groupPerms.includes(c),
                                        )
                                      : [
                                          ...new Set([
                                            ...current,
                                            ...groupPerms,
                                          ]),
                                        ];
                                    return { ...prev, [role]: next };
                                  });
                                  setDirty((d) => ({ ...d, [role]: true }));
                                }}
                              >
                                {allOn
                                  ? t("permissions.groups.removeAll")
                                  : t("permissions.groups.addAll")}
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {groupPerms.map((code) => {
                                const enabled = perms.includes(code);
                                return (
                                  <div
                                    key={code}
                                    className={cn(
                                      "flex items-center justify-between gap-2 rounded-md border px-3 py-2 transition-colors",
                                      enabled
                                        ? "border-primary/30 bg-primary/3"
                                        : "border-border",
                                    )}
                                  >
                                    <span className="text-xs font-mono text-muted-foreground truncate">
                                      {code}
                                    </span>
                                    <Switch
                                      checked={enabled}
                                      onCheckedChange={() =>
                                        togglePerm(role, code)
                                      }
                                      className="shrink-0"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                            <Separator className="mt-3" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
