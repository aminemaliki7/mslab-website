import { SettingsForm } from "@/components/admin/settings-form";
import { AdminPageHeader, Notice } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { formatAdminDateTime } from "@/features/admin/dictionary";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { format } from "@/i18n/format";
import { createSessionClient } from "@/lib/supabase/server";

export const generateMetadata = adminTitle((t) => t.settings.title);

export default async function SettingsPage() {
  await requireAdmin();
  const { lang, t } = await getAdminT();
  const { data: settings } = await (await createSessionClient()).from("site_settings").select("*").eq("id", 1).single();
  if (!settings) return <Notice tone="danger">{t.settings.notFound}</Notice>;

  return (
    <>
      <AdminPageHeader title={t.settings.title} description={format(t.settings.description, { date: formatAdminDateTime(settings.updated_at, lang) })} />
      <SettingsForm settings={settings} />
    </>
  );
}
