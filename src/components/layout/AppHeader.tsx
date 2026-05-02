import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, Search, Globe } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NAV } from "./AppSidebar";

export function AppHeader() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const current = NAV.find((n) => pathname.startsWith(n.url));
  const title = current ? t(`nav.${current.key}`) : t("nav.dashboard");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur">
      <SidebarTrigger className="md:inline-flex hidden" />
      <h1 className="text-base font-semibold tracking-tight md:ml-1">{title}</h1>
      <div className="ml-auto flex items-center gap-1 md:gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            className="h-9 w-56 pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Language">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["en", "ru", "uz"].map((l) => (
              <DropdownMenuItem key={l} onClick={() => i18n.changeLanguage(l)}>
                {l.toUpperCase()}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
