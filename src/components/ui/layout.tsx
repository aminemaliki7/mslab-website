import type { ComponentProps, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Centered page container: 1200px max, 16/24/32px gutters (never less than the notch safe area in landscape). */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[75rem] ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))] sm:ps-[max(1.5rem,env(safe-area-inset-left))] sm:pe-[max(1.5rem,env(safe-area-inset-right))] lg:ps-8 lg:pe-8", className)} {...props} />;
}

type SectionProps = ComponentProps<"section"> & { tone?: "default" | "surface" };

/** Vertical rhythm: 48px phones, 64px tablets, 96px desktop. `surface` = paper background. */
export function Section({ tone = "default", className, ...props }: SectionProps) {
  return (
    <section
      className={cn("py-12 sm:py-16 lg:py-24", tone === "surface" && "bg-surface", className)}
      {...props}
    />
  );
}

type HeadingProps = {
  as?: "h1" | "h2" | "h3" | "h4";
  size?: "display" | "xl" | "lg" | "md" | "sm";
  className?: string;
  id?: string;
  children: ReactNode;
};

const headingSizes = {
  // Display type (Archivo expanded, globals.css .type-display); sizes are fluid between phone and desktop.
  display: "type-display text-[clamp(2rem,6.5vw,3.75rem)] leading-[1.02]",
  xl: "type-display text-[clamp(1.75rem,4.6vw,2.5rem)] leading-[1.08]",
  lg: "type-display text-[clamp(1.375rem,3.4vw,1.875rem)] leading-[1.12]",
  md: "text-xl sm:text-2xl font-semibold leading-snug",
  sm: "text-lg font-semibold leading-snug",
} as const;

export function Heading({ as: Tag = "h2", size = "lg", className, ...props }: HeadingProps) {
  return <Tag className={cn("text-fg text-balance", headingSizes[size], className)} {...props} />;
}

/** Small accent label above a heading (sentence case). */
export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-accent text-sm font-semibold",
        className,
      )}
      {...props}
    />
  );
}

export function Lead({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-fg-muted text-lg leading-relaxed text-pretty", className)} {...props} />;
}

type CardProps<T extends ElementType> = { as?: T; className?: string; children: ReactNode };

export function Card<T extends ElementType = "div">({ as, className, children }: CardProps<T>) {
  const Tag = as ?? "div";
  return (
    <Tag className={cn("bg-bg border-line rounded-[var(--radius-card)] border", className)}>{children}</Tag>
  );
}

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-surface-strong text-fg",
  accent: "bg-accent-soft text-accent-hover",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeTones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("bg-surface-strong animate-pulse rounded-[var(--radius-control)]", className)}
      {...props}
    />
  );
}
