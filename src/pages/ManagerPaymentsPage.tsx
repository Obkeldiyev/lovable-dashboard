import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingDown, AlertCircle } from "lucide-react";

export default function ManagerPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    paidAmount: 0,
    debtAmount: 0,
    overdueAmount: 0,
  });
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  const statusColor = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PARTIAL: "bg-orange-100 text-orange-800",
    COMPLETED: "bg-green-100 text-green-800",
    OVERDUE: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <p className="text-muted-foreground">Track and manage shop payments and debts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Debt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.debtAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {payments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto opacity-50 mb-2" />
                  <p>No payment records yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            payments.map((payment) => (
              <Card key={payment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {payment.shopName}
                      </CardTitle>
                      <CardDescription>{payment.shopCode}</CardDescription>
                    </div>
                    <Badge className={statusColor[payment.status] || ""}>{payment.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Price</p>
                      <p className="text-sm font-medium">{payment.totalPrice?.toLocaleString()} UZS</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Paid</p>
                      <p className="text-sm font-medium text-green-600">{payment.paidAmount?.toLocaleString()} UZS</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Debt</p>
                      <p className="text-sm font-medium text-orange-600">{payment.debtAmount?.toLocaleString()} UZS</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="text-sm font-medium">{payment.dueDate || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm">Record Payment</Button>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {payments.filter(p => p.status === "PENDING").length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                All invoices paid or completed
              </CardContent>
            </Card>
          ) : (
            payments
              .filter(p => p.status === "PENDING")
              .map((payment) => (
                <Card key={payment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{payment.shopName}</CardTitle>
                        <CardDescription>{payment.totalPrice?.toLocaleString()} UZS due</CardDescription>
                      </div>
                      <Badge className={statusColor[payment.status] || ""}>{payment.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" className="w-full">Record Payment</Button>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {payments.filter(p => p.status === "OVERDUE").length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No overdue payments
              </CardContent>
            </Card>
          ) : (
            payments
              .filter(p => p.status === "OVERDUE")
              .map((payment) => (
                <Card key={payment.id} className="border-red-200 bg-red-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          {payment.shopName}
                        </CardTitle>
                        <CardDescription>{payment.debtAmount?.toLocaleString()} UZS overdue</CardDescription>
                      </div>
                      <Badge className={statusColor[payment.status] || ""}>{payment.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" className="w-full">Take Action</Button>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {payments.filter(p => p.status === "COMPLETED").length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No completed payments yet
              </CardContent>
            </Card>
          ) : (
            payments
              .filter(p => p.status === "COMPLETED")
              .map((payment) => (
                <Card key={payment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{payment.shopName}</CardTitle>
                        <CardDescription>Fully paid on {payment.paymentDate}</CardDescription>
                      </div>
                      <Badge className={statusColor[payment.status] || ""}>{payment.status}</Badge>
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
