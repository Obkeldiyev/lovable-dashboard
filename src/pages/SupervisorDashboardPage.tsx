import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, Users, CheckSquare, TrendingUp } from "lucide-react";

export default function SupervisorDashboardPage() {
  const [adminLocations, setAdminLocations] = useState<any[]>([]);
  const [bidApprovals, setBidApprovals] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Supervisor Dashboard</h1>
        <p className="text-muted-foreground">Manage admins, track locations, and approve bids</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminLocations.length}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Bids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bidApprovals.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
            <p className="text-xs text-muted-foreground">Under supervision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.reduce((sum, t) => sum + (t.agents?.length || 0), 0)}</div>
            <p className="text-xs text-muted-foreground">In your teams</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="locations">
        <TabsList>
          <TabsTrigger value="locations" className="gap-2">
            <Map className="w-4 h-4" />
            Admin Locations
          </TabsTrigger>
          <TabsTrigger value="bids" className="gap-2">
            <CheckSquare className="w-4 h-4" />
            Bid Approvals
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-2">
            <Users className="w-4 h-4" />
            Teams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="space-y-4">
          {adminLocations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Map className="w-12 h-12 mx-auto opacity-50 mb-2" />
                  <p>No admin location data available</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div>
              {/* TODO: Show map with admin locations */}
              <Card className="h-96 flex items-center justify-center">
                <p className="text-muted-foreground">Map component coming soon</p>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bids" className="space-y-4">
          {bidApprovals.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <CheckSquare className="w-12 h-12 mx-auto opacity-50 mb-2" />
                  <p>No pending bid approvals</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            bidApprovals.map((bid) => (
              <Card key={bid.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{bid.agentName}</CardTitle>
                      <CardDescription>{bid.shopName}</CardDescription>
                    </div>
                    <Badge>{bid.amount.toLocaleString()} UZS</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default">Approve</Button>
                    <Button size="sm" variant="outline">Reject</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          {teams.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto opacity-50 mb-2" />
                  <p>No teams under supervision</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{team.adminName}</CardTitle>
                      <CardDescription>Admin Manager</CardDescription>
                    </div>
                    <Badge variant="outline">{team.agents?.length || 0} agents</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {team.agents?.map((agent: any) => (
                      <div key={agent.id} className="text-sm flex items-center justify-between">
                        <span>{agent.name}</span>
                        <Badge variant="secondary">{agent.status}</Badge>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" className="mt-4 w-full" variant="outline">View Details</Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
