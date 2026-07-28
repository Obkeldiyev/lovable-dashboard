import { useState } from "react";
import { Bell, Globe, Search, LogOut, User, Settings, ChevronDown } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/authSlice";
import { authApi } from "@/features/auth/api";
import { cn } from "@/lib/utils";
import { canSeeNav } from "@/lib/navPermissions";
import { CommandSearch } from "./CommandSearch";

type NavItem = {
  key: string;
  path?: string;
  children?: NavItem[];
  roles?: string[]; // optional explicit override
};

const navList: NavItem[] = [
  { key: "dashboard", path: "/dashboard" },
  {
    key: "inventory",
    children: [
      { key: "warehouses",  path: "/warehouses" },
      { key: "inventory",   path: "/inventory" },
      { key: "cycleCounts", path: "/cycle-counts" },
    ],
  },
  {
    key: "products",
    children: [
      { key: "products",   path: "/products" },
      { key: "categories", path: "/categories" },
      { key: "brands",     path: "/brands" },
    ],
  },
  {
    key: "procurement",
    children: [
      { key: "suppliers",      path: "/suppliers" },
      { key: "purchaseOrders", path: "/purchase-orders" },
      { key: "receivings",     path: "/receivings" },
    ],
  },
  {
    key: "fulfillment",
    children: [
      { key: "orders",    path: "/orders" },
      { key: "shipments", path: "/shipments" },
      { key: "driver",    path: "/driver" },
    ],
  },
  {
    key: "logistics",
    children: [
      { key: "logistics",    path: "/logistics" },
      { key: "fleet",        path: "/fleet" },
      { key: "shops",        path: "/shops" },
      { key: "agentVisits",  path: "/agent" },
      { key: "agentPricing", path: "/agent/pricing" },
    ],
  },
  {
    key: "admin",
    children: [
      { key: "users",         path: "/users" },
      { key: "permissions",   path: "/permissions" },
      { key: "reports",       path: "/reports" },
      { key: "notifications", path: "/notifications" },
      { key: "ops",           path: "/ops" },
      { key: "settings",      path: "/settings" },
    ],
  },
];

export function AppNavbar() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const role = user?.role;
  const [commandOpen, setCommandOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? "U").toUpperCase();

  async function handleLogout() {
    await authApi.logout();
    dispatch(logout());
    navigate("/login");
  }

  // Filter nav items by role
  const visibleNav = navList
    .map((item) => {
      if (item.children) {
        const visibleChildren = item.children.filter((c) => canSeeNav(c.key, role));
        if (visibleChildren.length === 0) return null;
        return { ...item, children: visibleChildren };
      }
      return canSeeNav(item.key, role) ? item : null;
    })
    .filter(Boolean) as NavItem[];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center gap-1 px-3 md:px-4">
        {/* Logo */}
        <NavLink to="/dashboard" className="flex items-center gap-2 rounded-md px-2 py-1.5 mr-2 shrink-0">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            V
          </span>
          <span className="hidden text-lg font-semibold leading-none md:block">VMS</span>
        </NavLink>

        {/* Desktop nav */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            {visibleNav.map((item) =>
              item.children ? (
                <NavigationMenuItem key={item.key}>
                  <NavigationMenuTrigger className="h-9 text-sm">
                    {t(`nav.${item.key}`, item.key)}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="w-64 p-1">
                      {item.children.map((child) => (
                        <li key={child.key}>
                          <NavigationMenuLink asChild>
                            <NavLink
                              to={child.path ?? "#"}
                              className={({ isActive }) =>
                                cn(
                                  "flex flex-col gap-0.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                                  isActive && "bg-accent text-accent-foreground font-medium",
                                )
                              }
                            >
                              <span className="font-medium leading-none">
                                {t(`nav.${child.key}`, child.key)}
                              </span>
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {t(`navDescriptions.${child.key}`, "")}
                              </span>
                            </NavLink>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem key={item.key}>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <NavLink
                      to={item.path ?? "#"}
                      className={({ isActive }) =>
                        cn(navigationMenuTriggerStyle(), isActive && "bg-accent text-accent-foreground")
                      }
                    >
                      {t(`nav.${item.key}`, item.key)}
                    </NavLink>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ),
            )}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            readOnly
            onClick={() => setCommandOpen(true)}
            placeholder={t("common.search", "Search…")}
            className="h-9 w-48 lg:w-56 bg-muted/50 pl-8 pr-10 focus:bg-background transition-colors cursor-pointer"
          />
          <kbd className="pointer-events-none absolute right-2 top-2 hidden select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline-flex">
            ⌘K
          </kbd>
        </div>

        <CommandSearch open={commandOpen} onOpenChange={setCommandOpen} />

        {/* Language */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Language" className="h-9 w-9">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["en", "ru", "uz"].map((l) => (
              <DropdownMenuItem
                key={l}
                onClick={() => i18n.changeLanguage(l)}
                className={cn(i18n.language === l && "font-semibold text-primary")}
              >
                {l === "en" ? "🇺🇸 English" : l === "ru" ? "🇷🇺 Русский" : "🇺🇿 O'zbek"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" aria-label="Notifications" className="h-9 w-9 relative" asChild>
          <NavLink to="/notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive live-dot" />
          </NavLink>
        </Button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2 ml-1">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start leading-none">
                <span className="text-xs font-medium truncate max-w-[100px]">
                  {user?.name ?? user?.email ?? "User"}
                </span>
                {user?.role && (
                  <span className="text-[10px] text-muted-foreground">{user.role}</span>
                )}
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{user?.name ?? "User"}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                {user?.role && (
                  <Badge variant="secondary" className="w-fit text-[10px] mt-0.5">
                    {user.role}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <NavLink to="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                {t("common.settings")}
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("common.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
