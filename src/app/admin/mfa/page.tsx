import { Suspense } from "react";
import { AdminI18nProvider, AdminLangSwitcher } from "@/components/admin/admin-i18n";
import { Wordmark } from "@/components/layout/wordmark";
import { requirePendingMfa } from "@/features/admin/auth";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { signOut } from "@/features/admin/session-actions";
import { createSessionClient } from "@/lib/supabase/server";
import { MfaForm } from "./mfa-form";

export const generateMetadata = adminTitle((t) => t.mfa.pageTitle);

/**
 * Second sign-in step, required for every admin (docs/SECURITY_STRATEGY.md §2): the first time,
 * the admin links an authenticator app (TOTP); afterwards they enter its 6-digit code. Until
 * then the session is aal1, which the panel (requireAdmin) and RLS (private.is_admin) refuse.
 */
export default function MfaPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Suspense fallback={<div className="border-line bg-bg h-96 w-full max-w-sm rounded-[var(--radius-card)] border" />}>
        <MfaCard />
      </Suspense>
    </main>
  );
}

async function MfaCard() {
  await requirePendingMfa();
  const [{ lang, dir, t }, supabase] = await Promise.all([getAdminT(), createSessionClient()]);
  const { data } = await supabase.auth.mfa.listFactors();
  const factor = data?.totp.find((f) => f.status === "verified") ?? null;

  return (
    <AdminI18nProvider lang={lang}>
      <div lang={lang} dir={dir} className="w-full max-w-sm">
        <div className="mb-4 flex justify-center">
          <AdminLangSwitcher current={lang} label={t.common.interfaceLanguage} />
        </div>
        <div className="border-line bg-bg rounded-[var(--radius-card)] border p-6 sm:p-8">
          <Wordmark />
          <h1 className="mt-6 text-xl font-semibold">{t.mfa.title}</h1>
          <p className="text-fg-muted mt-1 text-sm">{factor ? t.mfa.verifyLead : t.mfa.enrollLead}</p>
          <div className="mt-6">
            <MfaForm factorId={factor?.id ?? null} />
          </div>
          <p className="text-fg-muted mt-6 text-xs">{t.mfa.lost}</p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="text-accent text-sm underline-offset-4 hover:underline">
              {t.mfa.signOut}
            </button>
          </form>
        </div>
      </div>
    </AdminI18nProvider>
  );
}
