import {
  LayoutDashboard, Boxes, Package, Tags, FolderTree, Truck,
  Warehouse, ShoppingCart, ClipboardList, PackageCheck, Send,
  ScanBarcode, Workflow, Bell, Settings, MapPinned, Navigation, Store, Users,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export const NAV = [
  { key: "dashboard", url: "/dashboard", icon: LayoutDashboard, group: "main" },
  { key: "inventory", url: "/inventory", icon: Boxes, group: "main" },
  { key: "products", url: "/products", icon: Package, group: "main" },
  { key: "brands", url: "/brands", icon: Tags, group: "catalog" },
  { key: "categories", url: "/categories", icon: FolderTree, group: "catalog" },
  { key: "suppliers", url: "/suppliers", icon: Truck, group: "catalog" },
  { key: "warehouses", url: "/warehouses", icon: Warehouse, group: "ops" },
  { key: "purchaseOrders", url: "/purchase-orders", icon: ShoppingCart, group: "ops" },
  { key: "orders", url: "/orders", icon: ClipboardList, group: "ops" },
  { key: "receivings", url: "/receivings", icon: PackageCheck, group: "ops" },
  { key: "shipments", url: "/shipments", icon: Send, group: "ops" },
  { key: "cycleCounts", url: "/cycle-counts", icon: ScanBarcode, group: "ops" },
  { key: "ops", url: "/ops", icon: Workflow, group: "ops" },
  { key: "logistics", url: "/logistics", icon: MapPinned, group: "logistics" },
  { key: "fleet", url: "/fleet", icon: Users, group: "logistics" },
  { key: "shops", url: "/shops", icon: Store, group: "logistics" },
  { key: "driver", url: "/driver", icon: Navigation, group: "logistics" },
  { key: "notifications", url: "/notifications", icon: Bell, group: "system" },
  { key: "settings", url: "/settings/appearance", icon: Settings, group: "system" },
] as const;

const GROUPS = [
  { id: "main", label: "Main" },
  { id: "catalog", label: "Catalog" },
  { id: "ops", label: "Operations" },
  { id: "logistics", label: "Logistics" },
  { id: "system", label: "System" },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { t } = useTranslation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-3 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center text-sm font-bold">
              V
            </div>
            {!collapsed && (
              <span className="font-semibold tracking-tight">VMS</span>
            )}
          </div>
        </div>
        {GROUPS.map((g) => {
          const items = NAV.filter((n) => n.group === g.id);
          return (
            <SidebarGroup key={g.id}>
              {!collapsed && <SidebarGroupLabel>{g.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const active = pathname.startsWith(item.url);
                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton asChild isActive={active}>
                          <NavLink
                            to={item.url}
                            className="flex items-center gap-2 transition-colors hover:bg-accent/60"
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            {!collapsed && (
                              <span className="truncate">
                                {t(`nav.${item.key}`)}
                              </span>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
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
