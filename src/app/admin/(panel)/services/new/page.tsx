import { ServiceForm } from "@/components/admin/service-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { adminTitle, getAdminT } from "@/features/admin/lang";

export const generateMetadata = adminTitle((t) => t.services.newTitle);

export default async function NewServicePage() {
  await requireAdmin();
  const { t } = await getAdminT();
  return (
    <>
      <AdminPageHeader title={t.services.newTitle} description={t.services.description} back={{ href: "/admin/services", label: t.services.title }} />
      <ServiceForm service={null} />
    </>
  );
}
