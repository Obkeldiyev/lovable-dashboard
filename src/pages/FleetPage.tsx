import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fleetApi, type Driver, type Vehicle } from "@/features/logistics/api";
import { useAppSelector } from "@/store";
import { UserPlus, Car, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DRIVER_STATUS_COLOR: Record<string, string> = {
  AVAILABLE:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  ON_DELIVERY:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  OFFLINE: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
  SUSPENDED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export default function FleetPage() {
  const { t } = useTranslation();
  const tenantId = useAppSelector((s) => s.auth.user?.tenantId);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [openD, setOpenD] = useState(false);
  const [openV, setOpenV] = useState(false);

  useEffect(() => {
    document.title = `${t("fleetPage.title")} · VMS`;
  }, [t]);

  const load = async () => {
    setLoading(true);
    const params = tenantId ? { tenantId } : undefined;
    await Promise.allSettled([
      fleetApi
        .drivers(params)
        .then(setDrivers)
        .catch(() => setDrivers([])),
      fleetApi
        .vehicles(params)
        .then(setVehicles)
        .catch(() => setVehicles([])),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [tenantId]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {t("fleetPage.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("fleetPage.subtitle")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          {t("fleetPage.refresh")}
        </Button>
      </div>

      <Tabs defaultValue="drivers">
        <TabsList>
          <TabsTrigger value="drivers">
            {t("fleetPage.tabs.drivers")}
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {drivers.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="vehicles">
            {t("fleetPage.tabs.vehicles")}
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {vehicles.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">
                {t("fleetPage.drivers.title")}
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setOpenD(true)}
                className="gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5" />{" "}
                {t("fleetPage.drivers.add")}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-14 rounded-lg bg-muted/40 animate-pulse"
                    />
                  ))}
                </div>
              ) : drivers.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  {t("fleetPage.drivers.empty")}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {drivers.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm">{d.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.phone ?? "—"}
                          {d.licenseNo && (
                            <span className="ml-2 font-mono">
                              #{d.licenseNo}
                            </span>
                          )}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-medium",
                          DRIVER_STATUS_COLOR[d.status ?? "OFFLINE"],
                        )}
                      >
                        {t(
                          `fleetPage.drivers.status.${d.status}`,
                          d.status ?? "OFFLINE",
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">
                {t("fleetPage.vehicles.title")}
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setOpenV(true)}
                className="gap-1.5"
              >
                <Car className="h-3.5 w-3.5" /> {t("fleetPage.vehicles.add")}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-14 rounded-lg bg-muted/40 animate-pulse"
                    />
                  ))}
                </div>
              ) : vehicles.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  {t("fleetPage.vehicles.empty")}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {vehicles.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm font-mono">
                          {v.plateNo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {v.type ?? "—"}
                          {v.capacityKg && (
                            <span className="ml-2">
                              {v.capacityKg}{" "}
                              {t("fleetPage.vehicles.capacityUnit")}
                            </span>
                          )}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {v.type ?? "—"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DriverDialog
        open={openD}
        tenantId={tenantId}
        onOpenChange={setOpenD}
        onSaved={() => {
          setOpenD(false);
          load();
        }}
      />
      <VehicleDialog
        open={openV}
        tenantId={tenantId}
        onOpenChange={setOpenV}
        onSaved={() => {
          setOpenV(false);
          load();
        }}
      />
    </div>
  );
}

function DriverDialog({
  open,
  tenantId,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  tenantId?: string;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [f, setF] = useState({
    fullName: "",
    phone: "",
    licenseNo: "",
    status: "AVAILABLE",
  });

  async function save() {
    if (!f.fullName.trim())
      return toast.error(t("fleetPage.driverDialog.fullNameRequired"));
    if (!f.phone.trim())
      return toast.error(t("fleetPage.driverDialog.phoneRequired"));
    try {
      await fleetApi.createDriver({ ...f, tenantId } as any);
      toast.success(t("fleetPage.driverDialog.added"));
      setF({ fullName: "", phone: "", licenseNo: "", status: "AVAILABLE" });
      onSaved();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.error ?? e?.message ?? t("fleetPage.failed"),
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("fleetPage.driverDialog.title")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("fleetPage.driverDialog.fullName")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              value={f.fullName}
              onChange={(e) => setF({ ...f, fullName: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("fleetPage.driverDialog.phone")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                value={f.phone}
                onChange={(e) => setF({ ...f, phone: e.target.value })}
                placeholder="+998901234567"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("fleetPage.driverDialog.licenseNo")}
              </Label>
              <Input
                value={f.licenseNo}
                onChange={(e) => setF({ ...f, licenseNo: e.target.value })}
                placeholder="AA1234567"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("fleetPage.driverDialog.initialStatus")}
            </Label>
            <Select
              value={f.status}
              onValueChange={(v) => setF({ ...f, status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["OFFLINE", "AVAILABLE", "ON_DELIVERY", "SUSPENDED"].map(
                  (s) => (
                    <SelectItem key={s} value={s}>
                      {t(`fleetPage.drivers.status.${s}`, s)}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("fleetPage.driverDialog.cancel")}
          </Button>
          <Button onClick={save}>{t("fleetPage.driverDialog.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VehicleDialog({
  open,
  tenantId,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  tenantId?: string;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [f, setF] = useState({ plateNo: "", type: "VAN", capacityKg: "" });

  async function save() {
    if (!f.plateNo.trim())
      return toast.error(t("fleetPage.vehicleDialog.plateRequired"));
    try {
      await fleetApi.createVehicle({
        plateNo: f.plateNo,
        type: f.type as any,
        capacityKg: f.capacityKg ? Number(f.capacityKg) : undefined,
        tenantId,
      } as any);
      toast.success(t("fleetPage.vehicleDialog.added"));
      setF({ plateNo: "", type: "VAN", capacityKg: "" });
      onSaved();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.error ?? e?.message ?? t("fleetPage.failed"),
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("fleetPage.vehicleDialog.title")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("fleetPage.vehicleDialog.plateNo")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              value={f.plateNo}
              onChange={(e) => setF({ ...f, plateNo: e.target.value })}
              placeholder="01A123BC"
              className="font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("fleetPage.vehicleDialog.type")}
              </Label>
              <Select
                value={f.type}
                onValueChange={(v) => setF({ ...f, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["CAR", "VAN", "TRUCK", "BIKE", "MOTORCYCLE"].map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("fleetPage.vehicleDialog.capacity")}
              </Label>
              <Input
                type="number"
                value={f.capacityKg}
                onChange={(e) => setF({ ...f, capacityKg: e.target.value })}
                placeholder="1000"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("fleetPage.vehicleDialog.cancel")}
          </Button>
          <Button onClick={save}>{t("fleetPage.vehicleDialog.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
