import { Suspense } from "react";
import { AdminI18nProvider, AdminLangSwitcher } from "@/components/admin/admin-i18n";
import { Wordmark } from "@/components/layout/wordmark";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { LoginForm } from "./login-form";

export const generateMetadata = adminTitle((t) => t.login.pageTitle);

/**
 * Admin sign-in. There is no public registration: accounts are created by an owner in
 * Supabase Auth, then granted access through admin_profiles (docs/DATABASE_SCHEMA.md §7).
 * The language switch works before signing in.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Suspense fallback={<div className="border-line bg-bg h-96 w-full max-w-sm rounded-[var(--radius-card)] border" />}>
        <LoginCard />
      </Suspense>
    </main>
  );
}

async function LoginCard() {
  const { lang, dir, t } = await getAdminT();
  return (
    <AdminI18nProvider lang={lang}>
      <div lang={lang} dir={dir} className="w-full max-w-sm">
        <div className="mb-4 flex justify-center">
          <AdminLangSwitcher current={lang} label={t.common.interfaceLanguage} />
        </div>
        <div className="border-line bg-bg rounded-[var(--radius-card)] border p-6 sm:p-8">
          <Wordmark />
          <h1 className="mt-6 text-xl font-semibold">{t.login.title}</h1>
          <p className="text-fg-muted mt-1 text-sm">{t.login.lead}</p>
          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
      </div>
    </AdminI18nProvider>
  );
}
