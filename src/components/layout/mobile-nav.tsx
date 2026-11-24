"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { ChevronIcon, CloseIcon, MenuIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-links";
import { useActiveItem } from "./nav-links";

type QuickLink = { href: string; label: string };

type Props = {
  items: NavItem[];
  cta: { href: string; label: string };
  labels: { open: string; close: string; navigation: string };
  /** Smaller links under the main list (order tracking…). */
  secondary?: QuickLink[];
  /** One-tap contact actions, only when the number exists in site settings. */
  contact?: { phone?: QuickLink; whatsapp?: QuickLink };
  children?: React.ReactNode;
};

const rowClass =
  "active:bg-surface -mx-2 flex min-h-14 w-[calc(100%+1rem)] items-center justify-between gap-4 rounded-[var(--radius-control)] px-2 text-start text-lg font-medium transition-colors";

const toggleClass =
  "text-fg hover:bg-surface active:bg-surface-strong inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] transition-colors";

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

/**
 * Full-screen mobile menu (below lg). It covers the page under the header, so nothing behind it
 * can be tapped or scrolled; the primary action sits at the bottom, in the thumb zone.
 * Closes on Escape, on navigation, and returns focus to the toggle.
 */
export function MobileNav({ items, cta, labels, secondary = [], contact, children }: Props) {
  const pathname = usePathname();
  // Store the path the menu was opened on: navigating elsewhere closes it without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const panelId = useId();
  const active = useActiveItem(items);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenedOn(null);
        toggleRef.current?.focus();
      }
    };
    // Close if the screen grows to the desktop layout while open (rotation, window resize).
    const desktop = window.matchMedia("(min-width: 64rem)");
    const onDesktop = () => desktop.matches && setOpenedOn(null);
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onDesktop);
    // The page behind must not scroll while the menu is open; data-menu-open hides floating buttons.
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    root.dataset.menuOpen = "";
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
      root.style.overflow = previousOverflow;
      delete root.dataset.menuOpen;
    };
  }, [open]);

  const quick = [contact?.phone && { ...contact.phone, icon: PhoneIcon }, contact?.whatsapp && { ...contact.whatsapp, icon: WhatsAppIcon }].filter(
    (q): q is QuickLink & { icon: typeof PhoneIcon } => Boolean(q),
  );

  return (
    <div className="lg:hidden">
      <button
        ref={toggleRef}
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
        ref={panelRef}
        id={panelId}
        hidden={!open}
        // Fills the screen below the 72 px header; scrolls on its own in landscape. Explicit height,
        // not bottom-0: the header's backdrop-filter makes it the containing block of this panel.
        className="bg-bg anim-sheet fixed inset-x-0 top-[4.5rem] z-40 h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain"
      >
        <nav
          aria-label={labels.navigation}
          className="mx-auto flex min-h-full max-w-[75rem] flex-col ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))] pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:ps-6 sm:pe-6"
        >
          <ul className="flex flex-col">
            {items.map((item, index) => (
              <li key={item.key} className="anim-sheet-item border-line border-b" style={{ "--i": index } as React.CSSProperties}>
                {item.children?.length ? (
                  <MobileGroup item={item} isActive={active === item.key} />
                ) : (
                  <Link
                    href={item.href}
                    aria-current={active === item.key ? "page" : undefined}
                    className={cn(rowClass, active === item.key ? "text-accent" : "text-fg")}
                  >
                    {item.label}
                    <ChevronIcon width={18} height={18} aria-hidden="true" className="text-fg-subtle shrink-0 rtl:-scale-x-100" />
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {secondary.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-x-6">
              {secondary.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-fg-muted hover:text-fg inline-flex min-h-11 items-center text-sm underline-offset-4 hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {/* Bottom of the screen = within reach of the thumb. */}
          <div className="mt-auto space-y-4 pt-8">
            {quick.length > 0 ? (
              <div className={cn("grid gap-3", quick.length > 1 && "grid-cols-2")}>
                {quick.map(({ href, label, icon: Icon }) => (
                  <a
                    key={href}
                    href={href}
                    {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="border-line text-fg active:bg-surface flex min-h-12 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors"
                  >
                    <Icon width={18} height={18} aria-hidden="true" className="shrink-0" />
                    <span className="truncate">{label}</span>
                  </a>
                ))}
              </div>
            ) : null}
            <Link href={cta.href} className={buttonClasses("primary", "lg", "w-full")}>
              {cta.label}
            </Link>
            {children ? <div className="flex justify-center">{children}</div> : null}
          </div>
        </nav>
      </div>
    </div>
  );
}

/**
 * A division in the mobile menu: one tap opens its links (accordion), so the whole menu stays
 * one short list. The division of the current page starts open.
 */
function MobileGroup({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const [open, setOpen] = useState(isActive);
  const listId = useId();
  const links = [...(item.overview ? [item.overview] : []), ...(item.children ?? []), ...(item.extra ? [item.extra] : [])];
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className={cn(rowClass, isActive ? "text-accent" : "text-fg")}
      >
        {item.label}
        <ChevronIcon width={18} height={18} aria-hidden="true" className={cn("text-fg-subtle shrink-0 rotate-90 transition-transform duration-200", open && "-rotate-90")} />
      </button>
      <ul id={listId} hidden={!open} className="pb-3">
        {links.map((link, index) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cn(
                "active:bg-surface flex min-h-11 items-center rounded-[var(--radius-control)] ps-3 pe-2 text-base",
                index === 0 && item.overview ? "text-fg font-semibold" : "text-fg-muted",
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
