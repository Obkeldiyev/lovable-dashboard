import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Boxes, Package, Bell, Menu, MapPinned } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { NAV } from "./AppSidebar";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { key: "dashboard",     url: "/dashboard",    icon: LayoutDashboard },
  { key: "inventory",     url: "/inventory",    icon: Boxes },
  { key: "logistics",     url: "/logistics",    icon: MapPinned },
  { key: "notifications", url: "/notifications",icon: Bell },
];

export function MobileNav() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden safe-area-bottom">
      <ul className="grid grid-cols-5 h-16">
        {PRIMARY.map((i) => {
          const active = pathname === i.url || (i.url !== "/dashboard" && pathname.startsWith(i.url));
          return (
            <li key={i.key} className="flex">
              <NavLink
                to={i.url}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <i.icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
                <span>{t(`nav.${i.key}`)}</span>
                {active && (
                  <span className="absolute bottom-1 h-0.5 w-5 rounded-full bg-primary" />
                )}
              </NavLink>
            </li>
          );
        })}
        <li className="flex">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                open ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Menu className="h-5 w-5" />
              <span>More</span>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[72vh] rounded-t-2xl">
              <SheetTitle className="text-base font-semibold mb-4">Navigate</SheetTitle>
              <div className="grid grid-cols-3 gap-2 overflow-y-auto pb-6">
                {NAV.map((n) => {
                  const active = pathname === n.url || (n.url !== "/dashboard" && pathname.startsWith(n.url));
                  return (
                    <NavLink
                      key={n.key}
                      to={n.url}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all",
                        active
                          ? "border-primary/40 bg-primary/5 text-primary"
                          : "border-border hover:bg-accent hover:border-accent-foreground/20 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <n.icon className="h-5 w-5" />
                      <span className="text-center leading-tight">{t(`nav.${n.key}`)}</span>
                    </NavLink>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
