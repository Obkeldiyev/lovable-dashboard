import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { shopsApi, type Shop } from "@/features/logistics/api";
import { YandexMap, type MapMarker } from "@/components/logistics/YandexMap";
import { Plus, MapPin, Locate, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function ShopsPage() {
  const { t } = useTranslation();
  const [shops, setShops] = useState<Shop[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shop | null>(null);

  const load = () =>
    shopsApi
      .list()
      .then(setShops)
      .catch(() => setShops([]));
  useEffect(() => {
    load();
  }, []);

  const markers: MapMarker[] = shops
    .filter((s) => s.latitude != null && s.longitude != null)
    .map((s) => ({
      id: s.id,
      lat: Number(s.latitude),
      lng: Number(s.longitude),
      label: s.name,
      color: "#10b981",
    }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("shops.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("shops.description")}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> {t("shops.newShop")}
        </Button>
      </div>

      <div className="grid lg:grid-cols-[420px_1fr] gap-4 h-[calc(100vh-12rem)]">
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {t("shops.listCount", { count: shops.length })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-auto">
            <ul className="divide-y">
              {shops.map((s) => (
                <li
                  key={s.id}
                  className="p-4 flex items-start gap-3 hover:bg-accent/40"
                >
                  <MapPin className="h-4 w-4 mt-1 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium truncate">{s.name}</div>
                      {s.code && (
                        <Badge variant="secondary" className="text-xs">
                          {s.code}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {s.address ?? t("shops.noAddress")}
                    </div>
                    {s.latitude == null && (
                      <div className="text-xs text-amber-600 mt-1">
                        {t("shops.noCoordinates")}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(s);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
              {shops.length === 0 && (
                <li className="p-6 text-center text-sm text-muted-foreground">
                  {t("shops.noShopsYet")}
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-0 h-full">
            <YandexMap markers={markers} className="h-full w-full" />
          </CardContent>
        </Card>
      </div>

      <ShopDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSaved={() => {
          setOpen(false);
          load();
        }}
      />
    </div>
  );
}

function ShopDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Shop | null;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Partial<Shop>>({});
  useEffect(() => {
    setForm(initial ?? {});
  }, [initial, open]);

  function pickHere() {
    if (!navigator.geolocation)
      return toast.error(t("shops.toasts.geoNotSupported"));
    navigator.geolocation.getCurrentPosition(
      (p) =>
        setForm((f) => ({
          ...f,
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        })),
      (e) => toast.error(e.message),
      { enableHighAccuracy: true },
    );
  }

  async function save() {
    try {
      if (!form.name) return toast.error(t("shops.toasts.nameRequired"));
      if (initial?.id) await shopsApi.update(initial.id, form);
      else await shopsApi.create(form);
      toast.success(t("shops.toasts.saved"));
      onSaved();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.error ?? e?.message ?? t("shops.toasts.failed"),
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? t("shops.dialog.editTitle") : t("shops.dialog.newTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">{t("shops.dialog.name")}</Label>
              <Input
                value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">{t("shops.dialog.code")}</Label>
              <Input
                value={form.code ?? ""}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t("shops.dialog.phone")}</Label>
              <Input
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">{t("shops.dialog.email")}</Label>
              <Input
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">{t("shops.dialog.address")}</Label>
            <Input
              value={form.address ?? ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <div>
              <Label className="text-xs">{t("shops.dialog.latitude")}</Label>
              <Input
                type="number"
                step="0.0001"
                value={form.latitude ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    latitude:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label className="text-xs">{t("shops.dialog.longitude")}</Label>
              <Input
                type="number"
                step="0.0001"
                value={form.longitude ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    longitude:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={pickHere}
              className="gap-1"
            >
              <Locate className="h-4 w-4" /> {t("shops.dialog.here")}
            </Button>
          </div>
          <div>
            <Label className="text-xs">{t("shops.dialog.notes")}</Label>
            <Textarea
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("shops.dialog.cancel")}
          </Button>
          <Button onClick={save}>{t("shops.dialog.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
