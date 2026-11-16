import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AdminI18nProvider, AdminLangSwitcher } from "@/components/admin/admin-i18n";
import { AdminNav, MobileAdminMenu } from "@/components/admin/admin-nav";
import { Wordmark } from "@/components/layout/wordmark";
import { Skeleton } from "@/components/ui/layout";
import { requireAdmin } from "@/features/admin/auth";
import { getAdminT } from "@/features/admin/lang";
import { signOut } from "@/features/admin/session-actions";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Protected back-office shell. The session read happens inside <Suspense> (Cache Components);
 * every page and server action ALSO calls requireAdmin() itself — this layout is not the
 * security boundary. The interface language (fr/en/ar) is the admin's choice: the wrapper
 * carries lang/dir so Arabic renders right-to-left.
 */
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: ReactNode }) {
  const [admin, { lang, dir, t }] = await Promise.all([requireAdmin(), getAdminT()]);
  const supabase = await createSessionClient();
  const [quotations, inquiries] = await Promise.all([
    supabase.from("quotation_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  const counts = { quotations: quotations.count ?? 0, inquiries: inquiries.count ?? 0 };
  const name = admin.profile.full_name ?? admin.email;

  // Account block: shown at the bottom of the sidebar (desktop) and inside the mobile menu.
  const account = (
    <div className="space-y-3 text-sm">
      <AdminLangSwitcher current={lang} label={t.common.interfaceLanguage} />
      <div>
        <p dir="auto" className="text-fg truncate font-medium">{name}</p>
        <p className="text-fg-muted text-xs">{admin.profile.role === "owner" ? t.common.owner : t.common.editor}</p>
      </div>
      <div className="flex flex-wrap gap-x-4">
        <Link href="/fr" target="_blank" className="text-accent inline-flex min-h-11 items-center font-medium">
          {t.common.viewSite} ↗
        </Link>
        <form action={signOut}>
          <button type="submit" className="text-fg-muted hover:text-fg inline-flex min-h-11 items-center underline-offset-4 hover:underline">
            {t.common.signOut}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <AdminI18nProvider lang={lang}>
      <div lang={lang} dir={dir} className="lg:grid lg:min-h-dvh lg:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Phones & tablets: top bar + folding menu. */}
        <header className="bg-bg border-line sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b px-4 lg:hidden">
          <Link href="/admin" aria-label={t.nav.dashboard}>
            <Wordmark />
          </Link>
          <MobileAdminMenu label={t.common.menuButton}>
            <AdminNav counts={counts} />
            <div className="border-line mt-5 border-t pt-4">{account}</div>
          </MobileAdminMenu>
        </header>

        {/* Desktop sidebar. */}
        <aside className="border-line bg-bg sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto border-e p-5 lg:flex">
          <Link href="/admin" aria-label={t.nav.dashboard}>
            <Wordmark />
          </Link>
          <AdminNav counts={counts} />
          <div className="border-line mt-auto border-t pt-4">{account}</div>
        </aside>

        <main className="min-w-0 p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
    </AdminI18nProvider>
  );
}

function ShellSkeleton() {
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[16rem_minmax(0,1fr)]" aria-busy="true">
      <div className="border-line bg-bg border-b p-5 lg:border-e">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="mt-6 hidden h-64 w-full lg:block" />
      </div>
      <div className="p-4 sm:p-6 lg:p-10">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-48 w-full" />
      </div>
    </div>
  );
}
