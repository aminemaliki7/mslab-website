"use client";

import "./globals.css";

/** Last-resort boundary when a root layout itself fails. Must render its own <html>. */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="fr">
      <body className="flex min-h-dvh items-center justify-center p-6 font-sans antialiased">
        <main className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Une erreur est survenue</h1>
          <p className="text-fg-muted mt-2">Something went wrong.</p>
          <button
            type="button"
            onClick={() => retry()}
            className="bg-primary text-on-primary mt-6 rounded-[var(--radius-control)] px-4 py-2.5 text-sm font-medium"
          >
            Réessayer / Try again
          </button>
        </main>
      </body>
    </html>
  );
}
