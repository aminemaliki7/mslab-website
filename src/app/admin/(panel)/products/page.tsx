import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/admin/admin-form";
import { AdminPageHeader, EmptyState, FilterBar, StatusBadge, Table, Td } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/features/admin/auth";
import { setProductFeatured, setProductStatus } from "@/features/admin/content-actions";
import { contentStatus, formatDateTime } from "@/features/admin/labels";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Produits" };

const PAGE = 50;

export default async function ProductsAdminPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const status = typeof params.status === "string" && params.status in contentStatus ? (params.status as keyof typeof contentStatus) : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const db = await createSessionClient();
  let query = db
    .from("products")
    .select("id, name_fr, sku, status, is_featured, updated_at, categories(name_fr)", { count: "exact" });
  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("search_text", `%${q.toLowerCase().replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
  const { data, count, error } = await query.order("updated_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  const products = data ?? [];

  return (
    <>
      <AdminPageHeader
        title="Produits"
        description={`${count ?? 0} produit(s). Seuls les produits « Publié » sont visibles sur le site.`}
        actions={<ButtonLink href="/admin/products/new">+ Nouveau produit</ButtonLink>}
      />
      {params.deleted ? <p className="text-success mb-4 text-sm">Produit supprimé.</p> : null}
      <FilterBar action="/admin/products" q={q} status={status} statuses={contentStatus} placeholder="Nom, référence…" />
      {error ? <p className="text-danger text-sm">Impossible de charger les produits.</p> : null}

      {products.length === 0 ? (
        <EmptyState>Aucun produit{q || status ? " ne correspond à ces filtres" : " pour le moment"}.</EmptyState>
      ) : (
        <Table head={["Produit", "Catégorie", "Statut", "À la une", "Modifié", "Actions"]}>
          {products.map((p) => (
            <tr key={p.id}>
              <Td>
                <Link href={`/admin/products/${p.id}`} className="hover:text-accent font-medium">
                  {p.name_fr}
                </Link>
                {p.sku ? <p className="text-fg-muted font-[family-name:var(--font-geist-mono)] text-xs">{p.sku}</p> : null}
              </Td>
              <Td className="text-fg-muted">{(p.categories as { name_fr: string } | null)?.name_fr ?? "—"}</Td>
              <Td>
                <StatusBadge status={contentStatus[p.status]} />
              </Td>
              <Td>{p.is_featured ? "★" : "—"}</Td>
              <Td className="text-fg-muted whitespace-nowrap">{formatDateTime(p.updated_at)}</Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  <ActionButton
                    action={setProductStatus}
                    label={p.status === "published" ? "Dépublier" : "Publier"}
                    hidden={{ id: p.id, status: p.status === "published" ? "draft" : "published" }}
                  />
                  <ActionButton
                    action={setProductFeatured}
                    label={p.is_featured ? "Retirer de la une" : "Mettre à la une"}
                    hidden={{ id: p.id, featured: String(!p.is_featured) }}
                  />
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      {(count ?? 0) > PAGE ? (
        <div className="mt-4 flex gap-4 text-sm">
          {page > 1 ? <Link href={`/admin/products?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), page: String(page - 1) })}`}>← Précédent</Link> : null}
          {page * PAGE < (count ?? 0) ? <Link href={`/admin/products?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), page: String(page + 1) })}`}>Suivant →</Link> : null}
        </div>
      ) : null}
    </>
  );
}
