import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        stamp:
          "bg-stamp text-white shadow-[0_2px_0_0_var(--color-stamp-deep)] hover:bg-stamp-deep hover:shadow-[0_1px_0_0_var(--color-stamp-deep)] hover:translate-y-px active:translate-y-0.5 active:shadow-none",
        solid:
          "bg-ink text-paper shadow-[0_2px_0_0_#000] hover:translate-y-px active:translate-y-0.5 active:shadow-none",
        outline:
          "border border-line-strong bg-card text-ink hover:border-ink hover:bg-paper-deep",
        ghost: "text-ink-soft hover:text-ink hover:bg-paper-deep",
      },
      size: {
        sm: "h-9 rounded-md px-3 text-sm",
        md: "h-11 rounded-md px-5 text-sm",
        lg: "h-14 rounded-lg px-6 text-base",
      },
    },
    defaultVariants: { variant: "solid", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
