"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/ui/icons";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { mockupHandoff } from "./mockup-handoff";

/**
 * The design composed in the Studio, carried by the request form as a hidden field
 * (`studioDesign`, validated again on the server). The visitor can detach it.
 */
export function StudioDesignField({ t }: { t: Dictionary["printOnDemand"]["studio"]["editor"] }) {
  const [design, setDesign] = useState<{ json: string; productName: string; layers: number } | null>(null);

  useEffect(() => mockupHandoff.subscribe((h) => setDesign({ json: h.design, productName: h.productName, layers: h.layerCount })), []);

  if (!design) return null;
  return (
    <div className="border-accent bg-accent-soft mb-4 flex items-center justify-between gap-3 rounded-[var(--radius-control)] border px-4 py-3 text-sm">
      <input type="hidden" name="studioDesign" value={design.json} />
      <span>
        <span className="text-fg block font-semibold">{t.attachedTitle}</span>
        <span className="text-fg-muted">{format(t.attachedSummary, { product: design.productName, layers: design.layers })}</span>
      </span>
      <button type="button" onClick={() => setDesign(null)} aria-label={t.removeDesign} title={t.removeDesign} className="text-fg-muted hover:text-danger -m-1 inline-flex size-11 items-center justify-center rounded">
        <CloseIcon width={16} height={16} />
      </button>
    </div>
  );
}
