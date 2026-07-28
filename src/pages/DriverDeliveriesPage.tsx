import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle, Navigation } from "lucide-react";

export default function DriverDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<string | null>(null);

  const statusColor = {
    ASSIGNED: "bg-blue-100 text-blue-800",
    IN_TRANSIT: "bg-orange-100 text-orange-800",
    ARRIVED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Deliveries</h1>
        <p className="text-muted-foreground">Track and manage your delivery orders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries.length}</div>
            <p className="text-xs text-muted-foreground">Total assigned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries.filter(d => d.status === "DELIVERED").length}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries.filter(d => d.status === "IN_TRANSIT" || d.status === "ARRIVED").length}</div>
            <p className="text-xs text-muted-foreground">Currently on route</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {deliveries.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto opacity-50 mb-2" />
                <p>No deliveries assigned yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          deliveries.map((delivery) => (
            <Card key={delivery.id} className={activeDelivery === delivery.id ? "border-blue-500" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {delivery.shopName}
                      <Badge className={statusColor[delivery.status] || ""}>{delivery.status}</Badge>
                    </CardTitle>
                    <CardDescription>{delivery.address}</CardDescription>
                  </div>
                  {delivery.distance && (
                    <span className="text-sm font-medium text-muted-foreground">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {delivery.distance} km
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{delivery.phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Items</p>
                      <p className="text-sm font-medium">{delivery.itemCount || 0}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {delivery.status === "ASSIGNED" && (
                      <Button 
                        className="flex-1 gap-2"
                        onClick={() => setActiveDelivery(delivery.id)}
                      >
                        <Navigation className="w-4 h-4" />
                        Start Delivery
                      </Button>
                    )}
                    {delivery.status === "IN_TRANSIT" && (
                      <Button className="flex-1 gap-2">
                        <MapPin className="w-4 h-4" />
                        Arrived
                      </Button>
                    )}
                    {delivery.status === "ARRIVED" && (
                      <Button className="flex-1 gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Mark Delivered
                      </Button>
                    )}
                    {delivery.status === "DELIVERED" && (
                      <Button disabled className="flex-1 gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
