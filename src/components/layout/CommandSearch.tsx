/**
 * CommandSearch — global Cmd+K / Ctrl+K command palette.
 *
 * Searches across warehouses, products, orders, and suppliers and
 * navigates to the matching entity's page on selection.
 *
 * Usage: mount once, near the root of the authenticated layout
 * (e.g. inside AppHeader). It listens for Cmd+K / Ctrl+K globally.
 */
import { useEffect, useState, useCallback, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
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

// ─── Entity config ───────────────────────────────────────────────────────────

type ResultItem = {
  id: string;
  label: string;
  sublabel?: string;
};

type EntityConfig = {
  key: string;
  groupLabel: string;
  icon: ComponentType<{ className?: string }>;
  fetchUrl: string;
  path: string;
  toResult: (item: any) => ResultItem;
};

const ENTITIES: EntityConfig[] = [
  {
    key: "warehouses",
    groupLabel: "Warehouses",
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
    groupLabel: "Products",
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
    groupLabel: "Orders",
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
    groupLabel: "Suppliers",
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

// Module-level cache — one request per entity per page load, shared by
// every CommandSearch instance (there should only ever be one mounted).
const resultsCache = new Map<string, ResultItem[]>();

// ─── Component ────────────────────────────────────────────────────────────────

export function CommandSearch({
  open: openProp,
  onOpenChange,
}: {
  /** Pass to control the dialog externally (e.g. clicking the header search box) */
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
} = {}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [loading, setLoading] = useState(false);
  const [resultsByEntity, setResultsByEntity] = useState<Record<string, ResultItem[]>>({});
  const navigate = useNavigate();

  // Cmd+K / Ctrl+K toggles the palette from anywhere in the app.
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
      <CommandInput placeholder="Search warehouses, products, orders, suppliers…" />
      <CommandList>
        {loading && (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
        )}
        {!loading && <CommandEmpty>No results found.</CommandEmpty>}
        {!loading &&
          ENTITIES.map((entity) => {
            const results = resultsByEntity[entity.key] ?? [];
            if (results.length === 0) return null;
            const Icon = entity.icon;
            return (
              <CommandGroup key={entity.key} heading={entity.groupLabel}>
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
