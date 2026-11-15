"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowIcon } from "@/components/ui/icons";
import { DEFAULT_COLORS, MOCKUPS, type MockupKey } from "@/components/print-on-demand/mockups";
import { proofText } from "@/components/print-on-demand/proof-text";
import { format } from "@/i18n/format";

type Props = {
  products: MockupKey[];
  names: Record<MockupKey, string>;
  labels: { field: string; placeholder: string; cta: string; note: string; preview: string };
  studioHref: string;
};

/**
 * Homepage signature: a press proof. The visitor types a name and sees it on MSLAB products
 * at once (SVG, in the browser — nothing is sent). The text follows them to the studio.
 * Before they type, products carry the localized placeholder ("Votre marque").
 */
export function LiveProof({ products, names, labels, studioHref }: Props) {
  const id = useId();
  const [text, setText] = useState("");
  const shown = text.trim() || labels.placeholder;
  const design = { imageUrl: null, text: shown, scale: 1, dx: 0, dy: 0 };

  return (
    <div className="relative mx-auto w-full max-w-xl p-3 sm:p-4">
      <CropMarks />
      <div className="bg-bg border-line border p-4 sm:p-6">
        <label htmlFor={id} className="text-fg block text-sm font-medium">
          {labels.field}
        </label>
        <input
          id={id}
          type="text"
          value={text}
          maxLength={24}
          autoComplete="off"
          enterKeyHint="done"
          placeholder={labels.placeholder}
          onChange={(event) => {
            setText(event.target.value);
            proofText.write(event.target.value.trim());
          }}
          className="border-fg text-fg placeholder:text-fg-subtle mt-2 h-12 w-full border-b-2 bg-transparent text-xl font-semibold focus-visible:border-accent focus-visible:outline-none"
        />
        <ul className="mt-5 grid grid-cols-2 gap-2 sm:gap-3">
          {products.slice(0, 4).map((key) => {
            const Mockup = MOCKUPS[key];
            return (
              <li key={key} className="bg-surface px-3 pt-1 pb-2 sm:px-6">
                <Mockup design={design} color={DEFAULT_COLORS[key]} label={format(labels.preview, { product: names[key] })} className="w-full" />
                <p className="text-fg-muted pb-1 text-center text-xs">{names[key]}</p>
              </li>
            );
          })}
        </ul>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p className="text-fg-muted text-sm">{labels.note}</p>
          <Link href={studioHref} className="group text-fg hover:text-accent inline-flex min-h-11 items-center gap-2 font-semibold underline decoration-2 underline-offset-4">
            {labels.cta}
            <ArrowIcon width={18} height={18} className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Trim marks at the four corners of the proof (decorative; animated once on load). */
function CropMarks() {
  const mark = "hero-crop-mark border-fg absolute size-3 sm:size-4";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className={`${mark} hero-crop-mark-1 start-0 top-0 border-e border-b`} />
      <span className={`${mark} hero-crop-mark-2 end-0 top-0 border-s border-b`} />
      <span className={`${mark} hero-crop-mark-3 start-0 bottom-0 border-e border-t`} />
      <span className={`${mark} hero-crop-mark-4 end-0 bottom-0 border-s border-t`} />
    </div>
  );
}
