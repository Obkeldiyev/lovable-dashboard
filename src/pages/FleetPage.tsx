import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fleetApi, type Driver, type Vehicle } from "@/features/logistics/api";
import { Plus, UserPlus, Car } from "lucide-react";
import { toast } from "sonner";

export default function FleetPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [openD, setOpenD] = useState(false);
  const [openV, setOpenV] = useState(false);

  const load = () => {
    fleetApi.drivers().then(setDrivers).catch(() => setDrivers([]));
    fleetApi.vehicles().then(setVehicles).catch(() => setVehicles([]));
  };
  useEffect(load, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Fleet</h2>
        <p className="text-sm text-muted-foreground">Manage drivers and vehicles.</p>
      </div>
      <Tabs defaultValue="drivers">
        <TabsList>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
        </TabsList>
        <TabsContent value="drivers" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Drivers ({drivers.length})</CardTitle>
              <Button size="sm" onClick={() => setOpenD(true)} className="gap-2"><UserPlus className="h-4 w-4" /> Add driver</Button>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {drivers.map((d) => (
                  <li key={d.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{d.fullName}</div>
                      <div className="text-xs text-muted-foreground">{d.phone ?? "—"} · {d.licenseNumber ?? ""}</div>
                    </div>
                    <Badge variant="outline">{d.status ?? "OFFLINE"}</Badge>
                  </li>
                ))}
                {drivers.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No drivers</li>}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="vehicles" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Vehicles ({vehicles.length})</CardTitle>
              <Button size="sm" onClick={() => setOpenV(true)} className="gap-2"><Car className="h-4 w-4" /> Add vehicle</Button>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {vehicles.map((v) => (
                  <li key={v.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{v.plateNumber}</div>
                      <div className="text-xs text-muted-foreground">{v.type ?? "—"} · {v.capacityKg ? `${v.capacityKg} kg` : ""}</div>
                    </div>
                    <Badge variant={v.active === false ? "secondary" : "outline"}>{v.active === false ? "Inactive" : "Active"}</Badge>
                  </li>
                ))}
                {vehicles.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No vehicles</li>}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DriverDialog open={openD} onOpenChange={setOpenD} onSaved={() => { setOpenD(false); load(); }} />
      <VehicleDialog open={openV} onOpenChange={setOpenV} onSaved={() => { setOpenV(false); load(); }} />
    </div>
  );
}

function DriverDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [f, setF] = useState<Partial<Driver>>({ status: "AVAILABLE" });
  async function save() {
    try {
      if (!f.fullName) return toast.error("Name required");
      await fleetApi.createDriver(f);
      toast.success("Driver added");
      setF({ status: "AVAILABLE" });
      onSaved();
    } catch (e: any) { toast.error(e?.response?.data?.error ?? e?.message); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New driver</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label className="text-xs">Full name *</Label><Input value={f.fullName ?? ""} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Phone</Label><Input value={f.phone ?? ""} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
            <div><Label className="text-xs">License #</Label><Input value={f.licenseNumber ?? ""} onChange={(e) => setF({ ...f, licenseNumber: e.target.value })} /></div>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={f.status} onValueChange={(v: any) => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["OFFLINE", "AVAILABLE", "ON_DELIVERY", "SUSPENDED"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VehicleDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [f, setF] = useState<Partial<Vehicle>>({ type: "VAN", active: true });
  async function save() {
    try {
      if (!f.plateNumber) return toast.error("Plate number required");
      await fleetApi.createVehicle(f);
      toast.success("Vehicle added");
      setF({ type: "VAN", active: true });
      onSaved();
    } catch (e: any) { toast.error(e?.response?.data?.error ?? e?.message); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New vehicle</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label className="text-xs">Plate number *</Label><Input value={f.plateNumber ?? ""} onChange={(e) => setF({ ...f, plateNumber: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={f.type} onValueChange={(v: any) => setF({ ...f, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["CAR", "VAN", "TRUCK", "BIKE"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Capacity (kg)</Label><Input type="number" value={f.capacityKg ?? ""} onChange={(e) => setF({ ...f, capacityKg: Number(e.target.value) })} /></div>
          </div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
