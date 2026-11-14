import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "404 — MSLAB",
  robots: { index: false },
};

/** 404 for URLs outside any root layout (e.g. invalid locale). French first, then en/ar. */
export default function GlobalNotFound() {
  return (
    <html lang="fr" className={fontVariables}>
      <body className="bg-surface flex min-h-dvh items-center justify-center p-6 antialiased">
        <main className="max-w-md text-center">
          <p className="text-accent font-[family-name:var(--font-geist-mono)] text-sm">404</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Page introuvable</h1>
          <p className="text-fg-muted mt-2">Page not found</p>
          <p className="text-fg-muted mt-1" lang="ar" dir="rtl">
            الصفحة غير موجودة
          </p>
          <nav className="mt-8 flex justify-center gap-3 text-sm font-medium">
            <Link className="bg-primary text-on-primary rounded-[var(--radius-control)] px-4 py-2.5" href="/fr">
              Accueil
            </Link>
            <Link className="border-primary rounded-[var(--radius-control)] border px-4 py-2.5" href="/en">
              Home
            </Link>
            <Link className="border-primary rounded-[var(--radius-control)] border px-4 py-2.5" href="/ar" lang="ar">
              الرئيسية
            </Link>
          </nav>
        </main>
      </body>
    </html>
  );
}
