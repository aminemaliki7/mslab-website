import type { Metadata } from "next";
import { ServiceForm } from "@/components/admin/service-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";

export const metadata: Metadata = { title: "Nouveau service" };

export default async function NewServicePage() {
  await requireAdmin();
  return (
    <>
      <AdminPageHeader title="Nouveau service" back={{ href: "/admin/services", label: "Services" }} />
      <ServiceForm service={null} />
    </>
  );
}
