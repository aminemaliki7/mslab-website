"use client";

import type { CSSProperties } from "react";
import { ArrowIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { DEFAULT_COLORS, MOCKUPS, type Design, type MockupKey } from "./mockups";
import { studioSelect } from "./studio-select";

/**
 * Product presentation for the print-on-demand page: the floating mockup row in the hero and
 * the "choose your product" cards. Mockups show the dashed "your logo here" placeholder — never
 * a real client's design. Decorative motion only (anim-float, disabled for reduced motion).
 */

const PLACEHOLDER: Design = { imageUrl: null, text: "", scale: 0.7, dx: 0, dy: 0 };

/** Soft brand tints behind each mockup (cycled). */
const TINTS = ["#E7F2F5", "#EFEDE6", "#F4ECDD", "#E8ECF1", "#FBF1D6", "#EAF1EC"] as const;
const tint = (index: number) => TINTS[index % TINTS.length];

/** Hero: a row of tinted tiles, each with a gently floating product. */
export function HeroMockups({ products, className }: { products: MockupKey[]; className?: string }) {
  const shown = products.slice(0, 5);
  return (
    <ul className={cn("grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-5", className)} aria-hidden="true">
      {shown.map((key, index) => {
        const Mockup = MOCKUPS[key];
        return (
          <li
            key={key}
            // Only three tiles fit a phone row; the rest appear from lg up.
            className={cn("aspect-[4/5] overflow-hidden rounded-2xl", index >= 3 && "hidden lg:block")}
            style={{ backgroundColor: tint(index) }}
          >
            <div
              className="anim-float flex h-full items-center justify-center p-3 sm:p-5"
              style={{ animationDelay: `${index * 0.7}s` } as CSSProperties}
            >
              <Mockup design={PLACEHOLDER} color={DEFAULT_COLORS[key]} label="" className="w-full" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** "Choose your product": one card per active product; picking one opens it in the studio. */
export function ProductPicker({
  products,
  names,
  customizeLabel,
  studioId,
}: {
  products: MockupKey[];
  names: Record<MockupKey, string>;
  customizeLabel: string;
  studioId: string;
}) {
  function pick(key: MockupKey) {
    studioSelect.send(key);
    document.getElementById(studioId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((key, index) => {
        const Mockup = MOCKUPS[key];
        return (
          <li key={key} className="reveal">
            <button
              type="button"
              onClick={() => pick(key)}
              className="group border-line bg-bg hover:border-line-strong focus-visible:ring-accent flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-card)] border text-start transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-18px_rgb(14_26_43/0.45)] focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="block p-4 sm:p-6" style={{ backgroundColor: tint(index) }}>
                <span className="mx-auto block max-w-[11rem] transition-transform duration-300 group-hover:-translate-y-1">
                  <Mockup design={PLACEHOLDER} color={DEFAULT_COLORS[key]} label="" className="w-full" />
                </span>
              </span>
              <span className="flex flex-1 flex-col gap-1 p-4">
                <span className="text-fg font-semibold leading-snug">{names[key]}</span>
                <span className="text-accent mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-medium">
                  {customizeLabel}
                  <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
