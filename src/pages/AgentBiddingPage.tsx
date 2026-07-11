import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MapPin, Gavel } from "lucide-react";

export default function AgentBiddingPage() {
  const [bids, setBids] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [showBidForm, setShowBidForm] = useState(false);
  const [selectedShop, setSelectedShop] = useState<string>("");
  const [bidAmount, setBidAmount] = useState<string>("");
  const [activeTab, setActiveTab] = useState("available");

  const handlePlaceBid = async () => {
    if (!selectedShop || !bidAmount) return;
    // TODO: Call API to place bid
    console.log("Place bid", { shopId: selectedShop, amount: bidAmount });
    setShowBidForm(false);
    setSelectedShop("");
    setBidAmount("");
  };

  const statusColor = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agent Bidding</h1>
          <p className="text-muted-foreground">Place bids on orders from shops in your region</p>
        </div>
        <Button onClick={() => setShowBidForm(!showBidForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Bid
        </Button>
      </div>

      {showBidForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Place New Bid</CardTitle>
            <CardDescription>Bid on orders from shops in your region</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Shop</label>
              <Input
                type="text"
                placeholder="Search shops..."
                onChange={(e) => setSelectedShop(e.target.value)}
              />
              {/* TODO: Show shop suggestions based on input */}
            </div>

            <div>
              <label className="text-sm font-medium">Bid Amount</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Enter bid amount"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                />
                <span className="flex items-center text-muted-foreground">UZS</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePlaceBid} className="flex-1" disabled={!selectedShop || !bidAmount}>
                Place Bid
              </Button>
              <Button variant="outline" onClick={() => setShowBidForm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="available">Available Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending Bids</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {shops.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Gavel className="w-12 h-12 mx-auto opacity-50 mb-2" />
                  <p>No available orders at the moment. Check back soon!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            shops.map((shop) => (
              <Card key={shop.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {shop.name}
                        <Badge variant="outline">
                          <MapPin className="w-3 h-3 mr-1" />
                          {shop.distance}m away
                        </Badge>
                      </CardTitle>
                      <CardDescription>{shop.address}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm">
                        <strong>Order Value:</strong> {shop.orderValue.toLocaleString()} UZS
                      </p>
                      <p className="text-sm">
                        <strong>Items:</strong> {shop.itemCount}
                      </p>
                    </div>
                    <Button onClick={() => setShowBidForm(true)}>Place Bid</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {bids.filter((b) => b.status === "PENDING").length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No pending bids
              </CardContent>
            </Card>
          ) : (
            bids
              .filter((b) => b.status === "PENDING")
              .map((bid) => (
                <Card key={bid.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{bid.shopName}</CardTitle>
                        <CardDescription>Bid Amount: {bid.amount.toLocaleString()} UZS</CardDescription>
                      </div>
                      <Badge className={statusColor[bid.status]}>Pending</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          {bids.filter((b) => b.status === "ACCEPTED").length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No accepted bids yet
              </CardContent>
            </Card>
          ) : (
            bids
              .filter((b) => b.status === "ACCEPTED")
              .map((bid) => (
                <Card key={bid.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{bid.shopName}</CardTitle>
                        <CardDescription>Bid Amount: {bid.amount.toLocaleString()} UZS</CardDescription>
                      </div>
                      <Badge className={statusColor[bid.status]}>Accepted</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
