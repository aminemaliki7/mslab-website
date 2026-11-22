"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";

type Props = {
  /** id of the block holding the page's own quote buttons: the bar shows once it has scrolled away. */
  targetId: string;
  productName: string;
  href: string;
  label: string;
};

/**
 * Phones and tablets (below lg): a bottom bar that keeps "Request a quote" one tap away while
 * the product's own buttons are out of view. Hidden again near the footer so the bar never
 * covers the last lines of the page. Sets html[data-action-bar] so the WhatsApp button rises above it.
 */
export function ProductActionBar({ targetId, productName, href, label }: Props) {
  const [pastActions, setPastActions] = useState(false);
  const [atFooter, setAtFooter] = useState(false);
  const visible = pastActions && !atFooter;

  useEffect(() => {
    const target = document.getElementById(targetId);
    const footer = document.querySelector("body footer");
    const observers: IntersectionObserver[] = [];
    if (target) {
      // Shown whenever the page's own buttons are off screen — below the fold on load (phones) or
      // scrolled past — and never next to them. Top margin = the sticky header that covers them.
      const observer = new IntersectionObserver(([entry]) => setPastActions(!entry!.isIntersecting), {
        rootMargin: "-72px 0px 0px 0px",
      });
      observer.observe(target);
      observers.push(observer);
    }
    if (footer) {
      const observer = new IntersectionObserver(([entry]) => setAtFooter(entry!.isIntersecting));
      observer.observe(footer);
      observers.push(observer);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, [targetId]);

  useEffect(() => {
    const root = document.documentElement;
    const mobile = window.matchMedia("(max-width: 63.999rem)");
    const sync = () => {
      if (visible && mobile.matches) root.dataset.actionBar = "";
      else delete root.dataset.actionBar;
    };
    sync();
    mobile.addEventListener("change", sync);
    return () => {
      mobile.removeEventListener("change", sync);
      delete root.dataset.actionBar;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="anim-bar bg-bg/95 border-line fixed inset-x-0 bottom-0 z-30 border-t shadow-[0_-10px_28px_-20px_rgb(14_26_43/0.45)] backdrop-blur-sm lg:hidden">
      <div className="mx-auto flex max-w-[75rem] items-center gap-3 ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))] pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:ps-6 sm:pe-6">
        <p className="text-fg min-w-0 flex-1 truncate text-sm font-medium">{productName}</p>
        <ButtonLink href={href} size="md" className="min-h-12 shrink-0 px-5">
          {label}
        </ButtonLink>
      </div>
    </div>
  );
}
