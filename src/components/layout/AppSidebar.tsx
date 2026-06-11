import {
  LayoutDashboard, Boxes, Package, Tags, FolderTree, Truck,
  Warehouse, ShoppingCart, ClipboardList, PackageCheck, Send,
  ScanBarcode, Workflow, Bell, Settings, MapPinned, Navigation, Store,
  Users, UserCog, ShieldCheck, Route, Camera, BarChart3, DollarSign,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store";
import { canSeeNav } from "@/lib/navPermissions";

export const NAV = [
  { key: "dashboard",     url: "/dashboard",       icon: LayoutDashboard, group: "main" },
  { key: "inventory",     url: "/inventory",        icon: Boxes,           group: "main" },
  { key: "products",      url: "/products",         icon: Package,         group: "main" },
  { key: "brands",        url: "/brands",           icon: Tags,            group: "catalog" },
  { key: "categories",    url: "/categories",       icon: FolderTree,      group: "catalog" },
  { key: "suppliers",     url: "/suppliers",        icon: Truck,           group: "catalog" },
  { key: "warehouses",    url: "/warehouses",       icon: Warehouse,       group: "ops" },
  { key: "purchaseOrders",url: "/purchase-orders",  icon: ShoppingCart,    group: "ops" },
  { key: "orders",        url: "/orders",           icon: ClipboardList,   group: "ops" },
  { key: "receivings",    url: "/receivings",       icon: PackageCheck,    group: "ops" },
  { key: "shipments",     url: "/shipments",        icon: Send,            group: "ops" },
  { key: "cycleCounts",   url: "/cycle-counts",     icon: ScanBarcode,     group: "ops" },
  { key: "ops",           url: "/ops",              icon: Workflow,        group: "ops" },
  { key: "logistics",     url: "/logistics",        icon: MapPinned,       group: "logistics" },
  { key: "fleet",         url: "/fleet",            icon: Users,           group: "logistics" },
  { key: "shops",         url: "/shops",            icon: Store,           group: "logistics" },
  { key: "agentVisits",   url: "/agent",            icon: Route,           group: "logistics" },
  { key: "agentPricing",  url: "/agent/pricing",    icon: DollarSign,      group: "logistics" },
  { key: "driver",        url: "/driver",           icon: Navigation,      group: "logistics" },
  { key: "notifications", url: "/notifications",    icon: Bell,            group: "system" },
  { key: "users",         url: "/users",            icon: UserCog,         group: "system" },
  { key: "permissions",   url: "/permissions",      icon: ShieldCheck,     group: "system" },
  { key: "reports",       url: "/reports",          icon: BarChart3,       group: "system" },
  { key: "settings",      url: "/settings",         icon: Settings,        group: "system" },
] as const;

const GROUPS = [
  { id: "main" },
  { id: "catalog" },
  { id: "ops" },
  { id: "logistics" },
  { id: "system" },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const role = useAppSelector((s) => s.auth.user?.role);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        {/* Logo */}
        <div
          className={cn(
            "flex items-center gap-2.5 px-3 py-4 border-b border-sidebar-border",
            collapsed && "justify-center px-2",
          )}
        >
          <div className="h-8 w-8 shrink-0 rounded-lg bg-primary text-primary-foreground grid place-items-center text-sm font-bold shadow-sm">
            V
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="font-bold tracking-tight text-sidebar-foreground text-sm">VMS</span>
              <span className="text-[10px] text-sidebar-foreground/50 tracking-wide">{t("app.subtitle")}</span>
            </div>
          )}
        </div>

        {GROUPS.map((g) => {
          const items = NAV.filter((n) => n.group === g.id && canSeeNav(n.key, role));
          if (items.length === 0) return null;

          return (
            <SidebarGroup key={g.id} className="py-1">
              {!collapsed && (
                <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] tracking-widest px-3 py-1.5">
                  {t(`navGroups.${g.id}`, g.id)}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const active =
                      pathname === item.url ||
                      (item.url !== "/dashboard" && pathname.startsWith(item.url));

                    const btn = (
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={cn(
                          "h-9 rounded-md transition-all duration-150",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                        )}
                      >
                        <NavLink to={item.url} className="flex items-center gap-2.5 px-2.5">
                          <item.icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              active ? "text-sidebar-primary" : "text-sidebar-foreground/60",
                            )}
                          />
                          {!collapsed && (
                            <span className="truncate text-sm">{t(`nav.${item.key}`, item.key)}</span>
                          )}
                          {!collapsed && active && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary shrink-0" />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    );

                    return (
                      <SidebarMenuItem key={item.key}>
                        {collapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>{btn}</TooltipTrigger>
                            <TooltipContent side="right" className="text-xs">
                              {t(`nav.${item.key}`, item.key)}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          btn
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
