"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { format } from "@/i18n/format";
import { cn } from "@/lib/utils";
import { useAdminT } from "./admin-i18n";
import { useBusinessT } from "./business/use-business-t";

type Counts = { quotations: number; inquiries: number };
type Item = { href: string; label: string; icon: ReactNode; exact?: boolean; badge?: number; permission?: string | string[]; also?: string[] };

/**
 * Grouped admin menu: daily business operations first, then customer requests, then site
 * content and settings. Entries are filtered by the member's permissions (convenience only:
 * every page and action re-checks, and RLS is the real boundary).
 */
function useGroups(counts: Counts, permissions: ReadonlySet<string>): Array<{ title: string | null; items: Item[] }> {
  const { t } = useAdminT();
  const { b } = useBusinessT();
  const groups: Array<{ title: string | null; items: Item[] }> = [
    { title: null, items: [{ href: "/admin", label: t.nav.dashboard, icon: <HomeIcon />, exact: true }] },
    {
      title: b.nav.group,
      items: [
        { href: "/admin/business", label: b.nav.overview, icon: <ChartIcon />, exact: true, permission: "business.read" },
        { href: "/admin/business/journal", label: b.nav.journal, icon: <JournalIcon />, permission: "business.read" },
        { href: "/admin/business/sales", label: b.nav.sales, icon: <ReceiptIcon />, permission: "business.read" },
        { href: "/admin/business/customers", label: b.nav.customers, icon: <UsersIcon />, permission: "business.read" },
        { href: "/admin/business/products", label: b.nav.products, icon: <BoxIcon />, permission: "business.read" },
        { href: "/admin/business/stock", label: b.nav.stock, icon: <SwapIcon />, permission: "business.read" },
        { href: "/admin/business/expenses", label: b.nav.expenses, icon: <WalletIcon />, permission: "business.read" },
        { href: "/admin/business/tasks", label: b.nav.tasks, icon: <CheckIcon />, permission: "business.read" },
        { href: "/admin/business/closing", label: b.nav.closing, icon: <LockIcon />, permission: "business.read", also: ["/admin/business/reports"] },
        { href: "/admin/business/analytics", label: b.nav.analytics, icon: <TrendIcon />, permission: "business.read" },
        { href: "/admin/business/settings", label: b.nav.settings, icon: <TagIcon />, permission: "business.read" },
        { href: "/admin/business/team", label: b.nav.team, icon: <ShieldIcon />, permission: "staff.read" },
      ],
    },
    {
      title: t.nav.groupRequests,
      items: [
        { href: "/admin/quotations", label: t.nav.quotations, icon: <InboxIcon />, badge: counts.quotations, permission: ["requests.read", "requests.read.custom", "requests.read.digital"] },
        { href: "/admin/inquiries", label: t.nav.inquiries, icon: <MailIcon />, badge: counts.inquiries, permission: "messages.read" },
      ],
    },
    {
      title: t.nav.groupSite,
      items: [
        { href: "/admin/products", label: t.nav.products, icon: <BoxIcon />, permission: "site.content.manage" },
        { href: "/admin/categories", label: t.nav.categories, icon: <FolderIcon />, permission: "site.content.manage" },
        { href: "/admin/services", label: t.nav.services, icon: <ListIcon />, permission: "site.content.manage" },
        { href: "/admin/print-on-demand", label: t.nav.pod, icon: <BrushIcon />, permission: "site.content.manage" },
      ],
    },
    { title: t.nav.groupSettings, items: [{ href: "/admin/settings", label: t.nav.settings, icon: <GearIcon />, permission: "site.content.manage" }] },
  ];
  const allowed = (item: Item) =>
    !item.permission || (Array.isArray(item.permission) ? item.permission : [item.permission]).some((p) => permissions.has(p));
  return groups.map((g) => ({ ...g, items: g.items.filter(allowed) })).filter((g) => g.items.length > 0);
}

export function AdminNav({ counts, permissions }: { counts: Counts; permissions: string[] }) {
  const pathname = usePathname();
  const { t } = useAdminT();
  const groups = useGroups(counts, new Set(permissions));

  return (
    <nav aria-label={t.common.menu}>
      {groups.map((group, index) => (
        <div key={group.title ?? index} className={index > 0 ? "mt-5" : undefined}>
          {group.title ? <p className="text-fg-subtle mb-1.5 px-3 text-xs font-semibold">{group.title}</p> : null}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.exact ? pathname === item.href : [item.href, ...(item.also ?? [])].some((h) => pathname.startsWith(h));
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
const TrendIcon = () => <Icon><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></Icon>;
const ChartIcon = () => <Icon><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Icon>;
const CheckIcon = () => <Icon><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 12l3 3 5-6" /></Icon>;
const LockIcon = () => <Icon><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Icon>;
const JournalIcon = () => <Icon><path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M8 8h6M8 12h6M8 16h4" /></Icon>;
const ReceiptIcon = () => <Icon><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></Icon>;
const UsersIcon = () => <Icon><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></Icon>;
const SwapIcon = () => <Icon><path d="M7 4v14M3 14l4 4 4-4" /><path d="M17 20V6M13 10l4-4 4 4" /></Icon>;
const WalletIcon = () => <Icon><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M16 13h2M3 10h18" /></Icon>;
const TagIcon = () => <Icon><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.2" /></Icon>;
const ShieldIcon = () => <Icon><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" /><path d="M9 12l2 2 4-4" /></Icon>;
const MenuIcon = () => <Icon><path d="M4 7h16M4 12h16M4 17h16" /></Icon>;
