"use client";

import { useEffect, useId, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/form";
import { CloseIcon } from "@/components/ui/icons";
import { EDITOR_FILE_TYPES, MAX_LAYERS, type DesignInput } from "@/features/print-on-demand/design";
import { effectiveDpi, insideArea, layerBoxPx, layerMm } from "@/features/print-on-demand/design-geometry";
import { SNIFF_BYTES, sniffFile } from "@/features/print-on-demand/file-sniff";
import type { MockupKey } from "@/features/print-on-demand/mockup-keys";
import { MAX_FILE_BYTES } from "@/features/print-on-demand/schema";
import { FONT_KEYS, OPTION_KINDS, STUDIO_FONTS, isStudioProduct, type FontKey, type StudioProductConfig } from "@/features/print-on-demand/studio";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { cn } from "@/lib/utils";
import { fillField } from "@/components/forms/quick-picks";
import type { ViewKey } from "@/features/print-on-demand/studio";
import { MOCKUP_FILE_PREFIX, mockupHandoff } from "../mockup-handoff";
import { DEFAULT_COLORS, MOCKUPS, canRecolor } from "../mockups";
import { proofText } from "../proof-text";
import { studioSelect } from "../studio-select";
import { editorReducer, initialEditorState, type EditorLayer } from "./editor-state";
import { exportMockup } from "./export-mockup";
import { Stage, type Asset } from "./stage";
import { editorViews } from "./views";

type T = Dictionary["printOnDemand"]["studio"];

/** Swatches for drawn placeholder products only (configured products use MSLAB's colours). */
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

const TEXT_COLORS = ["#0E1A2B", "#FFFFFF", "#0B6E8A", "#C8443A", "#F2C14E", "#3E7D5A"] as const;

const THUMB_DESIGN = { imageUrl: null, text: "", scale: 0.7, dx: 0, dy: 0 };

let counter = 0;
const newId = () => `l-${(++counter).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Height/width of a text at the given font, measured with the page's loaded web font. */
function textAspect(text: string, font: FontKey): number {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const variable = /var\((--[\w-]+)\)/.exec(STUDIO_FONTS[font].css)?.[1];
  const family = (variable && getComputedStyle(document.documentElement).getPropertyValue(variable).trim()) || "system-ui";
  if (!ctx) return 0.25;
  ctx.font = `${STUDIO_FONTS[font].weight} 100px ${family}`;
  const width = ctx.measureText(text || " ").width;
  return width > 0 ? Math.min(20, 115 / width) : 0.25;
}

function Slider({ id, label, min, max, step = 1, value, unit = "", onChange, onStart }: {
  id: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  unit?: string;
  onChange: (v: number) => void;
  onStart: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-fg text-sm font-medium">
          {label}
        </label>
        <span className="text-fg-muted text-xs tabular-nums" dir="ltr">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        // LTR in every language: "right" means right on the product.
        dir="ltr"
        min={min}
        max={max}
        step={step}
        value={value}
        onPointerDown={onStart}
        onKeyDown={onStart}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent mt-1 h-11 w-full cursor-pointer"
      />
    </div>
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="text-fg-muted hover:text-fg hover:bg-surface-strong inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] disabled:opacity-35"
    >
      {children}
    </button>
  );
}

/** What the Studio flow shows in its project summary (studio-flow.tsx). */
export type StudioSnapshot = {
  product: MockupKey;
  /** Sides the product has, in order. */
  views: ViewKey[];
  /** Customized sides and their elements (text or file name). */
  layers: Array<{ view: ViewKey; kind: "text" | "image"; name: string }>;
  colorName: string | null;
  colorHex: string | null;
  options: Array<{ kind: string; label: string; name: string }>;
};

/** Serializable part of a design kept across a reload (text layers only: never files). */
export type StudioRestore = {
  product: MockupKey;
  colorHex: string | null;
  options: Partial<Record<string, string>>;
  textLayers: EditorLayer[];
};

/** Lets the Studio flow trigger the hand-off from its own "Request a quote" button. */
export type StudioController = { submit: () => Promise<boolean>; restoreData: () => StudioRestore };

/**
 * MSLAB Studio editor (ADR-026): layers (images and text) per printable side, direct
 * manipulation, undo/redo, verified product options, then "Use this design in my request"
 * hands the design spec, the ORIGINAL files and high-resolution mockups to the request form.
 * Everything stays in the browser until the visitor submits the request.
 *
 * Inside the Studio flow (studio-flow.tsx) the product is chosen outside (`selectedProduct`),
 * `mode="preview"` shows every customized side read-only, and the flow's own buttons call the
 * hand-off through `controllerRef`.
 */
export function StudioEditor({
  products,
  config,
  t,
  formId,
  selectedProduct,
  hideProductPicker = false,
  mode = "edit",
  onSnapshot,
  controllerRef,
  restore,
}: {
  products: MockupKey[];
  config: Partial<Record<string, StudioProductConfig>>;
  t: T;
  formId: string;
  selectedProduct?: MockupKey;
  hideProductPicker?: boolean;
  mode?: "edit" | "preview";
  onSnapshot?: (snapshot: StudioSnapshot) => void;
  controllerRef?: { current: StudioController | null };
  restore?: StudioRestore | null;
}) {
  const e = t.editor;
  const uid = useId();
  const firstProduct = restore?.product ?? selectedProduct ?? products[0] ?? "tshirt";
  const [product, setProduct] = useState<MockupKey>(firstProduct);
  const [state, dispatch] = useReducer(editorReducer, undefined, () => {
    const initial = initialEditorState(editorViews(firstProduct, config)[0]!.key, restore?.colorHex ?? DEFAULT_COLORS[firstProduct]);
    if (!restore) return initial;
    // Reload: text layers and options come back (files never left the previous page).
    const available = new Set(editorViews(firstProduct, config).map((v) => v.key));
    return { ...initial, doc: { ...initial.doc, options: restore.options, layers: restore.textLayers.filter((l) => l.kind === "text" && available.has(l.view)) } };
  });
  const assets = useRef(new Map<string, Asset>());
  const [, setAssetVersion] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const stageRef = useRef<SVGSVGElement>(null);
  const seeded = useRef(false);

  const views = useMemo(() => editorViews(product, config), [product, config]);
  const view = views.find((v) => v.key === state.view) ?? views[0]!;
  const productConfig = isStudioProduct(product) ? config[product] : undefined;
  const configured = view.configured;
  const viewLayers = state.doc.layers.filter((l) => l.view === view.key);
  const selected = viewLayers.find((l) => l.id === state.selectedId) ?? null;
  const colorOption = productConfig?.options.color.find((o) => o.id === state.doc.options.color);
  const tint = configured && view.mask && colorOption?.hex ? colorOption.hex : null;
  const drawingColor = state.doc.colorHex ?? DEFAULT_COLORS[product];
  const productName = (key: MockupKey) => t.products[key];

  // Product picked from a card elsewhere on the page.
  useEffect(
    () =>
      studioSelect.subscribe((key) => {
        if (products.includes(key)) changeProduct(key);
      }),
    // changeProduct only uses stable setters and the config prop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, config],
  );

  // Product chosen in the Studio flow's first step.
  useEffect(() => {
    if (selectedProduct && selectedProduct !== product && products.includes(selectedProduct)) changeProduct(selectedProduct);
    // changeProduct only uses stable setters and the config prop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  // Text typed in the homepage live proof starts the design (once; not over a restored project).
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    if (restore) return;
    const handed = proofText.read().trim().slice(0, 120);
    if (handed) addText(handed);
    // Runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Release object URLs on unmount.
  useEffect(() => {
    const map = assets.current;
    return () => map.forEach((a) => URL.revokeObjectURL(a.url));
  }, []);

  function changeProduct(key: MockupKey) {
    setProduct(key);
    const next = editorViews(key, config);
    dispatch({ type: "product", view: next[0]!.key, colorHex: DEFAULT_COLORS[key] });
    setStatus(null);
  }

  function addText(text = e.textDefault) {
    if (state.doc.layers.length >= MAX_LAYERS) return;
    const font: FontKey = "archivo";
    const aspect = textAspect(text, font);
    const fit = Math.min(0.7, (0.4 * view.area.h) / view.area.w / aspect);
    dispatch({
      type: "add",
      layer: {
        id: newId(),
        kind: "text",
        view: view.key,
        x: 0.5,
        y: 0.5,
        w: Math.max(0.05, fit),
        rotation: 0,
        aspect,
        text,
        font,
        // White ink on a dark product (black hoodie photo), navy otherwise.
        color: view.base.kind === "photo" && view.base.dark ? "#FFFFFF" : "#0E1A2B",
      },
    });
  }

  async function addImage(list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    setProblem(null);
    const head = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer());
    const sniffed = sniffFile(head);
    const type = (EDITOR_FILE_TYPES as readonly string[]).includes(sniffed.mime ?? "") ? (sniffed.mime as (typeof EDITOR_FILE_TYPES)[number]) : null;
    if (!type || file.size > MAX_FILE_BYTES || state.doc.layers.length >= MAX_LAYERS) {
      setProblem(format(e.fileRejected, { name: file.name }));
      return;
    }
    const url = URL.createObjectURL(file);
    let width = sniffed.width;
    let height = sniffed.height;
    if (type === "image/svg+xml" && (!width || !height)) {
      const img = new Image();
      img.src = url;
      await img.decode().catch(() => undefined);
      width = img.naturalWidth || null;
      height = img.naturalHeight || null;
    }
    const aspect = type === "application/pdf" || !width || !height ? 1 : height / width;
    const assetId = newId();
    assets.current.set(assetId, { url, type, file });
    setAssetVersion((v) => v + 1);
    const fit = Math.min(0.8, (0.8 * view.area.h) / view.area.w / aspect);
    dispatch({
      type: "add",
      layer: {
        id: newId(),
        kind: "image",
        view: view.key,
        x: 0.5,
        y: 0.5,
        w: Math.max(0.05, fit),
        rotation: 0,
        aspect,
        asset: assetId,
        file: { name: file.name.slice(-255), type, width: type === "application/pdf" ? null : width, height: type === "application/pdf" ? null : height },
      },
    });
  }

  const update = (patch: Partial<EditorLayer>, mode: "commit" | "preview" = "preview") => selected && dispatch({ type: "update", id: selected.id, patch, mode });
  const checkpoint = () => dispatch({ type: "checkpoint" });

  // Physical size, resolution and printable-area checks for the selected layer.
  const box = selected ? layerBoxPx(selected, view.area) : null;
  const outside = box ? !insideArea(box, view.area) : false;
  const mm = selected && view.printMm ? layerMm(selected, view.printMm) : null;
  const dpi = selected?.kind === "image" && selected.file.width && mm && selected.file.type !== "image/svg+xml" ? effectiveDpi(selected.file.width, mm.width) : null;
  const minDpi = productConfig?.minDpi ?? null;

  /** Hands the design to the request form; true once the form has everything (or there is no design). */
  async function submitDesign(): Promise<boolean> {
    const available = new Set(views.map((v) => v.key));
    const layers = state.doc.layers.filter((l) => available.has(l.view));
    if (layers.length === 0) {
      // No design: the request still names the product chosen in the Studio.
      fillField("projectType", productName(product));
      return true;
    }
    setBusy(true);
    setStatus(e.preparing);
    const design: DesignInput = {
      version: 1,
      product,
      colorId: state.doc.options.color ?? null,
      colorHex: !configured && canRecolor(product) ? drawingColor : null,
      sizeId: state.doc.options.size ?? null,
      materialId: state.doc.options.material ?? null,
      techniqueId: state.doc.options.technique ?? null,
      // The local object-URL reference stays in the browser.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      layers: layers.map(({ asset: _asset, ...layer }) => layer),
    };

    const mockups: File[] = [];
    let exportFailed = false;
    for (const v of views) {
      const onView = layers.filter((l) => l.view === v.key);
      if (onView.length === 0 || !stageRef.current) continue;
      try {
        const blob = await exportMockup({ stage: stageRef.current, view: v, layers: onView, assets: assets.current, tint: v.mask && colorOption?.hex ? colorOption.hex : null, color: drawingColor });
        mockups.push(new File([blob], `${MOCKUP_FILE_PREFIX}${product}-${v.key}.png`, { type: "image/png" }));
      } catch (err) {
        console.error("[studio] mockup export failed", err);
        exportFailed = true;
      }
    }
    const used = new Set(layers.map((l) => l.asset).filter(Boolean));
    const artwork = [...assets.current.entries()].filter(([id]) => used.has(id)).map(([, a]) => a.file);

    // Same as typing it: the form's own state (combobox) sees the product name.
    fillField("projectType", productName(product));
    mockupHandoff.send({ design: JSON.stringify(design), productName: productName(product), layerCount: layers.length, artwork, mockups });
    setBusy(false);
    setStatus(exportFailed ? e.exportError : e.handedOver);
    // In the Studio flow the flow moves to its request step itself.
    if (!controllerRef) document.getElementById(formId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  // The flow's buttons reach the hand-off and the restorable state through this controller.
  useEffect(() => {
    if (!controllerRef) return;
    controllerRef.current = {
      submit: submitDesign,
      restoreData: () => ({
        product,
        colorHex: state.doc.colorHex ?? null,
        options: state.doc.options,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        textLayers: state.doc.layers.filter((l) => l.kind === "text").map(({ asset: _asset, ...l }) => l),
      }),
    };
  });

  // Project summary for the flow: product, sides, elements, colour and options.
  const colorName = configured ? (colorOption?.name ?? null) : null;
  const snapshotKey = JSON.stringify([product, state.doc, views.map((v) => v.key), colorName]);
  useEffect(() => {
    if (!onSnapshot) return;
    const sideKeys = views.map((v) => v.key);
    onSnapshot({
      product,
      views: sideKeys,
      layers: state.doc.layers
        .filter((l) => sideKeys.includes(l.view))
        .map((l) => ({ view: l.view, kind: l.kind, name: l.kind === "text" ? l.text : l.file.name })),
      colorName,
      colorHex: configured ? (colorOption?.hex ?? null) : canRecolor(product) ? drawingColor : null,
      options: productConfig
        ? (["size", "material", "technique"] as const).flatMap((kind) => {
            const option = productConfig.options[kind].find((o) => o.id === state.doc.options[kind]);
            return option ? [{ kind, label: e.options[kind], name: option.name }] : [];
          })
        : [],
    });
    // snapshotKey captures every value read above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotKey]);

  const stageLabel = format(e.stageLabel, { product: productName(product), view: e.viewNames[view.key] });
  const layerName = (l: EditorLayer) => (l.kind === "text" ? l.text : l.file.name);

  // Preview: every side that carries a design (or the first side), read only, side by side.
  const previewViews = views.filter((v) => state.doc.layers.some((l) => l.view === v.key));
  const preview =
    mode === "preview" ? (
      <ul className={cn("grid gap-4", (previewViews.length || 1) > 1 && "sm:grid-cols-2")}>
        {(previewViews.length ? previewViews : views.slice(0, 1)).map((v) => (
          <li key={v.key} className="bg-bg border-line rounded-[var(--radius-card)] border p-3 sm:p-4">
            <p className="text-fg text-sm font-semibold">
              {productName(product)}
              {views.length > 1 ? <span className="text-fg-muted font-normal"> · {e.viewNames[v.key]}</span> : null}
            </p>
            <Stage
              view={v}
              layers={state.doc.layers.filter((l) => l.view === v.key)}
              assets={assets.current}
              tint={v.mask && colorOption?.hex ? colorOption.hex : null}
              drawingColor={drawingColor}
              selectedId={null}
              interactive={false}
              label={format(e.stageLabel, { product: productName(product), view: e.viewNames[v.key] })}
              className="mx-auto mt-2 w-full max-w-lg"
            />
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <>
    {preview}
    {/* The editor stays mounted in preview mode (hidden): layers, files and the export stage live here. */}
    <div className={cn("grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-12", mode === "preview" && "hidden")}>
      {/* ─── Controls ─── */}
      <div className="space-y-6 lg:col-span-4">
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor={`${uid}-file`}
            className="bg-accent hover:bg-accent-hover focus-within:ring-accent inline-flex min-h-11 cursor-pointer items-center rounded-[var(--radius-control)] px-4 text-sm font-semibold text-white focus-within:ring-2 focus-within:ring-offset-2"
          >
            {e.addImage}
            <input id={`${uid}-file`} type="file" accept={EDITOR_FILE_TYPES.join(",")} className="sr-only" onChange={(ev) => void addImage(ev.target.files).finally(() => (ev.target.value = ""))} />
          </label>
          <Button variant="secondary" onClick={() => addText()} disabled={state.doc.layers.length >= MAX_LAYERS}>
            {e.addText}
          </Button>
          <span className="ms-auto flex">
            <IconButton label={e.undo} onClick={() => dispatch({ type: "undo" })} disabled={state.past.length === 0}>
              <span aria-hidden="true" className="text-lg rtl:-scale-x-100">↶</span>
            </IconButton>
            <IconButton label={e.redo} onClick={() => dispatch({ type: "redo" })} disabled={state.future.length === 0}>
              <span aria-hidden="true" className="text-lg rtl:-scale-x-100">↷</span>
            </IconButton>
          </span>
        </div>
        <p className="text-fg-muted -mt-3 text-xs">{e.addImageHint}</p>
        {problem ? (
          <p role="alert" className="text-danger -mt-3 text-sm">
            {problem}
          </p>
        ) : null}

        {views.length > 1 ? (
          <fieldset>
            <legend className="text-fg text-sm font-medium">{e.views}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {views.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  aria-pressed={v.key === view.key}
                  onClick={() => dispatch({ type: "view", view: v.key })}
                  className={cn(
                    "min-h-11 rounded-full border px-4 text-sm",
                    v.key === view.key ? "bg-ink-900 border-ink-900 text-white" : "border-line-strong bg-bg hover:border-accent",
                  )}
                >
                  {e.viewNames[v.key]}
                  {state.doc.layers.some((l) => l.view === v.key) ? " •" : ""}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        <section aria-labelledby={`${uid}-layers`}>
          <h3 id={`${uid}-layers`} className="text-fg text-sm font-medium">
            {e.layers}
          </h3>
          {viewLayers.length === 0 ? (
            <p className="text-fg-muted mt-2 text-sm">{e.noLayers}</p>
          ) : (
            <ol className="border-line bg-bg mt-2 divide-y rounded-[var(--radius-control)] border">
              {[...viewLayers].reverse().map((l) => (
                <li key={l.id} className={cn("flex items-center gap-1 ps-2", l.id === state.selectedId && "bg-accent-soft")}>
                  <button type="button" onClick={() => dispatch({ type: "select", id: l.id })} aria-pressed={l.id === state.selectedId} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-start text-sm">
                    <span className="text-fg-muted shrink-0 text-xs">{l.kind === "text" ? e.layerText : e.layerImage}</span>
                    <bdi className="truncate">{layerName(l)}</bdi>
                  </button>
                  <IconButton label={e.moveUp} onClick={() => dispatch({ type: "reorder", id: l.id, direction: 1 })}>
                    <span aria-hidden="true">↑</span>
                  </IconButton>
                  <IconButton label={e.moveDown} onClick={() => dispatch({ type: "reorder", id: l.id, direction: -1 })}>
                    <span aria-hidden="true">↓</span>
                  </IconButton>
                  <IconButton label={e.deleteLayer} onClick={() => dispatch({ type: "remove", id: l.id })}>
                    <CloseIcon width={16} height={16} />
                  </IconButton>
                </li>
              ))}
            </ol>
          )}
        </section>

        {selected ? (
          <section className="space-y-4" aria-label={layerName(selected)}>
            {selected.kind === "text" ? (
              <>
                <div>
                  <label htmlFor={`${uid}-text`} className="text-fg text-sm font-medium">
                    {e.text}
                  </label>
                  <Input
                    id={`${uid}-text`}
                    className="mt-2"
                    maxLength={120}
                    dir="auto"
                    value={selected.text}
                    onFocus={checkpoint}
                    onChange={(ev) => update({ text: ev.target.value, aspect: textAspect(ev.target.value, selected.font) })}
                  />
                </div>
                <div>
                  <label htmlFor={`${uid}-font`} className="text-fg text-sm font-medium">
                    {e.font}
                  </label>
                  <Dropdown id={`${uid}-font`} className="mt-2" value={selected.font} onChange={(ev) => update({ font: ev.target.value as FontKey, aspect: textAspect(selected.text, ev.target.value as FontKey) }, "commit")}>
                    {FONT_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {STUDIO_FONTS[k].label}
                      </option>
                    ))}
                  </Dropdown>
                </div>
                <fieldset>
                  <legend className="text-fg text-sm font-medium">{e.textColor}</legend>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {TEXT_COLORS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        aria-label={hex}
                        aria-pressed={selected.color === hex}
                        onClick={() => update({ color: hex }, "commit")}
                        className={cn("size-10 rounded-full border", selected.color === hex ? "ring-accent ring-2 ring-offset-2" : "border-line-strong")}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                    <input
                      type="color"
                      aria-label={e.textColor}
                      value={selected.color.toLowerCase()}
                      onFocus={checkpoint}
                      onChange={(ev) => update({ color: ev.target.value.toUpperCase() })}
                      className="border-line-strong size-10 cursor-pointer rounded-full border bg-transparent p-0.5"
                    />
                  </div>
                </fieldset>
              </>
            ) : selected.file.type === "application/pdf" ? (
              <p className="text-fg-muted text-sm">{e.pdfNote}</p>
            ) : null}

            <Slider id={`${uid}-size`} label={e.size} min={3} max={150} value={Math.round(selected.w * 100)} unit="%" onStart={checkpoint} onChange={(v) => update({ w: v / 100 })} />
            <Slider id={`${uid}-rot`} label={e.rotation} min={-180} max={180} value={Math.round(selected.rotation)} unit="°" onStart={checkpoint} onChange={(v) => update({ rotation: v })} />
            <Slider id={`${uid}-x`} label={e.positionX} min={0} max={100} value={Math.round(selected.x * 100)} unit="%" onStart={checkpoint} onChange={(v) => update({ x: v / 100 })} />
            <Slider id={`${uid}-y`} label={e.positionY} min={0} max={100} value={Math.round(selected.y * 100)} unit="%" onStart={checkpoint} onChange={(v) => update({ y: v / 100 })} />
            <Button variant="ghost" size="sm" onClick={() => update({ x: 0.5, y: 0.5 }, "commit")}>
              {e.center}
            </Button>

            <div aria-live="polite" className="space-y-1 text-sm">
              {outside ? <p className="text-danger">{e.outside}</p> : null}
              {mm ? <p className="text-fg-muted">{format(e.printSize, { w: mm.width, h: mm.height })}</p> : null}
              {dpi !== null ? (
                minDpi && dpi < minDpi ? <p className="text-danger">{format(e.lowDpi, { dpi, min: minDpi })}</p> : <p className="text-fg-muted">{format(e.dpi, { dpi })}</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Product options: only what MSLAB configured (verified). */}
        {configured && productConfig ? (
          <div className="space-y-4">
            {OPTION_KINDS.filter((k) => productConfig.options[k].length > 0).map((kind) =>
              kind === "color" ? (
                <fieldset key={kind}>
                  <legend className="text-fg text-sm font-medium">{e.options.color}</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {productConfig.options.color.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        aria-label={o.name}
                        title={o.name}
                        aria-pressed={state.doc.options.color === o.id}
                        onClick={() => dispatch({ type: "option", kind, id: state.doc.options.color === o.id ? null : o.id })}
                        className={cn("size-10 rounded-full border", state.doc.options.color === o.id ? "ring-accent ring-2 ring-offset-2" : "border-line-strong")}
                        style={{ backgroundColor: o.hex ?? undefined }}
                      />
                    ))}
                  </div>
                </fieldset>
              ) : (
                <div key={kind}>
                  <label htmlFor={`${uid}-${kind}`} className="text-fg text-sm font-medium">
                    {e.options[kind]}
                  </label>
                  <Dropdown id={`${uid}-${kind}`} className="mt-2" value={state.doc.options[kind] ?? ""} onChange={(ev) => dispatch({ type: "option", kind, id: ev.target.value || null })}>
                    <option value="">{e.choose}</option>
                    {productConfig.options[kind].map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </Dropdown>
                </div>
              ),
            )}
          </div>
        ) : (
          <>
            {canRecolor(product) ? (
              <fieldset>
                <legend className="text-fg text-sm font-medium">{t.colorLabel}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SWATCHES.map((swatch) => (
                    <button
                      key={swatch.key}
                      type="button"
                      onClick={() => dispatch({ type: "colorHex", hex: swatch.hex })}
                      aria-label={t.colors[swatch.key]}
                      aria-pressed={drawingColor.toLowerCase() === swatch.hex.toLowerCase()}
                      className={cn("size-10 rounded-full border", drawingColor.toLowerCase() === swatch.hex.toLowerCase() ? "ring-accent border-white ring-2 ring-offset-2" : "border-line-strong")}
                      style={{ backgroundColor: swatch.hex }}
                    />
                  ))}
                </div>
              </fieldset>
            ) : null}
            <p className="text-fg-muted text-xs">{e.placeholderNote}</p>
          </>
        )}
      </div>

      {/* ─── Stage ─── */}
      <div className="order-first lg:order-none lg:col-span-8">
        <div className="bg-bg border-line rounded-[var(--radius-card)] border p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-fg font-semibold" aria-live="polite">
              {productName(product)}
              {views.length > 1 ? <span className="text-fg-muted font-normal"> · {e.viewNames[view.key]}</span> : null}
            </p>
            {controllerRef ? null : (
              <Button onClick={() => void submitDesign()} size="sm" disabled={busy || state.doc.layers.length === 0} className="max-sm:min-h-11 max-sm:w-full">
                {busy ? e.preparing : e.use}
              </Button>
            )}
          </div>
          <Stage
            view={view}
            layers={viewLayers}
            assets={assets.current}
            tint={tint}
            drawingColor={drawingColor}
            selectedId={state.selectedId}
            interactive
            label={stageLabel}
            svgRef={stageRef}
            onSelect={(id) => dispatch({ type: "select", id })}
            onChange={(id, patch, mode) => dispatch({ type: "update", id, patch, mode })}
            onCheckpoint={checkpoint}
            onRemove={(id) => dispatch({ type: "remove", id })}
            onUndoRedo={(type) => dispatch({ type })}
            className="focus-visible:ring-accent mx-auto mt-3 w-full max-w-xl rounded-[var(--radius-control)] focus-visible:ring-2 focus-visible:outline-none"
          />
          <p className="text-fg-muted mt-2 text-center text-xs">{e.gestureHint}</p>
          <p className="text-fg-muted text-center text-xs">{t.disclaimer}</p>
          {status ? (
            <p role="status" className="text-fg mt-2 text-center text-sm font-medium">
              {status}
            </p>
          ) : null}
        </div>

        <div className={cn("mt-4", hideProductPicker && "hidden")}>
          <p className="sr-only">{t.productsLabel}</p>
          {/* Phones: one swipeable row (the cut-off last tile shows there is more), not a tall grid. */}
          <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0 lg:grid-cols-6">
            {products.map((key) => {
              const Thumb = MOCKUPS[key];
              const active = key === product;
              return (
                <li key={key} className="w-[6.5rem] shrink-0 snap-start sm:w-auto">
                  <button
                    type="button"
                    onClick={() => changeProduct(key)}
                    aria-pressed={active}
                    className={cn(
                      "bg-bg flex h-full w-full flex-col items-center gap-1 rounded-[var(--radius-control)] border p-1.5 text-center text-xs transition-colors active:scale-[0.97]",
                      active ? "border-accent ring-accent ring-1" : "border-line hover:border-line-strong",
                    )}
                  >
                    <Thumb design={THUMB_DESIGN} color={DEFAULT_COLORS[key]} label="" className="pointer-events-none aspect-[4/3] w-full" />
                    <span className="text-fg leading-tight">{productName(key)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
    </>
  );
}
