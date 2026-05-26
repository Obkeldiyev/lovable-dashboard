import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const location = useLocation();
  useEffect(() => {
    document.title = "404 · VMS";
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="text-center space-y-6 animate-fade-in">
        <div className="space-y-2">
          <p className="text-8xl font-black text-primary/20 select-none">404</p>
          <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            The page <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{location.pathname}</code> doesn't exist.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Go back
          </Button>
          <Button asChild className="gap-2">
            <Link to="/dashboard"><Home className="h-4 w-4" /> Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
