import Link from "next/link";
import type { ReactNode } from "react";
import { AdminPageHeader, Notice, Panel, StatusBadge, Tile } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { formatAdminDateTime, type AdminLang } from "@/features/admin/dictionary";
import { inquiryStatuses, quotationStatuses, type StatusLabel } from "@/features/admin/labels";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { format } from "@/i18n/format";
import { createSessionClient } from "@/lib/supabase/server";

export const generateMetadata = adminTitle((t) => t.dashboard.title);

/**
 * Dashboard, in the order the team works: what needs handling now (new requests and
 * messages), quick actions for the common tasks, then the site at a glance and recent activity.
 */
export default async function DashboardPage() {
  const [admin, { lang, t }] = await Promise.all([requireAdmin(), getAdminT()]);
  const d = t.dashboard;
  const db = await createSessionClient();
  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);

  const [newQuotations, newInquiries, publishedProducts, draftProducts, categories, publishedServices, quotations, inquiries, unsent] = await Promise.all([
    count(db.from("quotation_requests").select("id", { count: "exact", head: true }).eq("status", "new")),
    count(db.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new")),
    count(db.from("products").select("id", { count: "exact", head: true }).eq("status", "published")),
    count(db.from("products").select("id", { count: "exact", head: true }).eq("status", "draft")),
    count(db.from("categories").select("id", { count: "exact", head: true })),
    count(db.from("services").select("id", { count: "exact", head: true }).eq("status", "published")),
    db.from("quotation_requests").select("id, reference, full_name, company_name, status, created_at").order("created_at", { ascending: false }).limit(5),
    db.from("inquiries").select("id, reference, full_name, subject, status, created_at").order("created_at", { ascending: false }).limit(5),
    count(db.from("quotation_requests").select("id", { count: "exact", head: true }).is("notified_at", null).not("notification_error", "is", null)),
  ]);

  const qStatus = quotationStatuses(t);
  const iStatus = inquiryStatuses(t);
  const firstName = (admin.profile.full_name ?? "").trim().split(/\s+/)[0];

  return (
    <>
      <AdminPageHeader title={firstName ? format(d.hello, { name: firstName }) : d.title} description={d.intro} />

      {unsent > 0 ? <Notice tone="warning">{format(d.unsent, { count: unsent })}</Notice> : null}

      {/* 1. To handle */}
      <section aria-labelledby="todo-heading">
        <h2 id="todo-heading" className="text-fg mb-3 text-lg font-semibold">
          {d.todoTitle}
        </h2>
        {newQuotations + newInquiries === 0 ? (
          <p className="bg-success-soft text-success rounded-[var(--radius-card)] px-5 py-4 font-medium">{d.nothingTodo}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            <li>
              <TodoTile href="/admin/quotations?status=new" value={newQuotations} label={d.newQuotes} cta={d.open} />
            </li>
            <li>
              <TodoTile href="/admin/inquiries?status=new" value={newInquiries} label={d.newMessages} cta={d.open} />
            </li>
          </ul>
        )}
      </section>

      {/* 2. Quick actions */}
      <section aria-labelledby="quick-heading" className="mt-10">
        <h2 id="quick-heading" className="text-fg mb-3 text-lg font-semibold">
          {d.quickTitle}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { href: "/admin/products/new", label: d.addProduct },
            { href: "/admin/categories#new", label: d.addCategory },
            { href: "/admin/print-on-demand/portfolio/new", label: d.addWork },
            { href: "/admin/settings", label: d.editCompany },
          ].map((action) => (
            <li key={action.href}>
              <Tile href={action.href} className="flex h-full min-h-16 items-center gap-3 font-semibold">
                <span aria-hidden="true" className="bg-accent-soft text-accent grid size-9 shrink-0 place-items-center rounded-full text-lg">
                  +
                </span>
                {action.label}
              </Tile>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. The site at a glance */}
      <section aria-labelledby="site-heading" className="mt-10">
        <h2 id="site-heading" className="text-fg mb-3 text-lg font-semibold">
          {d.siteTitle}
        </h2>
        <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Stat href="/admin/products?status=published" value={publishedProducts} label={d.publishedProducts} />
          <Stat href="/admin/products?status=draft" value={draftProducts} label={d.draftProducts} />
          <Stat href="/admin/categories" value={categories} label={d.categories} />
          <Stat href="/admin/services" value={publishedServices} label={d.publishedServices} />
        </ul>
      </section>

      {/* 4. Recent activity */}
      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        <Panel title={d.recentQuotes} actions={<SeeAll href="/admin/quotations">{t.common.seeAll}</SeeAll>}>
          <ActivityList
            lang={lang}
            empty={d.noQuotes}
            items={(quotations.data ?? []).map((q) => ({
              href: `/admin/quotations/${q.id}`,
              title: q.company_name ? `${q.full_name} (${q.company_name})` : q.full_name,
              meta: q.reference,
              date: q.created_at,
              badge: qStatus[q.status],
            }))}
          />
        </Panel>
        <Panel title={d.recentMessages} actions={<SeeAll href="/admin/inquiries">{t.common.seeAll}</SeeAll>}>
          <ActivityList
            lang={lang}
            empty={d.noMessages}
            items={(inquiries.data ?? []).map((i) => ({
              href: `/admin/inquiries/${i.id}`,
              title: i.subject,
              meta: `${i.full_name} · ${i.reference}`,
              date: i.created_at,
              badge: iStatus[i.status],
            }))}
          />
        </Panel>
      </div>
    </>
  );
}

function TodoTile({ href, value, label, cta }: { href: string; value: number; label: string; cta: string }) {
  return (
    <Tile href={href} className={value > 0 ? "border-accent bg-accent-soft/40" : undefined}>
      <span className="flex items-end justify-between gap-4">
        <span>
          <span className="text-fg block text-4xl font-semibold tabular-nums" dir="ltr">
            {value}
          </span>
          <span className="text-fg mt-1 block font-medium">{label}</span>
        </span>
        <span className="text-accent text-sm font-semibold">{cta}</span>
      </span>
    </Tile>
  );
}

function Stat({ href, value, label }: { href: string; value: number; label: string }) {
  return (
    <li>
      <Tile href={href} className="h-full">
        <span className="text-fg block text-2xl font-semibold tabular-nums" dir="ltr">
          {value}
        </span>
        <span className="text-fg-muted mt-1 block text-sm">{label}</span>
      </Tile>
    </li>
  );
}

function SeeAll({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-accent inline-flex min-h-11 items-center text-sm font-medium">
      {children}
    </Link>
  );
}

function ActivityList({ items, empty, lang }: { items: Array<{ href: string; title: string; meta: string; date: string; badge: StatusLabel }>; empty: string; lang: AdminLang }) {
  if (items.length === 0) return <p className="text-fg-muted text-sm">{empty}</p>;
  return (
    <ul className="divide-line -my-2 divide-y">
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className="hover:bg-surface -mx-2 flex items-center justify-between gap-4 rounded-[var(--radius-control)] px-2 py-3">
            <span className="min-w-0">
              <span dir="auto" className="text-fg block truncate text-start font-medium">
                {item.title}
              </span>
              <span className="text-fg-muted block text-xs">
                <span dir="auto">{item.meta}</span> · {formatAdminDateTime(item.date, lang)}
              </span>
            </span>
            <StatusBadge status={item.badge} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
