import { SaleForm } from "@/components/admin/business/sale-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { requirePermission } from "@/features/business/permissions";
import { customerOptions, productOptions } from "@/features/business/queries";

export const generateMetadata = businessTitle((b) => b.sales.newTitle);

export default async function NewSalePage({ searchParams }: PageProps<"/admin/business/sales/new">) {
  const { can } = await requirePermission("business.sales.manage");
  const { b } = await getBusinessT();
  const params = await searchParams;
  const uuid = (v: unknown) => (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : undefined);
  const [products, customers] = await Promise.all([productOptions(), customerOptions()]);

  return (
    <>
      <AdminPageHeader title={b.sales.newTitle} description={b.sales.newDescription} back={{ href: "/admin/business/sales", label: b.sales.title }} />
      <div className="max-w-4xl">
        <SaleForm
          products={products}
          customers={customers}
          defaultCustomer={uuid(params.customer)}
          requestId={uuid(params.request)}
          canNegative={can("business.stock.negative")}
        />
      </div>
    </>
  );
}
