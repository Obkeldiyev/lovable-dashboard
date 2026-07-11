import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp } from "lucide-react";

export default function BrandProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    activeShops: 0,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Products</h1>
        <p className="text-muted-foreground">Track your brand products and sales</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">In catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Shops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeShops}</div>
            <p className="text-xs text-muted-foreground">Selling your products</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {products.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto opacity-50 mb-2" />
                <p>No products found. Contact your brand manager.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>SKU: {product.sku}</CardDescription>
                  </div>
                  <Badge>{product.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="text-sm font-medium">{product.price?.toLocaleString()} UZS</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">In Stock</p>
                    <p className="text-sm font-medium">{product.stock || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sales</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {product.sales || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Shops</p>
                    <p className="text-sm font-medium">{product.shops || 0}</p>
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
