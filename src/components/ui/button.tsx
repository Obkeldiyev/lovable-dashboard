import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles
  [
    "inline-flex shrink-0 select-none items-center justify-center gap-1.5",
    "whitespace-nowrap rounded-md border border-transparent bg-clip-padding",
    "text-sm font-medium outline-none",
    "transition-all duration-150",
    "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
    "active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // Solid filled
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/95",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        success:
          "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600",
        warning:
          "bg-amber-500 text-white shadow-sm hover:bg-amber-600",
        info:
          "bg-sky-500 text-white shadow-sm hover:bg-sky-600",

        // Outlined / soft
        outline:
          "border-border bg-background shadow-sm hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        "outline-primary":
          "border-primary/60 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary",
        "outline-destructive":
          "border-destructive/50 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:border-destructive",
        "outline-success":
          "border-emerald-500/50 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400",

        // Ghost / subtle
        ghost:
          "hover:bg-muted hover:text-foreground dark:hover:bg-muted/60",
        "ghost-primary":
          "text-primary hover:bg-primary/10",
        "ghost-destructive":
          "text-destructive hover:bg-destructive/10",

        // Link
        link:
          "text-primary underline-offset-4 hover:underline",
      },

      size: {
        xs:        "h-6 rounded px-2 text-xs [&_svg]:size-3",
        sm:        "h-7 rounded px-2.5 text-xs [&_svg]:size-3.5",
        default:   "h-9 px-3 [&_svg]:size-4",
        lg:        "h-10 px-4 text-base [&_svg]:size-4",
        xl:        "h-11 px-5 text-base [&_svg]:size-5",

        // Square icon buttons — properly sized so the icon fills naturally
        icon:      "h-9 w-9 [&_svg]:size-4",
        "icon-xs": "h-6 w-6 rounded [&_svg]:size-3",
        "icon-sm": "h-7 w-7 [&_svg]:size-3.5",
        "icon-lg": "h-10 w-10 [&_svg]:size-5",
      },

      shape: {
        default: "",
        pill:    "rounded-full",
        square:  "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, shape, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
