import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { tripsApi, type Trip } from "@/features/logistics/api";
import { Navigation, MapPin } from "lucide-react";

export default function DriverPage() {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  useEffect(() => {
    tripsApi
      .myTrips()
      .then(setTrips)
      .catch(() => setTrips([]));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">My trips</h2>
        <p className="text-sm text-muted-foreground">
          Tap a trip to start navigation.
        </p>
      </div>
      {trips === null ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No assigned trips
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {trips.map((t) => (
            <Card key={t.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">
                  {t.number ?? t.id.slice(0, 8)}
                </CardTitle>
                <Badge variant="outline">{t.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary" />
                    <span className="line-clamp-1">
                      {t.origin?.address ?? "Origin"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 text-destructive" />
                    <span className="line-clamp-1">
                      {t.destination?.address ?? "Destination"}
                    </span>
                  </div>
                </div>
                <Button asChild className="w-full gap-2">
                  <Link to={`/driver/navigate/${t.id}`}>
                    <Navigation className="h-4 w-4" /> Start navigation
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
