import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as ReduxProvider } from "react-redux";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { store } from "@/store";
import { AppRouter } from "@/router";
import { useStatusBar, useNetwork } from "@/hooks/useNative";
import { usePreferencesSync } from "@/hooks/usePreferencesSync";
import { isNative } from "@/lib/native";
import "@/lib/i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // On mobile, retry less aggressively to save battery
      retry: isNative ? 1 : 3,
      staleTime: isNative ? 30_000 : 0,
    },
  },
});

/** Inner component so hooks can access ThemeProvider context */
function AppInner() {
  // Sync status bar color with theme (native only, no-op on web)
  useStatusBar();

  // Show offline banner when network drops
  const connected = useNetwork();

  // Debounced sync of all preferences + theme to the backend, per user
  usePreferencesSync();

  return (
    <>
      {!connected && (
        <div className="fixed top-0 inset-x-0 z-[9999] bg-destructive text-destructive-foreground text-xs text-center py-1.5 font-medium">
          No internet connection
        </div>
      )}
      <AppRouter />
    </>
  );
}

const App = () => (
  <ReduxProvider store={store}>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={150}>
          <Toaster />
          <Sonner />
          <AppInner />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ReduxProvider>
);

export default App;
