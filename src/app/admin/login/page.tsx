import type { Metadata } from "next";
import { Wordmark } from "@/components/layout/wordmark";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

/**
 * Admin sign-in. There is no public registration: accounts are created by an owner in
 * Supabase Auth, then granted access through admin_profiles (docs/DATABASE_SCHEMA.md §7).
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="border-line bg-bg w-full max-w-sm rounded-[var(--radius-card)] border p-8">
        <Wordmark />
        <h1 className="mt-6 text-xl font-semibold">Administration</h1>
        <p className="text-fg-muted mt-1 text-sm">Accès réservé à l&apos;équipe MSLAB.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
