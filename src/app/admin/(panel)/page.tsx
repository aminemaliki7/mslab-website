import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { formatDateTime, inquiryStatus, quotationStatus } from "@/features/admin/labels";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  await requireAdmin();
  const db = await createSessionClient();
  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);

  const [publishedProducts, publishedServices, newInquiries, newQuotations, quotations, inquiries, products, unsent] =
    await Promise.all([
      count(db.from("products").select("id", { count: "exact", head: true }).eq("status", "published")),
      count(db.from("services").select("id", { count: "exact", head: true }).eq("status", "published")),
      count(db.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new")),
      count(db.from("quotation_requests").select("id", { count: "exact", head: true }).eq("status", "new")),
      db.from("quotation_requests").select("id, reference, full_name, company_name, status, created_at").order("created_at", { ascending: false }).limit(5),
      db.from("inquiries").select("id, reference, full_name, subject, status, created_at").order("created_at", { ascending: false }).limit(5),
      db.from("products").select("id, name_fr, status, updated_at").order("updated_at", { ascending: false }).limit(5),
      count(
        db
          .from("quotation_requests")
          .select("id", { count: "exact", head: true })
          .is("notified_at", null)
          .not("notification_error", "is", null),
      ),
    ]);

  const stats = [
    { label: "Produits publiés", value: publishedProducts, href: "/admin/products?status=published" },
    { label: "Services publiés", value: publishedServices, href: "/admin/services" },
    { label: "Nouveaux messages", value: newInquiries, href: "/admin/inquiries?status=new" },
    { label: "Nouvelles demandes de devis", value: newQuotations, href: "/admin/quotations?status=new" },
  ];

  return (
    <>
      <AdminPageHeader title="Tableau de bord" description="Vue d'ensemble de l'activité du site." />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link href={stat.href} className="border-line bg-bg hover:border-line-strong block rounded-[var(--radius-card)] border p-5 transition-colors">
              <p className="text-fg-muted text-sm">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{stat.value}</p>
            </Link>
          </li>
        ))}
      </ul>

      {unsent > 0 ? (
        <p className="bg-warning-soft text-warning mt-6 rounded-[var(--radius-control)] px-4 py-3 text-sm">
          {unsent} demande(s) de devis n&apos;ont pas fait l&apos;objet d&apos;une notification e-mail (envoi désactivé ou en
          échec). Consultez-les ci-dessous.
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Panel title="Dernières demandes de devis" actions={<Link href="/admin/quotations" className="text-accent text-sm">Tout voir</Link>}>
          <ActivityList
            items={(quotations.data ?? []).map((q) => ({
              href: `/admin/quotations/${q.id}`,
              title: `${q.reference} — ${q.full_name}${q.company_name ? ` (${q.company_name})` : ""}`,
              date: q.created_at,
              badge: quotationStatus[q.status],
            }))}
            empty="Aucune demande de devis pour le moment."
          />
        </Panel>
        <Panel title="Derniers messages" actions={<Link href="/admin/inquiries" className="text-accent text-sm">Tout voir</Link>}>
          <ActivityList
            items={(inquiries.data ?? []).map((i) => ({
              href: `/admin/inquiries/${i.id}`,
              title: `${i.reference} — ${i.full_name} : ${i.subject}`,
              date: i.created_at,
              badge: inquiryStatus[i.status],
            }))}
            empty="Aucun message pour le moment."
          />
        </Panel>
        <Panel title="Produits modifiés récemment" className="xl:col-span-2">
          <ActivityList
            items={(products.data ?? []).map((p) => ({
              href: `/admin/products/${p.id}`,
              title: p.name_fr,
              date: p.updated_at,
              badge: { label: p.status === "published" ? "Publié" : p.status === "draft" ? "Brouillon" : "Archivé", tone: p.status === "published" ? "success" : "neutral" },
            }))}
            empty="Aucun produit."
          />
        </Panel>
      </div>
    </>
  );
}

function ActivityList({
  items,
  empty,
}: {
  items: Array<{ href: string; title: string; date: string; badge: { label: string; tone: "neutral" | "accent" | "success" | "warning" | "danger" } }>;
  empty: string;
}) {
  if (items.length === 0) return <p className="text-fg-muted text-sm">{empty}</p>;
  return (
    <ul className="divide-line -my-2 divide-y">
      {items.map((item) => (
        <li key={item.href} className="flex items-center justify-between gap-4 py-2.5">
          <div className="min-w-0">
            <Link href={item.href} dir="auto" className="hover:text-accent block truncate text-start text-sm font-medium">
              {item.title}
            </Link>
            <p className="text-fg-muted text-xs">{formatDateTime(item.date)}</p>
          </div>
          <StatusBadge status={item.badge} />
        </li>
      ))}
    </ul>
  );
}
