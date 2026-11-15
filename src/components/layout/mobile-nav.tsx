"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-links";
import { useActiveSection } from "./nav-links";

type Props = {
  items: NavItem[];
  cta: { href: string; label: string };
  labels: { open: string; close: string; navigation: string };
  children?: React.ReactNode;
};

const toggleClass =
  "text-fg hover:bg-surface inline-flex size-11 items-center justify-center rounded-[var(--radius-control)]";

/** Static stand-in rendered until the path-aware menu streams in. */
export function MobileNavFallback({ label }: { label: string }) {
  return (
    <div className="lg:hidden">
      <button type="button" aria-label={label} aria-expanded={false} className={toggleClass}>
        <MenuIcon width={22} height={22} />
      </button>
    </div>
  );
}

/** Mobile disclosure menu. Closes on Escape and automatically on navigation. */
export function MobileNav({ items, cta, labels, children }: Props) {
  const pathname = usePathname();
  // Store the path the menu was opened on: navigating elsewhere closes it without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const panelId = useId();
  const active = useActiveSection();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenedOn(null);
    };
    document.addEventListener("keydown", onKey);
    // The page behind must not scroll while the menu is open.
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? labels.close : labels.open}
        onClick={() => setOpenedOn(open ? null : pathname)}
        className={toggleClass}
      >
        {open ? <CloseIcon width={22} height={22} /> : <MenuIcon width={22} height={22} />}
      </button>

      <div
        id={panelId}
        hidden={!open}
        // Never taller than the screen below the header (landscape phones): the panel scrolls instead.
        className="bg-bg border-line absolute inset-x-0 top-full max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-b shadow-[0_12px_24px_-16px_rgb(14_26_43/0.25)]"
      >
        <nav aria-label={labels.navigation} className="mx-auto max-w-[75rem] px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.section}>
                <Link
                  href={item.href}
                  aria-current={active === item.section ? "page" : undefined}
                  className={cn(
                    "border-line flex h-12 items-center border-b text-base font-medium",
                    active === item.section ? "text-accent" : "text-fg",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {children}
            <Link href={cta.href} className={buttonClasses("primary", "md")}>
              {cta.label}
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
