import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-ember to-ember-deep text-[#1b0d04] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_14px_rgba(232,115,58,0.2)] hover:-translate-y-[1px] font-semibold",
        ghost:
          "border border-line-2 bg-transparent text-ink-2 hover:bg-bg-2 hover:text-ink-1",
        outline:
          "border border-line-2 bg-bg-1 text-ink-1 hover:bg-bg-2",
        secondary:
          "bg-bg-2 text-ink-1 hover:bg-bg-3 border border-line",
        destructive:
          "bg-danger text-ink-1 hover:brightness-110",
        icon: "w-9 h-9 rounded-[10px] bg-bg-1 border border-line text-ink-2 hover:bg-bg-2 hover:text-ink-1",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
