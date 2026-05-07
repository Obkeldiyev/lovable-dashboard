import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleRoute from "@/components/auth/RoleRoute";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const AppearancePage = lazy(() => import("@/pages/AppearancePage"));
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
const NotFound = lazy(() => import("@/pages/NotFound"));

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
              <Route path="/settings" element={<Navigate to="/settings/appearance" replace />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
