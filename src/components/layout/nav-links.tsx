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
    <ul className={cn("flex items-center gap-2 xl:gap-5", className)}>
      {items.map((item) => {
        const isActive = active === item.section;
        return (
          <li key={item.section}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "type-caps relative inline-flex h-10 items-center px-3 text-xs font-medium transition-colors",
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
  return <NavList items={items} active={useActiveSection()} className={className} />;
}
