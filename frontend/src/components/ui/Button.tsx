import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "bg-[var(--color-cyan)] text-[#04211f] hover:bg-[var(--color-cyan)]/90",
  secondary: "bg-[var(--color-bg-3)] text-[var(--color-text-0)] border border-[var(--color-line)] hover:border-[var(--color-text-2)]",
  ghost: "text-[var(--color-text-1)] hover:text-[var(--color-text-0)] hover:bg-[var(--color-bg-3)]",
  danger: "bg-[var(--color-crit-dim)] text-[var(--color-crit)] border border-[var(--color-crit)]/30 hover:bg-[var(--color-crit)]/20",
};
const sizes: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3.5 py-1.5 text-sm",
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-cyan)] focus-visible:outline-offset-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
