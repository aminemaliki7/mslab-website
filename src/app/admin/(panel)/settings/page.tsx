import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { formatDateTime } from "@/features/admin/labels";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  await requireAdmin();
  const { data: settings } = await (await createSessionClient()).from("site_settings").select("*").eq("id", 1).single();
  if (!settings) return <p className="text-danger text-sm">Paramètres introuvables.</p>;

  return (
    <>
      <AdminPageHeader title="Paramètres" description={`Informations de l'entreprise affichées sur le site. Dernière modification : ${formatDateTime(settings.updated_at)}.`} />
      <SettingsForm settings={settings} />
    </>
  );
}
