import Link from "next/link";
import { ActionButton } from "@/components/admin/admin-form";
import { AdminPageHeader, EmptyState, FilterBar, Notice, StatusBadge, Table, Td } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/features/admin/auth";
import { setProductFeatured, setProductStatus } from "@/features/admin/content-actions";
import { formatAdminDateTime } from "@/features/admin/dictionary";
import { contentStatuses } from "@/features/admin/labels";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { format } from "@/i18n/format";
import { createSessionClient } from "@/lib/supabase/server";

export const generateMetadata = adminTitle((t) => t.products.title);

const PAGE = 50;

export default async function ProductsAdminPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const { lang, t } = await getAdminT();
  const p = t.products;
  const statuses = contentStatuses(t);
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const status = typeof params.status === "string" && params.status in statuses ? (params.status as keyof typeof statuses) : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const db = await createSessionClient();
  let query = db.from("products").select("id, name_fr, sku, status, is_featured, updated_at, categories(name_fr)", { count: "exact" });
  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("search_text", `%${q.toLowerCase().replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
  const { data, count, error } = await query.order("updated_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  const products = data ?? [];
  const pageHref = (n: number) => `/admin/products?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), page: String(n) })}`;

  return (
    <>
      <AdminPageHeader
        title={p.title}
        description={`${p.description} ${format(p.count, { count: count ?? 0 })}.`}
        actions={<ButtonLink href="/admin/products/new">+ {p.add}</ButtonLink>}
      />
      {params.deleted ? <Notice>{p.deleted}</Notice> : null}
      <FilterBar
        action="/admin/products"
        q={q}
        status={status}
        statuses={statuses}
        labels={{ search: t.common.search, placeholder: p.searchPlaceholder, status: t.common.status, allStatuses: t.common.allStatuses, submit: t.common.filter }}
      />
      {error ? <Notice tone="danger">{t.common.loadError}</Notice> : null}

      {products.length === 0 ? (
        <EmptyState action={q || status ? undefined : <ButtonLink href="/admin/products/new">+ {p.add}</ButtonLink>}>{q || status ? t.common.noMatch : p.empty}</EmptyState>
      ) : (
        <Table head={[p.colProduct, p.colCategory, t.common.status, t.common.featured, t.common.modified, t.common.actions]}>
          {products.map((product) => (
            <tr key={product.id}>
              <Td>
                <Link href={`/admin/products/${product.id}`} className="hover:text-accent text-base font-semibold underline-offset-4 hover:underline md:text-sm">
                  {product.name_fr}
                </Link>
                {product.sku ? <p className="text-fg-muted font-[family-name:var(--font-geist-mono)] text-xs">{product.sku}</p> : null}
              </Td>
              <Td label={p.colCategory} className="text-fg-muted">
                {(product.categories as { name_fr: string } | null)?.name_fr ?? "—"}
              </Td>
              <Td label={t.common.status}>
                <StatusBadge status={statuses[product.status]} />
              </Td>
              <Td label={t.common.featured}>{product.is_featured ? "★" : "—"}</Td>
              <Td label={t.common.modified} className="text-fg-muted whitespace-nowrap">
                {formatAdminDateTime(product.updated_at, lang)}
              </Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    action={setProductStatus}
                    label={product.status === "published" ? t.common.unpublish : t.common.publish}
                    hidden={{ id: product.id, status: product.status === "published" ? "draft" : "published" }}
                  />
                  <ActionButton
                    action={setProductFeatured}
                    label={product.is_featured ? p.unfeature : p.feature}
                    hidden={{ id: product.id, featured: String(!product.is_featured) }}
                  />
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      {(count ?? 0) > PAGE ? (
        <div className="mt-6 flex gap-3">
          {page > 1 ? <ButtonLink href={pageHref(page - 1)} variant="secondary" size="sm">{t.common.previous}</ButtonLink> : null}
          {page * PAGE < (count ?? 0) ? <ButtonLink href={pageHref(page + 1)} variant="secondary" size="sm">{t.common.next}</ButtonLink> : null}
        </div>
      ) : null}
    </>
  );
}
