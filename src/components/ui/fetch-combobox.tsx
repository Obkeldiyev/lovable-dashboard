/**
 * FetchCombobox — a Popover+Command combobox that fetches its options from an API.
 *
 * Features:
 * - Lazy fetch on first open
 * - Module-level cache (one network request per URL per page load)
 * - Searchable by name + extra keys (e.g. SKU, code)
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
 *
 * Usage (in items row, compact):
 *   <FetchCombobox
 *     fetchUrl="/api/products"
 *     labelKey="name"
 *     searchKeys={["sku"]}
 *     value={row.productId}
 *     onValueChange={(v) => setRowVal("productId", v)}
 *     placeholder="Product…"
 *     compact
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
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FetchComboboxProps = {
  fetchUrl: string;
  value: string;
  onValueChange: (value: string) => void;
  /** Which field on each item to show as the primary label. Default: "name" */
  labelKey?: string;
  /** Which field on each item to use as the selected value (UUID). Default: "id" */
  valueKey?: string;
  /** Additional fields to include in search text. E.g. ["sku", "code"] */
  searchKeys?: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Compact mode for use inside items table rows (h-7, text-xs) */
  compact?: boolean;
};

type Option = {
  value: string;
  label: string;
  /** Secondary search text shown below the label */
  sublabel?: string;
  /** Combined search text for cmdk filtering */
  searchText: string;
};

// ─── Module-level cache ───────────────────────────────────────────────────────
// Prevents re-fetching the same endpoint when multiple rows are rendered
// (e.g. 5 product rows in an Order form all sharing /api/products)

const optionCache = new Map<string, Option[]>();

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

// ─── Component ────────────────────────────────────────────────────────────────

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
}: FetchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Option[]>(() => optionCache.get(fetchUrl) ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(() => optionCache.has(fetchUrl));

  useEffect(() => {
    if (!open || fetched) return;

    setLoading(true);
    setError(null);

    api
      .get(fetchUrl)
      .then(({ data }) => {
        const arr = extractArray(data);
        const mapped: Option[] = arr.map((item: any) => {
          const labelVal = String(item[labelKey] ?? item.name ?? item.id ?? "—");
          const extraParts = searchKeys
            .filter((k) => k !== labelKey && item[k] != null)
            .map((k) => String(item[k]));
          return {
            value: String(item[valueKey] ?? item.id ?? ""),
            label: labelVal,
            sublabel: extraParts.length > 0 ? extraParts.join(" · ") : undefined,
            // cmdk searches this string
            searchText: [labelVal, ...extraParts].join(" "),
          };
        });
        optionCache.set(fetchUrl, mapped);
        setOptions(mapped);
        setFetched(true);
      })
      .catch(() => setError("Failed to load options"))
      .finally(() => setLoading(false));
  }, [open, fetched, fetchUrl]);

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
        // Keep popover above dialog stacking context
        style={{ zIndex: 9999 }}
      >
        <Command
          // Tell cmdk to filter by our searchText, not the displayed value
          filter={(value, search) =>
            value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
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
              <div className="py-4 text-center text-sm text-destructive">{error}</div>
            )}

            {!loading && !error && (
              <>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      // cmdk uses this to filter
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