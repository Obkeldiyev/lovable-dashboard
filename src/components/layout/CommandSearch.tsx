import { useEffect, useState, useCallback, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next"; // 1. Import qo'shildi
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Boxes, Package, ShoppingCart, Truck } from "lucide-react";
import { api } from "@/lib/api";

type ResultItem = {
  id: string;
  label: string;
  sublabel?: string;
};

type EntityConfig = {
  key: string;
  groupKey: string; // groupLabel o'rniga groupKey
  icon: ComponentType<{ className?: string }>;
  fetchUrl: string;
  path: string;
  toResult: (item: any) => ResultItem;
};

const ENTITIES: EntityConfig[] = [
  {
    key: "warehouses",
    groupKey: "commandSearch.groups.warehouses",
    icon: Boxes,
    fetchUrl: "/api/warehouses",
    path: "/warehouses",
    toResult: (item) => ({
      id: String(item.id),
      label: String(item.name ?? item.id),
      sublabel: item.code ?? undefined,
    }),
  },
  {
    key: "products",
    groupKey: "commandSearch.groups.products",
    icon: Package,
    fetchUrl: "/api/products",
    path: "/products",
    toResult: (item) => ({
      id: String(item.id),
      label: String(item.name ?? item.id),
      sublabel: item.sku ?? undefined,
    }),
  },
  {
    key: "orders",
    groupKey: "commandSearch.groups.orders",
    icon: ShoppingCart,
    fetchUrl: "/api/orders",
    path: "/orders",
    toResult: (item) => ({
      id: String(item.id),
      label: `#${String(item.id).slice(0, 8)}`,
      sublabel: item.status ?? undefined,
    }),
  },
  {
    key: "suppliers",
    groupKey: "commandSearch.groups.suppliers",
    icon: Truck,
    fetchUrl: "/api/suppliers",
    path: "/suppliers",
    toResult: (item) => ({
      id: String(item.id),
      label: String(item.name ?? item.id),
      sublabel: item.email ?? undefined,
    }),
  },
];

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.results)) return d.results;
    if (d.data && typeof d.data === "object" && Array.isArray((d.data as any).items)) {
      return (d.data as any).items;
    }
  }
  return [];
}

const resultsCache = new Map<string, ResultItem[]>();

export function CommandSearch({
  open: openProp,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
} = {}) {
  const { t } = useTranslation(); // 2. Hook chaqirildi
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [loading, setLoading] = useState(false);
  const [resultsByEntity, setResultsByEntity] = useState<Record<string, ResultItem[]>>({});
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  const loadAll = useCallback(async () => {
    const missing = ENTITIES.filter((e) => !resultsCache.has(e.key));
    if (missing.length === 0) {
      setResultsByEntity(Object.fromEntries(ENTITIES.map((e) => [e.key, resultsCache.get(e.key) ?? []])));
      return;
    }

    setLoading(true);
    await Promise.all(
      missing.map(async (entity) => {
        try {
          const { data } = await api.get(entity.fetchUrl);
          const arr = extractArray(data);
          resultsCache.set(entity.key, arr.map((item) => entity.toResult(item)));
        } catch {
          resultsCache.set(entity.key, []);
        }
      }),
    );
    setResultsByEntity(Object.fromEntries(ENTITIES.map((e) => [e.key, resultsCache.get(e.key) ?? []])));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) loadAll();
  }, [open, loadAll]);

  function handleSelect(entity: EntityConfig, item: ResultItem) {
    setOpen(false);
    navigate(entity.path, { state: { focusId: item.id } });
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      {/* 3. Dinamik matnlar joylashtirildi */}
      <CommandInput placeholder={t("commandSearch.placeholder")} />
      <CommandList>
        {loading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t("commandSearch.loading")}
          </div>
        )}
        {!loading && <CommandEmpty>{t("commandSearch.noResults")}</CommandEmpty>}
        {!loading &&
          ENTITIES.map((entity) => {
            const results = resultsByEntity[entity.key] ?? [];
            if (results.length === 0) return null;
            const Icon = entity.icon;
            return (
              <CommandGroup key={entity.key} heading={t(entity.groupKey)}>
                {results.slice(0, 8).map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${entity.key} ${item.label} ${item.sublabel ?? ""}`}
                    onSelect={() => handleSelect(entity, item)}
                    className="cursor-pointer gap-2"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.sublabel && (
                      <span className="ml-auto text-xs text-muted-foreground truncate">
                        {item.sublabel}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
      </CommandList>
    </CommandDialog>
  );
}