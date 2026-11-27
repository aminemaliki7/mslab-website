import Link from "next/link";
import { AdminPageHeader, EmptyState, Notice, Table, Td } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/layout";
import { format } from "@/i18n/format";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { dbCents, dbMilli, formatMoney, formatQty } from "@/features/business/money";
import { requirePermission } from "@/features/business/permissions";
import { isLowStock, listCategories, listProducts, type ProductView } from "@/features/business/queries";
import { safeSearchTerm } from "@/features/admin/search";

export const generateMetadata = businessTitle((b) => b.products.title);

export default async function BusinessProductsPage({ searchParams }: PageProps<"/admin/business/products">) {
  const { can } = await requirePermission("business.read");
  const { lang, b } = await getBusinessT();
  const p = b.products;
  const params = await searchParams;
  const view: ProductView = params.view === "low" || params.view === "archived" ? params.view : "active";
  const q = safeSearchTerm(params.q);
  const category = typeof params.category === "string" && /^[0-9a-f-]{36}$/i.test(params.category) ? params.category : undefined;

  const [{ data, error }, { data: categories }, { data: allActive }] = await Promise.all([
    listProducts({ q, view, category }),
    listCategories("product"),
    view === "active" && !q && !category ? Promise.resolve({ data: null }) : listProducts({ view: "active" }),
  ]);
  const active = allActive ?? data;
  const lowCount = active.filter(isLowStock).length;
  // Stock value at purchase cost, in integer cents: Σ round(qty × cost).
  const stockValue = active.reduce((sum, r) => (r.track_stock && r.purchase_cost !== null ? sum + Math.round((dbMilli(r.quantity_on_hand) * dbCents(r.purchase_cost)) / 1000) : sum), 0);

  const tabHref = (v: ProductView) => `/admin/business/products${v === "active" ? "" : `?view=${v}`}`;

  return (
    <>
      <AdminPageHeader
        title={p.title}
        description={p.description}
        actions={
          <>
            <a href={"/admin/business/export/products"} download className="text-accent inline-flex min-h-11 items-center text-sm font-medium">↓ {b.analytics.export}</a>
            {can("business.products.manage") ? <ButtonLink href="/admin/business/products/new">{p.new}</ButtonLink> : null}
          </>
        }
      />

      <ul className="mb-6 grid grid-cols-2 gap-3 sm:max-w-xl">
        <li className="border-line bg-bg rounded-[var(--radius-card)] border p-4">
          <p className="text-fg-muted text-sm">{p.stockValue}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums" dir="ltr">{formatMoney(stockValue, lang, { cents: true })}</p>
        </li>
        <li>
          <Link href={tabHref("low")} className={`block rounded-[var(--radius-card)] border p-4 ${lowCount > 0 ? "border-warning bg-warning-soft" : "border-line bg-bg"}`}>
            <p className="text-fg-muted text-sm">{p.lowStock}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{lowCount}</p>
          </Link>
        </li>
      </ul>

      <form action="/admin/business/products" method="get" className="mb-4 grid gap-2 sm:flex sm:flex-wrap">
        {view !== "active" ? <input type="hidden" name="view" value={view} /> : null}
        <label htmlFor="q" className="sr-only">{b.common.search}</label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder={p.searchPlaceholder} className="border-line-strong bg-bg h-11 min-w-0 rounded-[var(--radius-control)] border px-3 text-base sm:min-w-64 sm:flex-1" />
        <label htmlFor="category" className="sr-only">{b.common.category}</label>
        <select id="category" name="category" defaultValue={category ?? ""} className="border-line-strong bg-bg select-control h-11 rounded-[var(--radius-control)] border px-3 pe-10">
          <option value="">{b.common.all}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit" className="bg-primary text-on-primary h-11 rounded-[var(--radius-control)] px-5 text-sm font-medium">{b.common.filter}</button>
      </form>
      <nav aria-label={p.title} className="mb-5 flex flex-wrap gap-2">
        {(["active", "low", "archived"] as const).map((v) => (
          <Link key={v} href={tabHref(v)} aria-current={view === v ? "page" : undefined} className="border-line hover:border-accent aria-[current=page]:border-accent aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent inline-flex min-h-11 items-center rounded-full border px-4 text-sm">
            {v === "active" ? p.filterAll : v === "low" ? p.filterLow : p.filterArchived}
          </Link>
        ))}
      </nav>

      {error ? <Notice tone="danger">{b.common.loadError}</Notice> : null}
      {data.length === 0 ? (
        <EmptyState action={can("business.products.manage") && view === "active" && !q ? <ButtonLink href="/admin/business/products/new">{p.new}</ButtonLink> : undefined}>
          {q || category || view !== "active" ? b.common.noResult : p.empty}
        </EmptyState>
      ) : (
        <Table head={[p.colProduct, p.colStock, p.colPrice, p.colCost]}>
          {data.map((r) => {
            const low = isLowStock(r);
            const out = r.track_stock && dbMilli(r.quantity_on_hand) <= 0;
            return (
              <tr key={r.id} className={low ? "md:bg-warning-soft/40 max-md:!border-warning" : undefined}>
                <Td>
                  <Link href={`/admin/business/products/${r.id}`} className="hover:text-accent text-base font-semibold underline-offset-4 hover:underline md:text-sm">
                    {r.name}
                  </Link>
                  <p className="text-fg-muted text-xs">
                    {[r.sku, r.business_categories?.name, b.itemType[r.item_type]].filter(Boolean).join(" · ")}
                  </p>
                </Td>
                <Td label={p.colStock}>
                  {r.track_stock ? (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span className="font-semibold tabular-nums" dir="ltr">{formatQty(r.quantity_on_hand, lang)}</span>
                      <span className="text-fg-muted text-xs">{r.unit}</span>
                      {out ? <Badge tone="danger">{p.outOfStock}</Badge> : low ? <Badge tone="warning">{p.lowStock}</Badge> : null}
                    </span>
                  ) : (
                    <span className="text-fg-muted text-sm">{p.notTracked}</span>
                  )}
                </Td>
                <Td label={p.colPrice} className="tabular-nums">{formatMoney(r.selling_price, lang)}</Td>
                <Td label={p.colCost} className="text-fg-muted tabular-nums">{formatMoney(r.purchase_cost, lang)}</Td>
              </tr>
            );
          })}
        </Table>
      )}
      {lowCount > 0 && view !== "low" ? <p className="text-warning mt-4 text-sm font-medium">{format(p.lowCount, { count: lowCount })}</p> : null}
    </>
  );
}
