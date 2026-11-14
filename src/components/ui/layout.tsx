import type { ComponentProps, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Centered page container: 1200px max, 16/24/32px gutters. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[75rem] px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

type SectionProps = ComponentProps<"section"> & { tone?: "default" | "surface" };

/** Vertical rhythm: 64px mobile, 96px desktop. `surface` = paper background. */
export function Section({ tone = "default", className, ...props }: SectionProps) {
  return (
    <section
      className={cn("py-16 lg:py-24", tone === "surface" && "bg-surface", className)}
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
  display: "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.08]",
  xl: "text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.15]",
  lg: "text-2xl sm:text-3xl font-semibold tracking-tight leading-snug",
  md: "text-xl sm:text-2xl font-semibold leading-snug",
  sm: "text-lg font-semibold leading-snug",
} as const;

export function Heading({ as: Tag = "h2", size = "lg", className, ...props }: HeadingProps) {
  return <Tag className={cn("text-fg text-balance", headingSizes[size], className)} {...props} />;
}

/** Small uppercase label above headings (letter-spacing removed for Arabic). */
export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-accent text-xs font-medium tracking-[0.08em] uppercase rtl:tracking-normal rtl:text-sm",
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
