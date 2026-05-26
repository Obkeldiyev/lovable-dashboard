import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, toggleMode } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        toggleMode(r.left + r.width / 2, r.top + r.height / 2);
      }}
      className={cn("relative overflow-hidden", className)}
    >
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-500",
          mode === "dark"
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 rotate-90 scale-50",
        )}
      >
        <Sun className="h-4 w-4" />
      </span>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-500",
          mode === "light"
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 -rotate-90 scale-50",
        )}
      >
        <Moon className="h-4 w-4" />
      </span>
    </Button>
  );
}
