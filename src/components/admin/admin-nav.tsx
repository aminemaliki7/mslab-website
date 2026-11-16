"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { format } from "@/i18n/format";
import { cn } from "@/lib/utils";
import { useAdminT } from "./admin-i18n";

type Counts = { quotations: number; inquiries: number };
type Item = { href: string; label: string; icon: ReactNode; exact?: boolean; badge?: number };

/** Grouped admin menu: customer requests first (daily work), then site content, then settings. */
function useGroups(counts: Counts): Array<{ title: string | null; items: Item[] }> {
  const { t } = useAdminT();
  return [
    { title: null, items: [{ href: "/admin", label: t.nav.dashboard, icon: <HomeIcon />, exact: true }] },
    {
      title: t.nav.groupRequests,
      items: [
        { href: "/admin/quotations", label: t.nav.quotations, icon: <InboxIcon />, badge: counts.quotations },
        { href: "/admin/inquiries", label: t.nav.inquiries, icon: <MailIcon />, badge: counts.inquiries },
      ],
    },
    {
      title: t.nav.groupSite,
      items: [
        { href: "/admin/products", label: t.nav.products, icon: <BoxIcon /> },
        { href: "/admin/categories", label: t.nav.categories, icon: <FolderIcon /> },
        { href: "/admin/services", label: t.nav.services, icon: <ListIcon /> },
        { href: "/admin/print-on-demand", label: t.nav.pod, icon: <BrushIcon /> },
      ],
    },
    { title: t.nav.groupSettings, items: [{ href: "/admin/settings", label: t.nav.settings, icon: <GearIcon /> }] },
  ];
}

export function AdminNav({ counts }: { counts: Counts }) {
  const pathname = usePathname();
  const { t } = useAdminT();
  const groups = useGroups(counts);

  return (
    <nav aria-label={t.common.menu}>
      {groups.map((group, index) => (
        <div key={group.title ?? index} className={index > 0 ? "mt-5" : undefined}>
          {group.title ? <p className="text-fg-subtle mb-1.5 px-3 text-xs font-semibold">{group.title}</p> : null}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 text-[0.9375rem] font-medium transition-colors",
                      active ? "bg-primary text-on-primary" : "text-fg hover:bg-surface-strong",
                    )}
                  >
                    <span className={cn("shrink-0", active ? "text-on-primary" : "text-fg-muted")}>{item.icon}</span>
                    <span className="min-w-0 flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", active ? "bg-white/20" : "bg-accent text-white")}>
                        <span aria-hidden="true">{item.badge}</span>
                        <span className="sr-only">{format(t.nav.newCount, { count: item.badge })}</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Phones and tablets: the menu folds into a "Menu" button under the top bar; closes on navigation. */
export function MobileAdminMenu({ label, children }: { label: string; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <details key={pathname} className="group lg:hidden">
      <summary className="border-line-strong text-fg hover:bg-surface flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-[var(--radius-control)] border px-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <MenuIcon />
        {label}
      </summary>
      <div className="bg-bg border-line absolute inset-x-0 top-full z-30 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b p-4 shadow-[0_12px_24px_-16px_rgb(14_26_43/0.3)]">
        {children}
      </div>
    </details>
  );
}

// ─── Icons (decorative, 20 px, stroke) ───────────────────────────────────────

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
const HomeIcon = () => <Icon><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></Icon>;
const InboxIcon = () => <Icon><path d="M4 13l2-8h12l2 8v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" /><path d="M4 13h5l1 2h4l1-2h5" /></Icon>;
const MailIcon = () => <Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Icon>;
const BoxIcon = () => <Icon><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M4 7.5l8 4.5 8-4.5M12 12v9" /></Icon>;
const FolderIcon = () => <Icon><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Icon>;
const ListIcon = () => <Icon><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></Icon>;
const BrushIcon = () => <Icon><path d="M14 4l6 6-8 8H6v-6z" /><path d="M11 7l6 6" /></Icon>;
const GearIcon = () => <Icon><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></Icon>;
const MenuIcon = () => <Icon><path d="M4 7h16M4 12h16M4 17h16" /></Icon>;
