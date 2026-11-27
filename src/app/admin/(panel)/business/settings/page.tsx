import { ActionButton } from "@/components/admin/admin-form";
import { CategoryForm, SupplierForm } from "@/components/admin/business/forms";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { requirePermission } from "@/features/business/permissions";
import { listCategories, listSuppliers } from "@/features/business/queries";
import { setCategoryActive } from "@/features/business/settings-actions";

export const generateMetadata = businessTitle((b) => b.settings.title);

/** Lists entered by MSLAB itself — nothing is pre-filled (no invented categories or suppliers). */
export default async function BusinessSettingsPage() {
  const { can } = await requirePermission("business.read");
  const { b } = await getBusinessT();
  const s = b.settings;
  const [{ data: categories }, { data: suppliers }] = await Promise.all([listCategories(), listSuppliers()]);

  const categoryPanel = (kind: "product" | "expense", title: string, permission: "business.products.manage" | "business.expenses.manage") => {
    const rows = categories.filter((c) => c.kind === kind);
    return (
      <Panel title={title}>
        {rows.length === 0 ? <p className="text-fg-muted mb-4 text-sm">{s.categoriesEmpty}</p> : null}
        <ul className="divide-line mb-4 divide-y text-sm">
          {rows.map((c) => (
            <li key={c.id} className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-1">
              <span dir="auto" className={c.is_active ? "font-medium" : "text-fg-muted"}>
                {c.name}
                {c.is_active ? "" : ` (${s.hidden})`}
              </span>
              {can(permission) ? <ActionButton action={setCategoryActive} label={c.is_active ? s.hide : s.show} hidden={{ id: c.id, kind, active: c.is_active ? "false" : "true" }} /> : null}
            </li>
          ))}
        </ul>
        {can(permission) ? <CategoryForm kind={kind} /> : null}
      </Panel>
    );
  };

  return (
    <>
      <AdminPageHeader title={s.title} description={s.description} />
      <div className="grid gap-6 lg:grid-cols-2">
        {categoryPanel("product", s.productCategories, "business.products.manage")}
        {categoryPanel("expense", s.expenseCategories, "business.expenses.manage")}
        <Panel title={s.suppliers} className="lg:col-span-2">
          {suppliers.length === 0 ? <p className="text-fg-muted mb-4 text-sm">{s.suppliersEmpty}</p> : null}
          <ul className="divide-line mb-5 divide-y text-sm">
            {suppliers.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span dir="auto" className="font-medium">{x.name}</span>
                <span className="text-fg-muted" dir="ltr">{[x.phone, x.email].filter(Boolean).join(" · ")}</span>
              </li>
            ))}
          </ul>
          {can("business.expenses.manage") ? <SupplierForm /> : null}
        </Panel>
      </div>
    </>
  );
}
