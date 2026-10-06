import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Tátil (8.1): hover sobe 1 px e ganha sombra; pressionado afunda. Foco: anel Floresta de 3 px (6). Bloqueado: prefira aria-disabled (10).
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,border-color,color,box-shadow,translate,scale,opacity] duration-[260ms] ease-spring hover:-translate-y-px hover:shadow-[0_8px_16px_-8px_rgb(24_26_25/0.4)] active:translate-y-0 active:scale-[0.96] active:shadow-none focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30 aria-disabled:opacity-45 aria-disabled:hover:translate-y-0 aria-disabled:hover:shadow-none aria-disabled:active:scale-100 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
        outline:
          "border border-input bg-card hover:bg-accent hover:text-accent-foreground",
        // contorno Floresta: a ação secundária (DESIGN.md 8.1)
        secondary:
          "border border-primary bg-transparent text-primary hover:bg-secondary active:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground hover:translate-y-0 hover:shadow-none active:scale-100",
        link: "text-primary underline-offset-4 hover:underline hover:translate-y-0 hover:shadow-none active:scale-100",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
