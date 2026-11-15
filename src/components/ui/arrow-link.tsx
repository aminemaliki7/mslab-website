import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowIcon } from "./icons";

/** Secondary text link with a direction-aware arrow (mirrored in RTL). */
export function ArrowLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const classes = cn("text-accent hover:text-accent-hover group inline-flex min-h-11 items-center gap-1.5 text-sm font-medium", className);
  const content = (
    <>
      {children}
      <ArrowIcon
        width={16}
        height={16}
        className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
      />
    </>
  );
  // External links (e.g. a maps URL from settings) open in a new tab without referrer leakage.
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
