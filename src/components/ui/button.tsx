import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** `inverse*` variants are for dark (ink) backgrounds such as the CTA band and footer. */
type Variant = "primary" | "secondary" | "accent" | "ghost" | "inverse" | "inverseGhost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] text-center font-medium sm:whitespace-nowrap " +
  "transition-[color,background-color,border-color,transform] duration-150 ease-[var(--ease-out-soft)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "border border-primary text-primary hover:bg-surface",
  accent: "bg-accent text-white hover:bg-accent-hover",
  ghost: "text-fg hover:bg-surface",
  inverse: "border border-white/40 text-white hover:bg-white/10",
  inverseGhost: "text-white hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3 py-1 text-sm",
  md: "min-h-11 px-5 py-2 text-[0.9375rem]",
  lg: "min-h-12 px-6 py-2.5 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
