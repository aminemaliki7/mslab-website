"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sectionOfPath } from "@/i18n/routes";
import { cn } from "@/lib/utils";

export type NavItem = { section: string; href: string; label: string };

export function useActiveSection() {
  return sectionOfPath(usePathname());
}

/** Pure list (no hooks) — also used as the <Suspense> fallback. */
export function NavList({
  items,
  active,
  className,
}: {
  items: NavItem[];
  active: string | null;
  className?: string;
}) {
  return (
    <ul className={cn("flex items-center gap-1", className)}>
      {items.map((item) => {
        const isActive = active === item.section;
        return (
          <li key={item.section}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative inline-flex h-10 items-center rounded-[var(--radius-control)] px-3 text-[0.9375rem] font-medium transition-colors",
                isActive ? "text-fg" : "text-fg-muted hover:text-fg",
                isActive &&
                  "after:bg-accent after:absolute after:inset-x-3 after:-bottom-[0.6875rem] after:h-0.5",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Desktop navigation links with aria-current on the active section. */
export function NavLinks({ items, className }: { items: NavItem[]; className?: string }) {
  return <NavList items={items} active={useActiveSection()} className={className} />;
}
