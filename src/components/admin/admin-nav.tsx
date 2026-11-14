"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Tableau de bord", exact: true },
  { href: "/admin/quotations", label: "Demandes de devis" },
  { href: "/admin/inquiries", label: "Messages" },
  { href: "/admin/products", label: "Produits" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/settings", label: "Paramètres" },
];

export function AdminNav({ counts }: { counts: { quotations: number; inquiries: number } }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Administration">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const badge =
            item.href === "/admin/quotations" ? counts.quotations : item.href === "/admin/inquiries" ? counts.inquiries : 0;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  active ? "bg-primary text-on-primary" : "text-fg-muted hover:bg-surface-strong hover:text-fg",
                )}
              >
                {item.label}
                {badge > 0 ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs",
                      active ? "bg-white/20" : "bg-accent text-white",
                    )}
                    aria-label={`${badge} nouveau(x)`}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
