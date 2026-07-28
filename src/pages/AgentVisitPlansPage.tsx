import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, MapPin, AlertCircle, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AgentVisitPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [assignedShops, setAssignedShops] = useState<any[]>([]);

  const statusIcon = {
    PLANNED: <Clock className="w-4 h-4" />,
    IN_PROGRESS: <AlertCircle className="w-4 h-4" />,
    COMPLETED: <CheckCircle className="w-4 h-4" />,
    CANCELLED: <AlertCircle className="w-4 h-4" />,
  };

  const statusColor = {
    PLANNED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-orange-100 text-orange-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Visit Plans & Assigned Shops</h1>
          <p className="text-muted-foreground">Manage your shop visit plans and assignments</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Visit Plan</DialogTitle>
              <DialogDescription>Plan which shops you will visit today</DialogDescription>
            </DialogHeader>
            {/* TODO: Add form to create visit plan */}
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Form coming soon</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="assigned">
        <TabsList>
          <TabsTrigger value="assigned">Assigned Shops</TabsTrigger>
          <TabsTrigger value="plans">Visit Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          {assignedShops.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto opacity-50 mb-2" />
                  <p>No shops assigned yet. Check back soon!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            assignedShops.map((shop) => (
              <Card key={shop.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {shop.name}
                        <Badge variant="outline">
                          <MapPin className="w-3 h-3 mr-1" />
                          {shop.distance || "Unknown"} km
                        </Badge>
                      </CardTitle>
                      <CardDescription>{shop.address}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">
                    <strong>Phone:</strong> {shop.phone || "N/A"}
                  </p>
                  <p className="text-sm">
                    <strong>Last Visit:</strong> {shop.lastVisit || "Never"}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm">Check In</Button>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          {plans.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto opacity-50 mb-2" />
                  <p>No visit plans created yet. Create one to get started!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {plan.date}
                        {statusIcon[plan.status] && <span className="ml-2">{statusIcon[plan.status]}</span>}
                      </CardTitle>
                      <CardDescription>
                        {plan.shops.length} shops planned
                      </CardDescription>
                    </div>
                    <Badge className={statusColor[plan.status] || ""}>{plan.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {plan.shops.map((shop: any, idx: number) => (
                      <div key={idx} className="text-sm flex items-center gap-2">
                        <span className="font-medium">{idx + 1}.</span>
                        <span>{shop.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm">Start Visit</Button>
                    <Button size="sm" variant="outline">Edit</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
