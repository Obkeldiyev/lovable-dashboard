import { Outlet } from "react-router-dom";
import { AppNavbar } from "./AppNavbar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { MobileNav } from "./MobileNav";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAppSelector } from "@/store";
import { isNative } from "@/lib/native";
import { cn } from "@/lib/utils";

export default function AppLayout() {
  const { navMode, sidebarVariant, compactMode, animationsEnabled } = useAppSelector(
    (s) => s.preferences,
  );

  const isSidebar = navMode === "sidebar";
  const defaultOpen = sidebarVariant !== "collapsed";

  // On native mobile, always use the mobile-nav layout (no sidebar/navbar)
  const forceMobileLayout = isNative;

  if (!forceMobileLayout && isSidebar) {
    return (
      <SidebarProvider defaultOpen={defaultOpen}>
        <div className="flex min-h-screen w-full bg-background overflow-hidden">
          <AppSidebar />
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
            <AppHeader />
            <main
              className={cn(
                "flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden",
                "pb-6",
                compactMode ? "p-3" : "p-4 md:p-6",
                animationsEnabled && "animate-fade-in",
              )}
            >
              <Outlet />
            </main>
          </div>
        </div>
        <MobileNav />
      </SidebarProvider>
    );
  }

  if (!forceMobileLayout) {
    return (
      <div className="relative min-h-screen w-full bg-background overflow-x-hidden">
        <AppNavbar />
        <main
          className={cn(
            "flex flex-1 flex-col gap-4 overflow-x-hidden",
            "pb-20 md:pb-6",
            compactMode ? "p-3" : "p-4 md:p-6",
            animationsEnabled && "animate-fade-in",
          )}
        >
          <Outlet />
        </main>
        <MobileNav />
      </div>
    );
  }

  // ── Native mobile layout ──────────────────────────────────────────────────
  // No top navbar/sidebar — just content + bottom nav
  // Safe area insets handled via CSS env() variables
  return (
    <div
      className="flex flex-col bg-background overflow-hidden"
      style={{ height: "100dvh" }}
    >
      {/* Top safe area spacer (for notch) */}
      <div style={{ height: "env(safe-area-inset-top, 0px)", background: "hsl(var(--background))" }} />

      {/* Scrollable content */}
      <main
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden",
          "pb-2",
          compactMode ? "px-3 pt-3" : "px-4 pt-4",
          animationsEnabled && "animate-fade-in",
        )}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)" }}
      >
        <Outlet />
      </main>

      {/* Bottom nav with safe area */}
      <MobileNav />
    </div>
  );
}
