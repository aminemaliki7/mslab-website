import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** `inverse*` variants are for dark (ink) backgrounds such as the CTA band and footer. */
type Variant = "primary" | "secondary" | "accent" | "ghost" | "inverse" | "inverseGhost";
type Size = "sm" | "md" | "lg";

const base =
  // Full pills, small capitals (docs/DESIGN_SYSTEM.md §0).
  "type-caps inline-flex items-center justify-center gap-2 rounded-full text-center sm:whitespace-nowrap " +
  "transition-[color,background-color,border-color,transform] duration-150 ease-[var(--ease-out-soft)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  /** Deep Teal: the one action that matters on the screen (white text 5.8:1). */
  primary: "bg-primary text-on-primary font-semibold hover:bg-primary-hover",
  secondary: "border border-fg text-fg font-medium hover:bg-surface",
  /** On dark (navy) bands: a white pill with navy text. */
  accent: "bg-white text-fg font-semibold hover:bg-paper-50",
  ghost: "text-fg font-medium hover:bg-surface",
  inverse: "border border-white/40 text-white font-medium hover:bg-white/10",
  inverseGhost: "text-white font-medium hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  // Touch screens: 44 px even for the small size (WCAG 2.5.5 target).
  sm: "min-h-9 px-4 py-1 text-xs pointer-coarse:min-h-11",
  md: "min-h-11 px-6 py-2 text-[0.8125rem]",
  lg: "min-h-13 px-8 py-3 text-sm",
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
