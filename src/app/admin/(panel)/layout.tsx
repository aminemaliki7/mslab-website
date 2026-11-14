import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Wordmark } from "@/components/layout/wordmark";
import { Skeleton } from "@/components/ui/layout";
import { requireAdmin } from "@/features/admin/auth";
import { signOut } from "@/features/admin/session-actions";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Protected back-office shell. The session read happens inside <Suspense> (Cache Components);
 * every page and server action ALSO calls requireAdmin() itself — this layout is not the
 * security boundary.
 */
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const supabase = await createSessionClient();
  const [quotations, inquiries] = await Promise.all([
    supabase.from("quotation_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="border-line bg-bg flex flex-col gap-4 border-b p-4 lg:sticky lg:top-0 lg:h-dvh lg:border-e lg:border-b-0 lg:p-5">
        <div className="flex items-center justify-between">
          <Link href="/admin" aria-label="Tableau de bord">
            <Wordmark />
          </Link>
          <form action={signOut} className="lg:hidden">
            <button type="submit" className="text-fg-muted hover:text-fg text-sm">
              Déconnexion
            </button>
          </form>
        </div>
        <AdminNav counts={{ quotations: quotations.count ?? 0, inquiries: inquiries.count ?? 0 }} />
        <div className="border-line mt-auto hidden border-t pt-4 text-sm lg:block">
          <p className="text-fg truncate font-medium">{admin.profile.full_name ?? admin.email}</p>
          <p className="text-fg-muted text-xs">{admin.profile.role === "owner" ? "Propriétaire" : "Éditeur"}</p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="text-fg-muted hover:text-fg text-sm underline-offset-4 hover:underline">
              Déconnexion
            </button>
          </form>
          <Link href="/fr" className="text-fg-muted hover:text-fg mt-2 block text-sm" target="_blank">
            Voir le site ↗
          </Link>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-6 lg:p-10">{children}</main>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_minmax(0,1fr)]" aria-busy="true">
      <div className="border-line bg-bg border-b p-5 lg:border-e">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
      <div className="p-10">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-48 w-full" />
      </div>
    </div>
  );
}
