import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/admin-form";
import { MovementForm, ProductForm } from "@/components/admin/business/forms";
import { AdminPageHeader, Dl, EmptyState, Notice, Panel, Table, Td } from "@/components/admin/ui";
import { Badge } from "@/components/ui/layout";
import { formatAdminDateTime, translateMessage } from "@/features/admin/dictionary";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { movementTone } from "@/features/business/labels";
import { dbMilli, formatMoney, formatQty, inputAmount, inputQty } from "@/features/business/money";
import { requirePermission } from "@/features/business/permissions";
import { setProductArchived } from "@/features/business/product-actions";
import { getProduct, isLowStock, listCategories, signedUrls, staffNames } from "@/features/business/queries";
import { createSessionClient } from "@/lib/supabase/server";

export const generateMetadata = businessTitle((b) => b.products.editTitle);

export default async function BusinessProductPage({ params, searchParams }: PageProps<"/admin/business/products/[id]">) {
  const { can } = await requirePermission("business.read");
  const { lang, b } = await getBusinessT();
  const p = b.products;
  const { id } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ product, movements }, names, { data: categories }] = await Promise.all([getProduct(id), staffNames(), listCategories("product")]);
  if (!product) notFound();
  const canEdit = can("business.products.manage");
  const image = product.image_path ? (await signedUrls([product.image_path])).get(product.image_path) : undefined;
  const catalog = canEdit ? ((await (await createSessionClient()).from("products").select("id, name_fr").order("name_fr")).data ?? []) : [];
  const low = isLowStock(product);

  return (
    <>
      <AdminPageHeader
        title={product.name}
        description={[product.sku, product.business_categories?.name, b.itemType[product.item_type]].filter(Boolean).join(" · ")}
        back={{ href: "/admin/business/products", label: p.title }}
        actions={
          <>
            {product.is_archived ? <Badge>{b.common.archived}</Badge> : null}
            {canEdit ? (
              <ActionButton
                action={setProductArchived}
                label={product.is_archived ? b.common.unarchive : b.common.archive}
                confirm={product.is_archived ? undefined : p.archiveConfirm}
                hidden={{ id: product.id, archived: product.is_archived ? "false" : "true" }}
              />
            ) : null}
          </>
        }
      />
      {query.saved ? <Notice>{translateMessage("Produit enregistré.", lang)}</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          {/* Stock first on phones: it is what the manager checks and changes most. */}
          <Panel title={p.currentStock}>
            {product.track_stock ? (
              <div className="flex flex-wrap items-end gap-3">
                <p className={`text-4xl font-semibold tabular-nums ${dbMilli(product.quantity_on_hand) <= 0 ? "text-danger" : low ? "text-warning" : ""}`} dir="ltr">
                  {formatQty(product.quantity_on_hand, lang)}
                </p>
                <p className="text-fg-muted pb-1">{product.unit}</p>
                {low ? <Badge tone="warning">{p.lowStock}</Badge> : null}
                {product.min_stock !== null ? <p className="text-fg-muted w-full text-sm">{p.minStock} : {formatQty(product.min_stock, lang)}</p> : null}
              </div>
            ) : (
              <p className="text-fg-muted">{p.notTracked}</p>
            )}
          </Panel>

          {product.track_stock && can("business.stock.manage") && !product.is_archived ? (
            <Panel title={p.movementTitle} description={p.movementDescription}>
              <MovementForm productId={product.id} unit={product.unit} canNegative={can("business.stock.negative")} />
            </Panel>
          ) : null}

          <Panel title={p.historyTitle} actions={<Link href={`/admin/business/stock?product=${product.id}`} className="text-accent text-sm font-medium">{p.viewAllMovements}</Link>}>
            {movements.length === 0 ? (
              <EmptyState>{p.historyEmpty}</EmptyState>
            ) : (
              <Table head={[b.stock.colWhen, b.stock.colType, b.stock.colQty, b.stock.colAfter, b.stock.colReason]}>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <Td className="whitespace-nowrap">
                      {formatAdminDateTime(m.occurred_at, lang)}
                      <p className="text-fg-muted text-xs">{names.get(m.created_by ?? "") ?? b.common.unknownUser}</p>
                    </Td>
                    <Td label={b.stock.colType}>
                      <Badge tone={movementTone(m.movement_type, dbMilli(m.quantity))}>{b.movementType[m.movement_type]}</Badge>
                    </Td>
                    <Td label={b.stock.colQty} className="font-semibold tabular-nums">
                      <span dir="ltr">{dbMilli(m.quantity) > 0 ? "+" : ""}{formatQty(m.quantity, lang)}</span>
                    </Td>
                    <Td label={b.stock.colAfter} className="tabular-nums">
                      <span dir="ltr">{formatQty(m.quantity_after, lang)}</span>
                    </Td>
                    <Td label={b.stock.colReason}>
                      {m.business_sales ? (
                        <Link href={`/admin/business/sales/${m.business_sales.id}`} className="text-accent font-medium">{m.business_sales.number}</Link>
                      ) : m.business_expenses ? (
                        <Link href={`/admin/business/expenses/${m.business_expenses.id}`} className="text-accent font-medium">{m.business_expenses.label}</Link>
                      ) : null}
                      {m.reason && !m.business_sales ? <p dir="auto" className="text-fg-muted text-xs">{m.reason}</p> : null}
                    </Td>
                  </tr>
                ))}
              </Table>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          {image ? (
            // Private signed URL (short-lived): plain <img>, not the public image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={product.name} className="border-line bg-surface aspect-square w-full rounded-[var(--radius-card)] border object-contain" />
          ) : null}
          <Panel title={p.editTitle}>
            {canEdit ? (
              <ProductForm
                canStock={false}
                categories={categories.filter((c) => c.is_active || c.id === product.category_id).map((c) => ({ value: c.id, label: c.name }))}
                catalog={catalog.map((c) => ({ value: c.id, label: c.name_fr }))}
                values={{
                  id: product.id,
                  name: product.name,
                  sku: product.sku,
                  item_type: product.item_type,
                  category_id: product.category_id,
                  unit: product.unit,
                  description: product.description,
                  purchase_cost: inputAmount(product.purchase_cost, lang),
                  selling_price: inputAmount(product.selling_price, lang),
                  track_stock: product.track_stock,
                  min_stock: inputQty(product.min_stock, lang),
                  allow_negative: product.allow_negative,
                  catalog_product_id: product.catalog_product_id,
                }}
              />
            ) : (
              <>
                <p className="text-fg-muted mb-4 text-sm">{b.common.readOnly}</p>
                <Dl
                  items={[
                    { label: p.sellingPrice, value: formatMoney(product.selling_price, lang) },
                    { label: p.purchaseCost, value: formatMoney(product.purchase_cost, lang) },
                    { label: p.unit, value: product.unit },
                    { label: b.common.description, value: product.description ?? "—" },
                  ]}
                />
              </>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
