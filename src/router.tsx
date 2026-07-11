import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleRoute from "@/components/auth/RoleRoute";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const AppearancePage = lazy(() => import("@/pages/AppearancePage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const UsersPage = lazy(() => import("@/pages/UsersPage"));
const PermissionsPage = lazy(() => import("@/pages/PermissionsPage"));
const InventoryPage = lazy(() => import("@/pages/InventoryPage"));
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));
const BrandsPage = lazy(() => import("@/pages/BrandsPage"));
const CategoriesPage = lazy(() => import("@/pages/CategoriesPage"));
const SuppliersPage = lazy(() => import("@/pages/SuppliersPage"));
const WarehousesPage = lazy(() => import("@/pages/WarehousesPage"));
const PurchaseOrdersPage = lazy(() => import("@/pages/PurchaseOrdersPage"));
const OrdersPage = lazy(() => import("@/pages/OrdersPage"));
const ReceivingsPage = lazy(() => import("@/pages/ReceivingsPage"));
const ShipmentsPage = lazy(() => import("@/pages/ShipmentsPage"));
const CycleCountsPage = lazy(() => import("@/pages/CycleCountsPage"));
const OpsPage = lazy(() => import("@/pages/OpsPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const LogisticsPage = lazy(() => import("@/pages/LogisticsPage"));
const LogisticsSettingsPage = lazy(() => import("@/pages/LogisticsSettingsPage"));
const ShopsPage = lazy(() => import("@/pages/ShopsPage"));
const FleetPage = lazy(() => import("@/pages/FleetPage"));
const DriverPage = lazy(() => import("@/pages/DriverPage"));
const DriverNavigatePage = lazy(() => import("@/pages/DriverNavigatePage"));
const AgentPage = lazy(() => import("@/pages/AgentPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const ShopPricingPage = lazy(() => import("@/pages/ShopPricingPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// New role-based pages
const AgentReportsPage = lazy(() => import("@/pages/AgentReportsPage"));
const AgentBiddingPage = lazy(() => import("@/pages/AgentBiddingPage"));
const AgentVisitPlansPage = lazy(() => import("@/pages/AgentVisitPlansPage"));
const SupervisorDashboardPage = lazy(() => import("@/pages/SupervisorDashboardPage"));
const DriverDeliveriesPage = lazy(() => import("@/pages/DriverDeliveriesPage"));
const BrandProductsPage = lazy(() => import("@/pages/BrandProductsPage"));
const ManagerPaymentsPage = lazy(() => import("@/pages/ManagerPaymentsPage"));

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/brands" element={<BrandsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/warehouses" element={<WarehousesPage />} />
              <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/receivings" element={<ReceivingsPage />} />
              <Route path="/shipments" element={<ShipmentsPage />} />
              <Route path="/cycle-counts" element={<CycleCountsPage />} />
              <Route path="/ops" element={<OpsPage />} />
              <Route path="/logistics" element={<LogisticsPage />} />
              <Route path="/fleet" element={<FleetPage />} />
              <Route path="/shops" element={<ShopsPage />} />
              <Route element={<RoleRoute allow={["driver", "admin"]} />}>
                <Route path="/driver" element={<DriverPage />} />
                <Route path="/driver/navigate/:id" element={<DriverNavigatePage />} />
              </Route>
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings/appearance" element={<AppearancePage />} />
              <Route path="/settings/logistics" element={<LogisticsSettingsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/permissions" element={<PermissionsPage />} />
              <Route path="/agent" element={<AgentPage />} />
              <Route path="/agent/pricing" element={<ShopPricingPage />} />
              <Route path="/reports" element={<ReportsPage />} />

              {/* New role-based routes */}
              <Route element={<RoleRoute allow={["agent"]} />}>
                <Route path="/agent/reports" element={<AgentReportsPage />} />
                <Route path="/agent/bids" element={<AgentBiddingPage />} />
                <Route path="/agent/visits" element={<AgentVisitPlansPage />} />
              </Route>

              <Route element={<RoleRoute allow={["supervisor"]} />}>
                <Route path="/supervisor/dashboard" element={<SupervisorDashboardPage />} />
              </Route>

              <Route element={<RoleRoute allow={["driver"]} />}>
                <Route path="/driver/deliveries" element={<DriverDeliveriesPage />} />
              </Route>

              <Route element={<RoleRoute allow={["brand"]} />}>
                <Route path="/brand/products" element={<BrandProductsPage />} />
              </Route>

              <Route element={<RoleRoute allow={["manager"]} />}>
                <Route path="/manager/payments" element={<ManagerPaymentsPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

