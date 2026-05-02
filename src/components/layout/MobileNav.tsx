import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Boxes, Package, Bell, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { NAV } from "./AppSidebar";

const PRIMARY = [
  { key: "dashboard", url: "/dashboard", icon: LayoutDashboard },
  { key: "inventory", url: "/inventory", icon: Boxes },
  { key: "products", url: "/products", icon: Package },
  { key: "notifications", url: "/notifications", icon: Bell },
];

export function MobileNav() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {PRIMARY.map((i) => {
          const active = pathname.startsWith(i.url);
          return (
            <li key={i.key}>
              <NavLink
                to={i.url}
                className={`flex flex-col items-center gap-1 py-2 text-[11px] transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <i.icon className="h-5 w-5" />
                {t(`nav.${i.key}`)}
              </NavLink>
            </li>
          );
        })}
        <li>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="flex w-full flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground">
              <Menu className="h-5 w-5" />
              More
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetTitle>Navigate</SheetTitle>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {NAV.map((n) => (
                  <NavLink
                    key={n.key}
                    to={n.url}
                    onClick={() => setOpen(false)}
                    className="flex flex-col items-center gap-1 rounded-lg border border-border p-3 text-xs hover:bg-accent transition-colors"
                  >
                    <n.icon className="h-5 w-5" />
                    <span className="text-center">{t(`nav.${n.key}`)}</span>
                  </NavLink>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
