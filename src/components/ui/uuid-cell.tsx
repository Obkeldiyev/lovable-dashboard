/**
 * UuidCell — shows first 8 chars of a UUID with:
 * - Hover: reveals a copy icon
 * - Click: copies full UUID to clipboard, shows a checkmark
 * - Tooltip: shows the full UUID
 *
 * Usage in column definition:
 *   { key: "id", label: "ID", render: (v: any) => <UuidCell value={String(v)} /> }
 */
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function UuidCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleCopy}
          className="font-mono text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 group transition-colors"
        >
          <span>{value.slice(0, 8)}</span>
          {copied ? (
            <Check className="h-3 w-3 text-green-500 shrink-0" />
          ) : (
            <Copy className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="font-mono text-xs select-all">
        {value}
      </TooltipContent>
    </Tooltip>
  );
}