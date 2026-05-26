import { useLocation, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, Search, Globe, LogOut, Settings, ChevronDown } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NAV } from "./AppSidebar";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/authSlice";
import { authApi } from "@/features/auth/api";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const prefs = useAppSelector((s) => s.preferences);

  const current = NAV.find((n) => pathname === n.url || (n.url !== "/dashboard" && pathname.startsWith(n.url)));
  const title = current ? t(`nav.${current.key}`) : t("nav.dashboard");

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? "U").toUpperCase();

  async function handleLogout() {
    await authApi.logout();
    dispatch(logout());
    navigate("/login");
  }

  return (
    <header
      className={cn(
        "z-30 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        prefs.stickyHeader ? "sticky top-0" : "relative",
      )}
    >
      <SidebarTrigger className="h-8 w-8 shrink-0" />
      <div className="h-4 w-px bg-border mx-1 hidden md:block shrink-0" />

      {/* Page title */}
      <h1 className="text-sm font-semibold tracking-tight truncate hidden sm:block">{title}</h1>

      <div className="ml-auto flex items-center gap-1">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t("common.search", "Search…")}
            className="h-8 w-44 lg:w-52 bg-muted/50 pl-8 text-sm focus:bg-background transition-colors"
          />
        </div>

        {/* Language */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Language">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {(["en", "ru", "uz"] as const).map((l) => (
              <DropdownMenuItem
                key={l}
                onClick={() => i18n.changeLanguage(l)}
                className={cn("gap-2", i18n.language === l && "font-semibold text-primary")}
              >
                {l === "en" ? "🇺🇸 English" : l === "ru" ? "🇷🇺 Русский" : "🇺🇿 O'zbek"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label="Notifications" asChild>
          <NavLink to="/notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive live-dot" />
          </NavLink>
        </Button>

        <ThemeToggle className="h-8 w-8" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2 ml-0.5">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-xs font-medium truncate max-w-[80px]">
                {user?.name ?? user?.email ?? "User"}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-sm">{user?.name ?? "User"}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                {user?.role && (
                  <Badge variant="secondary" className="w-fit text-[10px] mt-0.5 px-1.5">
                    {user.role}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <NavLink to="/settings" className="cursor-pointer gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
