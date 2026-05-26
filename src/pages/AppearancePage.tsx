import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/**
 * AppearancePage — redirects users to the full Settings page (Appearance tab).
 * Kept as a route for backward compatibility with any bookmarks.
 */
export default function AppearancePage() {
  useEffect(() => { document.title = "Appearance · VMS"; }, []);
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="text-sm text-muted-foreground">
        Appearance settings have moved to the main Settings page.
      </p>
      <Button asChild className="gap-2">
        <Link to="/settings?tab=appearance">
          <ArrowLeft className="h-4 w-4" /> Go to Settings
        </Link>
      </Button>
    </div>
  );
}
