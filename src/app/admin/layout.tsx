import type { Metadata } from "next";
import "../globals.css";
import { fontVariables } from "@/lib/fonts";

/** Back-office root layout (ADR-004/015): French UI, never indexed. */
export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Admin MSLAB" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="fr" dir="ltr" className={fontVariables}>
      <body className="bg-surface text-fg min-h-dvh antialiased">{children}</body>
    </html>
  );
}
