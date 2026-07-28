/**
 * FetchCombobox — Popover+Command combobox that fetches options from an API.
 *
 * Features:
 * - Lazy fetch on first open
 * - Module-level cache (one request per URL per page load)
 * - Searchable by name + extra keys (e.g. SKU, code)
 * - Respects brand filter (AGENT/MANAGER role restrictions)
 * - Compact prop for use inside items table rows
 *
 * Usage (flat field):
 *   <FetchCombobox
 *     fetchUrl="/api/warehouses"
 *     labelKey="name"
 *     searchKeys={["code"]}
 *     value={warehouseId}
 *     onValueChange={setWarehouseId}
 *     placeholder="Select warehouse…"
 *   />
 */
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api, getBrandFilter } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────

export type FetchComboboxProps = {
  fetchUrl: string;
  value: string;
  onValueChange: (value: string) => void;
  /** Field to display as label. Default: "name" */
  labelKey?: string;
  /** Field used as the stored value (UUID). Default: "id" */
  valueKey?: string;
  /** Extra fields included in search text. E.g. ["sku", "code"] */
  searchKeys?: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Compact mode for use inside items table rows (h-7, text-xs) */
  compact?: boolean;
  /** Skip brand filter even for brand-restricted roles (e.g. warehouse list) */
  noBrandFilter?: boolean;
};

type Option = {
  value: string;
  label: string;
  sublabel?: string;
  searchText: string;
};

// ─── Module-level cache ─────────────────────────────────────────────────────
// One network request per URL per page load.
// Key includes brand filter state so AGENT vs ADMIN see different caches.

const optionCache = new Map<string, Option[]>();

function cacheKey(
  url: string,
  params: Record<string, string | undefined>,
): string {
  const filtered = Object.entries(params).filter(([, v]) => v != null);
  if (filtered.length === 0) return url;
  return `${url}?${filtered.map(([k, v]) => `${k}=${v}`).join("&")}`;
}

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.results)) return d.results;
    if (
      d.data &&
      typeof d.data === "object" &&
      Array.isArray((d.data as any).items)
    ) {
      return (d.data as any).items;
    }
  }
  return [];
}

// ─── Component ──────────────────────────────────────────────────────────────

export function FetchCombobox({
  fetchUrl,
  value,
  onValueChange,
  labelKey = "name",
  valueKey = "id",
  searchKeys = [],
  placeholder = "Select…",
  className,
  disabled,
  compact = false,
  noBrandFilter = false,
}: FetchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  // Build params once per render — brand filter applied unless opted out
  const brandParams = noBrandFilter ? {} : getBrandFilter();
  const key = cacheKey(
    fetchUrl,
    brandParams as Record<string, string | undefined>,
  );

  // Preload from cache whenever the effective URL (key) changes.
  // Also resets `fetched` when switching to an uncached key, otherwise a
  // combobox whose fetchUrl changes at runtime (e.g. dependentfetchselect)
  // would keep showing stale options from its previous URL.
  useEffect(() => {
    const cached = optionCache.get(key);
    if (cached) {
      setOptions(cached);
      setFetched(true);
    } else {
      setOptions([]);
      setFetched(false);
    }
  }, [key]);

  useEffect(() => {
    if (!open || fetched) return;

    setLoading(true);
    setError(null);

    api
      .get(fetchUrl, { params: brandParams })
      .then(({ data }) => {
        const arr = extractArray(data);
        const mapped: Option[] = arr.map((item: any) => {
          const labelVal = String(
            item[labelKey] ?? item.name ?? item.id ?? "—",
          );
          const extraParts = searchKeys
            .filter((k) => k !== labelKey && item[k] != null)
            .map((k) => String(item[k]));
          return {
            value: String(item[valueKey] ?? item.id ?? ""),
            label: labelVal,
            sublabel:
              extraParts.length > 0 ? extraParts.join(" · ") : undefined,
            searchText: [labelVal, ...extraParts].join(" "),
          };
        });
        optionCache.set(key, mapped);
        setOptions(mapped);
        setFetched(true);
      })
      .catch(() => setError("Failed to load options"))
      .finally(() => setLoading(false));
  }, [open, fetched, key]);

  const selected = options.find((o) => o.value === value);
  const triggerH = compact ? "h-7" : "h-9";
  const triggerText = compact ? "text-xs" : "text-sm";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            triggerH,
            triggerText,
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[200px] p-0"
        align="start"
        style={{ zIndex: 9999 }}
      >
        <Command
          filter={(itemValue, search) =>
            itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder="Search…" className="h-9" />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            )}

            {!loading && error && (
              <div className="py-4 text-center text-sm text-destructive">
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={opt.searchText}
                      onSelect={() => {
                        onValueChange(opt.value === value ? "" : opt.value);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value === opt.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="truncate text-xs text-muted-foreground">
                            {opt.sublabel}
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
