"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { CloseIcon } from "@/components/ui/icons";
import { ACCEPTED_FILE_TYPES, MAX_FILE_BYTES } from "@/features/print-on-demand/schema";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { cn } from "@/lib/utils";
import { mockupHandoff } from "./mockup-handoff";
import { DEFAULT_COLORS, MOCKUPS, type Design, type MockupKey } from "./mockups";

type T = Dictionary["printOnDemand"]["studio"];

const SWATCHES = [
  { key: "white", hex: "#FFFFFF" },
  { key: "ink", hex: "#0E1A2B" },
  { key: "kraft", hex: "#D9B382" },
  { key: "sand", hex: "#E9DDC7" },
  { key: "cyan", hex: "#0B6E8A" },
  { key: "yellow", hex: "#F2C14E" },
  { key: "red", hex: "#C8443A" },
  { key: "green", hex: "#3E7D5A" },
] as const;

const PREVIEW_TYPES = "image/png,image/jpeg,image/webp,image/svg+xml";

/**
 * Live mockups: the visitor's logo or text on MSLAB products, entirely in the browser
 * (object URL — nothing is uploaded for the preview). "Use this product" fills the request
 * form below (product type + the design file) and scrolls to it.
 */
export function MockupStudio({ products, t, formId }: { products: MockupKey[]; t: T; formId: string }) {
  const uid = useId();
  const [selected, setSelected] = useState<MockupKey>(products[0] ?? "tshirt");
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [scale, setScale] = useState(0.7);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [colors, setColors] = useState<Record<MockupKey, string>>(DEFAULT_COLORS);
  const [error, setError] = useState<string | null>(null);
  const [handedOver, setHandedOver] = useState(false);

  // Release the previous object URL whenever the image changes or the studio unmounts.
  useEffect(() => {
    if (!imageUrl) return;
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  function onImage(list: FileList | null) {
    const picked = list?.[0];
    if (!picked) return;
    if (!PREVIEW_TYPES.split(",").includes(picked.type) || picked.size > MAX_FILE_BYTES) {
      setError(format(t.imageError, { name: picked.name }));
      return;
    }
    setError(null);
    setFile(picked);
    setImageUrl(URL.createObjectURL(picked));
    setHandedOver(false);
  }

  function clearImage() {
    setFile(null);
    setImageUrl(null);
    setHandedOver(false);
  }

  function useProduct() {
    const input = document.getElementById("projectType");
    if (input instanceof HTMLInputElement) input.value = t.products[selected];
    // The private bucket accepts print formats only (SVG previews are not attached).
    if (file && (ACCEPTED_FILE_TYPES as readonly string[]).includes(file.type) && !handedOver) {
      mockupHandoff.send(file);
      setHandedOver(true);
    }
    document.getElementById(formId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    input?.focus({ preventScroll: true });
  }

  const design: Design = { imageUrl, text, scale, dx, dy };
  const Selected = MOCKUPS[selected];
  const productName = (key: MockupKey) => t.products[key];

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Controls */}
      <div className="space-y-6 lg:col-span-4">
        <div>
          <p className="text-fg text-sm font-medium">{t.uploadLabel}</p>
          {imageUrl ? (
            <div className="border-line bg-bg mt-2 flex items-center justify-between gap-3 rounded-[var(--radius-control)] border px-3 py-2 text-sm">
              <bdi className="truncate">{file?.name}</bdi>
              <button type="button" onClick={clearImage} aria-label={t.removeImage} className="text-fg-muted hover:text-danger -m-1 rounded p-1">
                <CloseIcon width={16} height={16} />
              </button>
            </div>
          ) : (
            <label
              htmlFor={`${uid}-file`}
              className="border-line-strong hover:border-accent hover:bg-accent-soft/40 focus-within:ring-accent mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] border border-dashed px-4 py-4 text-center transition-colors focus-within:ring-2"
            >
              <span className="text-accent text-sm font-semibold">{t.uploadButton}</span>
              <input id={`${uid}-file`} type="file" accept={PREVIEW_TYPES} className="sr-only" onChange={(e) => onImage(e.target.files)} />
            </label>
          )}
          <p className="text-fg-muted mt-1.5 text-xs">{t.uploadHint}</p>
          {error ? (
            <p role="alert" className="text-danger mt-1.5 text-sm">
              {error}
            </p>
          ) : null}
        </div>

        {!imageUrl ? (
          <div>
            <label htmlFor={`${uid}-text`} className="text-fg text-sm font-medium">
              {t.textLabel}
            </label>
            <Input id={`${uid}-text`} className="mt-2" maxLength={40} placeholder={t.textPlaceholder} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
        ) : null}

        <Slider id={`${uid}-size`} label={t.sizeLabel} min={20} max={100} value={Math.round(scale * 100)} onChange={(v) => setScale(v / 100)} />
        <Slider id={`${uid}-x`} label={t.horizontalLabel} min={-30} max={30} value={Math.round(dx * 100)} onChange={(v) => setDx(v / 100)} />
        <Slider id={`${uid}-y`} label={t.verticalLabel} min={-30} max={30} value={Math.round(dy * 100)} onChange={(v) => setDy(v / 100)} />

        <fieldset>
          <legend className="text-fg text-sm font-medium">{t.colorLabel}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {SWATCHES.map((swatch) => {
              const active = colors[selected].toLowerCase() === swatch.hex.toLowerCase();
              return (
                <button
                  key={swatch.key}
                  type="button"
                  onClick={() => setColors((c) => ({ ...c, [selected]: swatch.hex }))}
                  aria-label={t.colors[swatch.key]}
                  aria-pressed={active}
                  className={cn(
                    "size-8 rounded-full border transition-shadow",
                    active ? "ring-accent border-white ring-2 ring-offset-2" : "border-line-strong hover:ring-line-strong hover:ring-2",
                  )}
                  style={{ backgroundColor: swatch.hex }}
                />
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* Preview */}
      <div className="order-first lg:order-none lg:col-span-8">
        <div className="bg-bg border-line rounded-[var(--radius-card)] border p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-fg font-semibold" aria-live="polite">
              {productName(selected)}
            </p>
            <Button onClick={useProduct} size="sm">
              {t.useProduct}
            </Button>
          </div>
          <Selected design={design} color={colors[selected]} label={format(t.previewLabel, { product: productName(selected) })} className="mx-auto mt-2 w-full max-w-md" />
          <p className="text-fg-muted text-center text-xs">{t.disclaimer}</p>
        </div>

        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6" aria-label={t.productsLabel}>
          {products.map((key) => {
            const Thumb = MOCKUPS[key];
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => setSelected(key)}
                  aria-pressed={selected === key}
                  className={cn(
                    "bg-bg flex w-full flex-col items-center rounded-[var(--radius-control)] border p-1.5 transition-colors",
                    selected === key ? "border-accent ring-accent ring-1" : "border-line hover:border-line-strong",
                  )}
                >
                  <Thumb design={design} color={colors[key]} label="" className="pointer-events-none w-full" />
                  <span className="text-fg-muted line-clamp-1 text-[0.7rem] leading-tight">{productName(key)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Slider({ id, label, min, max, value, onChange }: { id: string; label: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-fg text-sm font-medium">
          {label}
        </label>
        <output htmlFor={id} className="text-fg-muted text-xs tabular-nums" dir="ltr">
          {value}
        </output>
      </div>
      {/* LTR in every language: "right" means right on the product. */}
      <input id={id} type="range" dir="ltr" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="accent-accent mt-2 w-full" />
    </div>
  );
}
