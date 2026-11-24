"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronIcon } from "@/components/ui/icons";
import { sectionOfPath } from "@/i18n/routes";
import { cn } from "@/lib/utils";

export type NavLink = { href: string; label: string; hint?: string };

/**
 * A main navigation entry. With `children` it opens a menu (division): `overview` is its first,
 * highlighted link, `extra` a featured link under the list (the Studio).
 * Active state: a `match` path (or one of its sub-paths) first, then one of `sections`.
 */
export type NavItem = {
  key: string;
  href: string;
  label: string;
  sections?: string[];
  match?: string[];
  overview?: NavLink;
  children?: NavLink[];
  extra?: NavLink;
};

/** Key of the active item: a matching `match` path first, then the site section. */
export function activeItemKey(items: NavItem[], pathname: string | null): string | null {
  if (!pathname) return null;
  const byPath = items.find((item) => item.match?.some((m) => pathname === m || pathname.startsWith(`${m}/`)));
  if (byPath) return byPath.key;
  const section = sectionOfPath(pathname);
  return (section && items.find((item) => item.sections?.includes(section))?.key) || null;
}

export function useActiveItem(items: NavItem[]) {
  return activeItemKey(items, usePathname());
}

const itemClass = (isActive: boolean) =>
  cn(
    "type-caps relative inline-flex h-9 items-center gap-1 px-2 text-[0.6875rem] font-medium transition-colors",
    isActive ? "text-fg" : "text-fg/70 hover:text-fg",
    isActive && "after:bg-accent after:absolute after:inset-x-3 after:bottom-1.5 after:h-px",
  );

/** Pure list (no path hooks): also the <Suspense> fallback. */
export function NavList({ items, active, className }: { items: NavItem[]; active: string | null; className?: string }) {
  return (
    <ul className={cn("flex items-center gap-1 xl:gap-2", className)}>
      {items.map((item) => {
        const isActive = active === item.key;
        return (
          <li key={item.key} className="relative">
            {item.children?.length ? (
              <NavMenu item={item} isActive={isActive} />
            ) : (
              <Link href={item.href} aria-current={isActive ? "page" : undefined} className={itemClass(isActive)}>
                {item.label}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Desktop navigation links with the active division marked. */
export function NavLinks({ items, className }: { items: NavItem[]; className?: string }) {
  return <NavList items={items} active={useActiveItem(items)} className={className} />;
}

/**
 * Division menu (disclosure pattern): the button toggles a panel of links. Opens on click, tap
 * or keyboard; also on mouse hover (with a short close delay so the pointer can travel to the
 * panel). Escape closes it and returns focus to the button; a click outside or on a link closes it.
 * The links are in the HTML at all times (hidden, not absent) for crawlers and no-JS visitors.
 */
function NavMenu({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Time the menu was opened by hover: the click that usually follows must not close it again.
  const hoverOpenedAt = useRef(0);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const hoverOpen = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    cancelClose();
    if (!open) hoverOpenedAt.current = Date.now();
    setOpen(true);
  };
  const hoverClose = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  };

  const links = item.children ?? [];
  return (
    <div
      ref={rootRef}
      onPointerEnter={hoverOpen}
      onPointerLeave={hoverClose}
      // Leaving the menu with Tab closes it.
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (Date.now() - hoverOpenedAt.current < 600) return;
          setOpen((value) => !value);
        }}
        className={cn(itemClass(isActive), "cursor-pointer")}
      >
        {item.label}
        <ChevronIcon width={12} height={12} aria-hidden="true" className={cn("shrink-0 rotate-90 transition-transform duration-200", open && "-rotate-90")} />
      </button>
      <div id={panelId} hidden={!open} className="absolute start-0 top-full z-50 pt-2">
        <div className="border-line bg-bg anim-menu w-[min(34rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border p-3 shadow-[0_18px_40px_-20px_rgb(14_26_43/0.35)]">
          {item.overview ? (
            <Link
              href={item.overview.href}
              onClick={() => setOpen(false)}
              className="hover:bg-surface group flex items-start justify-between gap-4 rounded-[var(--radius-control)] px-3 py-3"
            >
              <span>
                <span className="text-fg block font-semibold">{item.overview.label}</span>
                {item.overview.hint ? <span className="text-fg-muted mt-0.5 block text-sm">{item.overview.hint}</span> : null}
              </span>
              <ChevronIcon width={16} height={16} aria-hidden="true" className="text-accent mt-1 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100" />
            </Link>
          ) : null}
          <ul className="border-line mt-1 grid grid-cols-2 gap-x-2 border-t pt-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-fg hover:bg-surface hover:text-accent flex min-h-10 items-center rounded-[var(--radius-control)] px-3 py-2 text-sm"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          {item.extra ? (
            <Link
              href={item.extra.href}
              onClick={() => setOpen(false)}
              className="bg-accent-soft hover:bg-surface-strong mt-2 flex items-center justify-between gap-4 rounded-[var(--radius-control)] px-3 py-2.5"
            >
              <span>
                <span className="text-fg block text-sm font-semibold">{item.extra.label}</span>
                {item.extra.hint ? <span className="text-fg-muted block text-xs">{item.extra.hint}</span> : null}
              </span>
              <ChevronIcon width={16} height={16} aria-hidden="true" className="text-accent shrink-0 rtl:-scale-x-100" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
