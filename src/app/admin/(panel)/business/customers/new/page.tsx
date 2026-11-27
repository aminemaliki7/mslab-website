import { CustomerForm } from "@/components/admin/business/forms";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { requirePermission } from "@/features/business/permissions";
import { createSessionClient } from "@/lib/supabase/server";

export const generateMetadata = businessTitle((b) => b.customers.new);

/**
 * Full customer form. `?from_request=<id>` pre-fills it from an existing website request
 * (identity copied once, then the request is linked) — no automatic bulk conversion.
 */
export default async function NewBusinessCustomerPage({ searchParams }: PageProps<"/admin/business/customers/new">) {
  await requirePermission("business.customers.manage");
  const { b } = await getBusinessT();
  const params = await searchParams;
  const fromRequest = typeof params.from_request === "string" && /^[0-9a-f-]{36}$/i.test(params.from_request) ? params.from_request : undefined;
  const request = fromRequest
    ? (await (await createSessionClient()).from("quotation_requests").select("id, full_name, company_name, email, phone").eq("id", fromRequest).maybeSingle()).data
    : null;

  return (
    <>
      <AdminPageHeader title={b.customers.new} back={{ href: "/admin/business/customers", label: b.customers.title }} />
      <Panel className="max-w-3xl">
        <CustomerForm
          fromRequest={request?.id}
          values={
            request
              ? {
                  customer_type: request.company_name ? "company" : "individual",
                  name: request.company_name ?? request.full_name,
                  contact_name: request.company_name ? request.full_name : null,
                  email: request.email,
                  phone: request.phone,
                }
              : {}
          }
        />
      </Panel>
    </>
  );
}
