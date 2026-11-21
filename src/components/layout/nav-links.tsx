"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sectionOfPath } from "@/i18n/routes";
import { cn } from "@/lib/utils";

/**
 * `section` marks the item active for every page of that site section; `match` (a path prefix)
 * marks it active for one page and its sub-pages, and wins over the section (e.g. the Digital
 * Solutions page sits under /services but highlights its own link, not "Services").
 */
export type NavItem = { section: string; href: string; label: string; match?: string };

export function useActiveSection() {
  return sectionOfPath(usePathname());
}

/** Key of the active item: a matching `match` prefix first, then the site section. */
export function activeItemKey(items: NavItem[], pathname: string | null): string | null {
  if (!pathname) return null;
  const specific = items.find((item) => item.match && (pathname === item.match || pathname.startsWith(`${item.match}/`)));
  return specific ? specific.section : sectionOfPath(pathname);
}

export function useActiveItem(items: NavItem[]) {
  return activeItemKey(items, usePathname());
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
    <ul className={cn("flex items-center gap-1 xl:gap-3", className)}>
      {items.map((item) => {
        const isActive = active === item.section;
        return (
          <li key={item.section}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "type-caps relative inline-flex h-9 items-center px-2 text-[0.6875rem] font-medium transition-colors",
                isActive ? "text-fg" : "text-fg/70 hover:text-fg",
                isActive && "after:bg-accent after:absolute after:inset-x-3 after:bottom-1.5 after:h-px",
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
  return <NavList items={items} active={useActiveItem(items)} className={className} />;
}
