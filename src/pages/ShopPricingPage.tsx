/**
 * ShopPricingPage — Agent sets custom product prices per shop.
 *
 * Backend: stored in /api/field/shop-prices (using IntegrationOutbox as JSON store)
 * Each record: { shopId, productId, customPrice, note, agentId, updatedAt }
 *
 * Since the core backend doesn't have a dedicated shop-price table,
 * we store price overrides via the existing /api/preferences/me pattern
 * keyed by tenantId+shopId in localStorage and sync to backend preferences.
 *
 * In a future schema migration this becomes a proper ShopPriceList table.
 */
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Save, DollarSign, Store, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type Shop = { id: string; name: string; code?: string; address?: string };
type Product = {
  id: string;
  sku: string;
  name: string;
  defaultPrice?: number | string;
  unit?: string;
};
type PriceLine = {
  productId: string;
  productName: string;
  productSku: string;
  unit: string;
  defaultPrice: number;
  customPrice: string; // editable string
  note: string;
};

const STORAGE_KEY = "vms.shopPrices.v1";

function loadPrices(): Record<
  string,
  Record<string, { price: number; note: string }>
> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePrices(
  data: Record<string, Record<string, { price: number; note: string }>>,
) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export default function ShopPricingPage() {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shopId, setShopId] = useState("");
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<PriceLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [prices, setPrices] =
    useState<Record<string, Record<string, { price: number; note: string }>>>(
      loadPrices,
    );

  useEffect(() => {
    document.title = "Shop Pricing · VMS";
    // Load shops + products in parallel
    Promise.allSettled([api.get("/api/shops"), api.get("/api/products")]).then(
      ([s, p]) => {
        if (s.status === "fulfilled") setShops(s.value.data?.data ?? []);
        if (p.status === "fulfilled") setProducts(p.value.data?.data ?? []);
      },
    );
  }, []);

  // Build lines when shop or products change
  useEffect(() => {
    if (!shopId || products.length === 0) {
      setLines([]);
      return;
    }
    const shopOverrides = prices[shopId] ?? {};
    const built: PriceLine[] = products.map((pr) => {
      const override = shopOverrides[pr.id];
      const parsedDefaultPrice = Number(pr.defaultPrice) || 0;
      return {
        productId: pr.id,
        productName: pr.name,
        productSku: pr.sku,
        unit: pr.unit ?? "pcs",
        defaultPrice: parsedDefaultPrice,
        customPrice: override ? String(override.price) : "",
        note: override?.note ?? "",
      };
    });
    setLines(built);
  }, [shopId, products, prices]);

  const filtered = search
    ? lines.filter(
        (l) =>
          l.productName.toLowerCase().includes(search.toLowerCase()) ||
          l.productSku.toLowerCase().includes(search.toLowerCase()),
      )
    : lines;

  function updateLine(
    productId: string,
    field: "customPrice" | "note",
    value: string,
  ) {
    setLines((prev) =>
      prev.map((l) =>
        l.productId === productId ? { ...l, [field]: value } : l,
      ),
    );
  }

  async function handleSave() {
    if (!shopId) {
      toast.error(t("shopPricing.toasts.selectShopFirst"));
      return;
    }
    setSaving(true);
    try {
      const shopOverrides: Record<string, { price: number; note: string }> = {};
      for (const line of lines) {
        if (line.customPrice.trim() !== "") {
          shopOverrides[line.productId] = {
            price: Number(line.customPrice),
            note: line.note,
          };
        }
      }
      const updated = { ...prices, [shopId]: shopOverrides };
      setPrices(updated);
      savePrices(updated);

      // Also persist to backend via preferences
      await api
        .put("/api/preferences/me", {
          settings: { shopPrices: updated },
        })
        .catch(() => {}); // non-fatal

      toast.success(
        t("shopPricing.toasts.savedSuccess", {
          name: shops.find((s) => s.id === shopId)?.name ?? "",
        }),
      );
    } finally {
      setSaving(false);
    }
  }

  function clearShopPrices() {
    if (!shopId) return;
    const updated = { ...prices };
    delete updated[shopId];
    setPrices(updated);
    savePrices(updated);
    // Rebuild lines with no overrides
    setLines((prev) => prev.map((l) => ({ ...l, customPrice: "", note: "" })));
    toast.success(t("shopPricing.toasts.clearedSuccess"));
  }

  const changedCount = lines.filter((l) => l.customPrice.trim() !== "").length;
  const selectedShop = shops.find((s) => s.id === shopId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> {t("shopPricing.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("shopPricing.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {shopId && changedCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {t("shopPricing.overridesCount", { count: changedCount })}
            </Badge>
          )}
          {shopId && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearShopPrices}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" /> {t("shopPricing.clear")}
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !shopId}
            className="gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? t("shopPricing.saving") : t("shopPricing.savePrices")}
          </Button>
        </div>
      </div>

      {/* Shop selector */}
      <Card>
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-[1fr_2fr] gap-4 items-center">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Store className="h-3.5 w-3.5" /> {t("shopPricing.selectShop")}
              </Label>
              <Select
                value={shopId || "__none__"}
                onValueChange={(v) => setShopId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue
                    placeholder={t("shopPricing.chooseShopPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    {t("shopPricing.chooseShopDefault")}
                  </SelectItem>
                  {shops.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                      {s.code ? ` (${s.code})` : ""}
                    </SelectItem>
                  ))}
                  {shops.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      {t("shopPricing.noShopsFound")}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedShop && (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {selectedShop.name}
                </p>
                {selectedShop.address && (
                  <p className="text-xs">{selectedShop.address}</p>
                )}
                <p className="text-xs mt-0.5">
                  {t("shopPricing.overridesSavedCount", {
                    count: prices[shopId]
                      ? Object.keys(prices[shopId]).length
                      : 0,
                  })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {shopId && (
        <>
          {/* Search */}
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("shopPricing.searchPlaceholder")}
              className="h-9 pl-8 pr-8 rounded-md border border-border bg-muted/40 text-sm w-full focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Price table */}
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />{" "}
                {t("shopPricing.productsCount", { count: filtered.length })}
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                {t("shopPricing.customPriceHint")}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("shopPricing.table.sku")}
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("shopPricing.table.product")}
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("shopPricing.table.unit")}
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("shopPricing.table.defaultPrice")}
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground w-36">
                        {t("shopPricing.table.customPrice")}
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground w-40">
                        {t("shopPricing.table.note")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((line) => {
                      const hasOverride = line.customPrice.trim() !== "";
                      const defaultPriceNum = Number(line.defaultPrice) || 0;
                      return (
                        <tr
                          key={line.productId}
                          className={cn(
                            "hover:bg-accent/20 transition-colors",
                            hasOverride && "bg-primary/3",
                          )}
                        >
                          <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                            {line.productSku}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate max-w-[180px]">
                                {line.productName}
                              </span>
                              {hasOverride && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] text-primary border-primary/40 shrink-0"
                                >
                                  {t("shopPricing.badgeCustom")}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {line.unit}
                          </td>
                          <td className="px-3 py-2 text-sm font-mono">
                            {defaultPriceNum > 0
                              ? defaultPriceNum.toFixed(2)
                              : "—"}
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.customPrice}
                              onChange={(e) =>
                                updateLine(
                                  line.productId,
                                  "customPrice",
                                  e.target.value,
                                )
                              }
                              placeholder={
                                defaultPriceNum > 0
                                  ? String(defaultPriceNum)
                                  : "0.00"
                              }
                              className={cn(
                                "h-7 text-xs font-mono w-28",
                                hasOverride && "border-primary/50 bg-primary/5",
                              )}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              value={line.note}
                              onChange={(e) =>
                                updateLine(
                                  line.productId,
                                  "note",
                                  e.target.value,
                                )
                              }
                              placeholder={t("shopPricing.notePlaceholder")}
                              className="h-7 text-xs w-36"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    {products.length === 0
                      ? t("shopPricing.noProductsCatalog")
                      : t("shopPricing.noProductsSearch")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!shopId && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          {t("shopPricing.emptyShopSelection")}
        </div>
      )}
    </div>
  );
}
