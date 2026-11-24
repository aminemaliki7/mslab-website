"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { ArrowIcon, CheckIcon, CloseIcon } from "@/components/ui/icons";
import type { SpecTemplate } from "@/config/product-spec-templates";
import { fillField } from "@/components/forms/quick-picks";
import type { MockupKey } from "@/features/print-on-demand/mockup-keys";
import type { StudioProductConfig } from "@/features/print-on-demand/studio";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { cn } from "@/lib/utils";
import { CustomRequestForm } from "../custom-request-form";
import { DEFAULT_COLORS, MOCKUPS, canRecolor, type Design } from "../mockups";
import { StudioEditor, type StudioController, type StudioRestore, type StudioSnapshot } from "./studio-editor";
import { editorViews } from "./views";

type Category = "textile" | "merch" | "stationery" | "print" | "packaging";

/** Category of each Studio support (the order of CATEGORIES is the order of the chips). */
const CATEGORY_OF: Record<MockupKey, Category> = {
  tshirt: "textile",
  hoodie: "textile",
  tote: "merch",
  mug: "merch",
  sticker: "merch",
  notebook: "stationery",
  "business-card": "stationery",
  letterhead: "stationery",
  flyer: "print",
  "folded-card": "print",
  poster: "print",
  catalog: "print",
  banner: "print",
  box: "packaging",
};
const CATEGORIES: Category[] = ["textile", "merch", "stationery", "print", "packaging"];

/** "What you specify" list for each support (config/product-spec-templates.ts); none = free notes only. */
const SPECS_OF: Partial<Record<MockupKey, SpecTemplate>> = {
  tshirt: "textile",
  hoodie: "textile",
  tote: "merch",
  mug: "merch",
  sticker: "stickers",
  notebook: "notebooks",
  "business-card": "businessCards",
  letterhead: "letterhead",
  flyer: "flatPrint",
  "folded-card": "flatPrint",
  poster: "flatPrint",
  catalog: "bound",
  box: "packaging",
};

const QUANTITY_PICKS = [50, 100, 250, 500, 1000];
const STEPS = 5;
const QUOTE_STEP = 4;
const STORAGE_KEY = "mslab-studio-v1";
const BLANK: Design = { imageUrl: null, text: "", scale: 0.7, dx: 0, dy: 0 };

type Saved = {
  v: 1;
  step: number;
  product: MockupKey | null;
  other: boolean;
  quantity: string;
  notes: string;
  design: StudioRestore | null;
  imageCount: number;
};

const validQuantity = (value: string) => /^\d{1,7}$/.test(value.trim()) && Number(value) > 0;

function readSaved(products: MockupKey[]): { saved: Saved | null; fromUrl: MockupKey | null } {
  let saved: Saved | null = null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Saved) : null;
    if (parsed?.v === 1 && (parsed.product === null || products.includes(parsed.product))) saved = parsed;
  } catch {
    saved = null;
  }
  const wanted = new URLSearchParams(window.location.search).get("product");
  const fromUrl = wanted && (products as string[]).includes(wanted) ? (wanted as MockupKey) : null;
  return { saved, fromUrl };
}

const subscribeNothing = () => () => {};

type FormProps = Omit<Parameters<typeof CustomRequestForm>[0], "onSubmitted">;

/**
 * MSLAB Studio as a five-step project (docs/STUDIO_CX_PLAN.md): product → configuration →
 * customization → preview → quote. The editor and the request form stay mounted for the whole
 * visit (hidden when not on their step), so going back never loses a layer, a file or a typed
 * value. Progress (not files) is kept in sessionStorage for a reload.
 */
export function StudioFlow(props: {
  products: MockupKey[];
  config: Partial<Record<string, StudioProductConfig>>;
  t: Dictionary["printOnDemand"]["studio"];
  f: Dictionary["cx"]["studioFlow"];
  specs: Dictionary["cx"]["specs"];
  form: FormProps;
}) {
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  // Read once, after hydration (storage and URL only exist in the browser).
  const initial = useMemo(() => (hydrated ? readSaved(props.products) : null), [hydrated, props.products]);
  if (!initial) return <FlowSkeleton />;
  return <FlowInner {...props} initial={initial} />;
}

function FlowSkeleton() {
  return (
    <div aria-busy="true" className="space-y-6">
      <div className="bg-surface h-14 animate-pulse rounded-[var(--radius-card)]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="bg-surface aspect-[4/5] animate-pulse rounded-[var(--radius-card)]" />
        ))}
      </div>
    </div>
  );
}

function FlowInner({
  products,
  config,
  t,
  f,
  specs,
  form,
  initial,
}: {
  products: MockupKey[];
  config: Partial<Record<string, StudioProductConfig>>;
  t: Dictionary["printOnDemand"]["studio"];
  f: Dictionary["cx"]["studioFlow"];
  specs: Dictionary["cx"]["specs"];
  form: FormProps;
  initial: { saved: Saved | null; fromUrl: MockupKey | null };
}) {
  const { saved, fromUrl } = initial;
  // A product named in the URL starts (or continues) a project on that product.
  const resume = saved && (!fromUrl || saved.product === fromUrl) ? saved : null;
  const [step, setStep] = useState(resume ? Math.min(resume.step, 3) : fromUrl ? 1 : 0);
  const [product, setProduct] = useState<MockupKey | null>(resume?.product ?? fromUrl);
  const [other, setOther] = useState(resume?.other ?? false);
  const [quantity, setQuantity] = useState(resume?.quantity ?? "");
  const [notes, setNotes] = useState(resume?.notes ?? "");
  const [quantityError, setQuantityError] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [snapshot, setSnapshot] = useState<StudioSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(
    resume ? (resume.imageCount > 0 ? format(f.restored, { count: resume.imageCount }) : f.restoredNoImages) : null,
  );
  const [restore] = useState<StudioRestore | null>(resume?.design && resume.design.product === resume.product ? resume.design : null);
  const [instance, setInstance] = useState(0);
  const controller = useRef<StudioController | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  const name = (key: MockupKey) => t.products[key];
  const imageCount = snapshot?.layers.filter((l) => l.kind === "image").length ?? 0;

  // Keep the project for a reload of this tab (never the files themselves).
  useEffect(() => {
    try {
      const data: Saved = {
        v: 1,
        step,
        product,
        other,
        quantity,
        notes,
        design: controller.current && product ? controller.current.restoreData() : null,
        imageCount,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage unavailable: the project simply is not kept.
    }
  }, [step, product, other, quantity, notes, snapshot, imageCount]);

  // Phones and tablets: the floating WhatsApp button rises above the bottom action bar.
  useEffect(() => {
    const root = document.documentElement;
    const narrow = window.matchMedia("(max-width: 63.999rem)");
    const sync = () => {
      if (step > 0 && narrow.matches) root.dataset.actionBar = "";
      else delete root.dataset.actionBar;
    };
    sync();
    narrow.addEventListener("change", sync);
    return () => {
      narrow.removeEventListener("change", sync);
      delete root.dataset.actionBar;
    };
  }, [step]);

  const reachable = (index: number) => {
    if (index === 0) return true;
    if (index === QUOTE_STEP) return other || (product !== null && validQuantity(quantity));
    return product !== null && !other;
  };
  const completed = (index: number) =>
    index === 0 ? product !== null || other : index === 1 ? validQuantity(quantity) : index === 2 ? (snapshot?.layers.length ?? 0) > 0 : index === 3 ? step === QUOTE_STEP : false;

  function go(index: number) {
    setStep(index);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function choose(key: MockupKey) {
    setProduct(key);
    setOther(false);
    go(1);
  }

  function chooseOther() {
    setOther(true);
    setProduct(null);
    fillField("projectType", "");
    go(QUOTE_STEP);
  }

  function next() {
    if (step === 1 && !validQuantity(quantity)) {
      setQuantityError(true);
      document.getElementById(`${uid}-qty`)?.focus();
      return;
    }
    if (step === 3) return void toQuote();
    go(step + 1);
  }

  async function toQuote() {
    if (!validQuantity(quantity)) return go(1);
    setBusy(true);
    const ok = (await controller.current?.submit()) ?? true;
    // The request form is already on the page: fill it like typing would.
    fillField("quantity", quantity.trim());
    // The request needs a short description: the visitor's notes, or what was prepared here.
    const sideList = snapshot ? [...new Set(snapshot.layers.map((l) => l.view))].map((v) => t.editor.viewNames[v]).join(", ") : "";
    const prepared = product
      ? sideList
        ? format(f.autoDescription, { product: name(product), sides: sideList })
        : format(f.autoDescriptionNoDesign, { product: name(product) })
      : "";
    fillField("description", notes.trim() || prepared);
    setBusy(false);
    if (ok) go(QUOTE_STEP);
  }

  function restart() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setProduct(null);
    setOther(false);
    setQuantity("");
    setNotes("");
    setSnapshot(null);
    setNotice(null);
    setInstance((n) => n + 1);
    go(0);
  }

  const viewNames = t.editor.viewNames;
  const sides = snapshot ? [...new Set(snapshot.layers.map((l) => l.view))].map((v) => viewNames[v]) : [];

  const summary = (
    <ProjectSummary
      f={f}
      rows={[
        { label: f.summaryProduct, value: other ? f.otherTitle : product ? name(product) : null, step: 0 },
        { label: f.summaryCategory, value: product ? f.categories[CATEGORY_OF[product]] : null, step: 0 },
        { label: f.summaryQuantity, value: validQuantity(quantity) ? quantity.trim() : null, step: 1 },
        ...(snapshot?.colorName ? [{ label: f.summaryColor, value: snapshot.colorName, step: 2 }] : []),
        ...(snapshot?.options ?? []).map((o) => ({ label: o.label, value: o.name, step: 2 })),
        ...(other ? [] : [{ label: f.summarySides, value: sides.length ? sides.join(", ") : f.summaryNone, step: 2 }]),
        ...(snapshot && snapshot.layers.length ? [{ label: f.summaryElements, value: snapshot.layers.map((l) => l.name).join("\n"), step: 2 }] : []),
        ...(notes.trim() ? [{ label: f.summaryNotes, value: notes.trim(), step: 1 }] : []),
      ]}
      todo={[
        { label: f.todo.product, done: product !== null || other },
        ...(other ? [] : [{ label: f.todo.quantity, done: validQuantity(quantity) }, { label: f.todo.design, done: (snapshot?.layers.length ?? 0) > 0 }]),
        { label: f.todo.send, done: false },
      ]}
      onEdit={(index) => reachable(index) && go(index)}
      editLabel={f.edit}
      emptyLabel={f.summaryEmpty}
    />
  );

  const specTemplate = product ? SPECS_OF[product] : undefined;
  const stepTitles = [f.productTitle, f.configTitle, f.customizeTitle, f.previewTitle, f.quoteTitle];
  const stepLeads = [f.productLead, f.configLead, f.customizeLead, f.previewLead, other ? f.otherBody : f.quoteLead];

  return (
    <div ref={topRef} className="scroll-mt-24 pb-28 lg:pb-0">
      <Stepper f={f} step={step} reachable={reachable} completed={completed} onGo={go} />

      {notice ? (
        <div role="status" className="bg-accent-soft text-fg mt-4 flex items-start justify-between gap-3 rounded-[var(--radius-control)] px-4 py-3 text-sm">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label={f.edit} className="text-fg-muted hover:text-fg -m-2 inline-flex size-10 shrink-0 items-center justify-center">
            <CloseIcon width={16} height={16} />
          </button>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-9">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="type-display text-fg text-2xl sm:text-3xl" aria-live="polite">
                {stepTitles[step]}
              </h2>
              <p className="text-fg-muted mt-2 max-w-2xl leading-relaxed">{stepLeads[step]}</p>
            </div>
            {product && step !== 0 && step !== QUOTE_STEP ? (
              <ProductBadge product={product} name={name(product)} category={f.categories[CATEGORY_OF[product]]} />
            ) : null}
          </div>

          {/* ─── 1. Product ─── */}
          {step === 0 ? (
            <ProductStep
              products={products}
              config={config}
              f={f}
              name={name}
              selected={product}
              category={category}
              onCategory={setCategory}
              onChoose={choose}
              onOther={chooseOther}
            />
          ) : null}

          {/* ─── 2. Configuration ─── */}
          {step === 1 && product ? (
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <Field id={`${uid}-qty`} label={f.quantity} required hint={f.quantityHint} error={quantityError && !validQuantity(quantity) ? f.quantityError : undefined}>
                  {(p) => (
                    <Input
                      {...p}
                      inputMode="numeric"
                      dir="ltr"
                      maxLength={7}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value.replace(/[^\d]/g, ""))}
                      className="max-w-[12rem]"
                    />
                  )}
                </Field>
                <div className="-mt-3 flex flex-wrap gap-2" role="group" aria-label={f.quantity}>
                  {QUANTITY_PICKS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={quantity === String(n)}
                      onClick={() => {
                        setQuantity(String(n));
                        setQuantityError(false);
                      }}
                      className={cn(
                        "min-h-11 rounded-full border px-4 text-sm tabular-nums transition-colors",
                        quantity === String(n) ? "border-fg bg-fg text-bg font-semibold" : "border-line hover:border-fg",
                      )}
                    >
                      {n.toLocaleString("fr-FR")}
                    </button>
                  ))}
                </div>
                <Field id={`${uid}-notes`} label={f.notes2}>
                  {(p) => <Textarea {...p} rows={4} maxLength={2000} placeholder={f.notesPlaceholder} value={notes} onChange={(e) => setNotes(e.target.value)} />}
                </Field>
                {/* Only where a colour can really be picked on the preview (recolourable drawing or configured product). */}
                {canRecolor(product) || (config[product]?.views.length ?? 0) > 0 ? <p className="text-fg-muted text-sm">{f.colorNote}</p> : null}
              </div>
              {specTemplate ? (
                <div>
                  <h3 className="text-fg font-semibold">{f.specsTitle}</h3>
                  <dl className="border-fg mt-3 border-t-2">
                    {specs[specTemplate].map((spec) => (
                      <div key={spec.label} className="border-line grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 border-b py-2.5 text-sm">
                        <dt className="text-fg font-medium">{spec.label}</dt>
                        <dd className="text-fg-muted">{spec.hint}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* ─── 3 + 4. Customization and preview: one editor, mounted for the whole visit ─── */}
          {product ? (
            <div className={cn(step !== 2 && step !== 3 && "hidden")}>
              <div className="bg-surface border-line rounded-2xl border p-3 sm:p-5">
                <StudioEditor
                  key={instance}
                  products={products}
                  config={config}
                  t={t}
                  formId=""
                  selectedProduct={product}
                  hideProductPicker
                  mode={step === 3 ? "preview" : "edit"}
                  onSnapshot={setSnapshot}
                  controllerRef={controller}
                  restore={restore}
                />
              </div>
              {step === 3 ? (
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                  {snapshot && snapshot.layers.length === 0 ? <p className="text-fg-muted text-sm">{f.noDesign}</p> : null}
                  <button type="button" onClick={() => go(2)} className="text-accent inline-flex min-h-11 items-center text-sm font-semibold underline-offset-4 hover:underline">
                    {f.edit}
                  </button>
                </div>
              ) : null}
              <p className="text-fg-muted mt-3 text-xs">{t.disclaimer}</p>
            </div>
          ) : null}

          {/* ─── 5. Quote: the production request form, filled from the steps above ─── */}
          <div className={cn(step !== QUOTE_STEP && "hidden")}>
            <div className="border-line rounded-2xl border p-5 sm:p-8">
              <CustomRequestForm
                key={instance}
                {...form}
                onSubmitted={() => {
                  try {
                    sessionStorage.removeItem(STORAGE_KEY);
                  } catch {
                    // ignore
                  }
                }}
              />
            </div>
          </div>

          {/* Desktop actions (phones: the bar at the bottom of the screen). */}
          <StepActions
            className="mt-8 hidden lg:flex"
            f={f}
            step={step}
            busy={busy}
            onBack={() => go(other && step === QUOTE_STEP ? 0 : step - 1)}
            onNext={next}
            onRestart={restart}
          />
        </div>

        <aside className="xl:col-span-3">
          <div className="xl:sticky xl:top-28">{summary}</div>
        </aside>
      </div>

      {/* Phones and tablets: back / continue always within reach of the thumb. */}
      <div className="bg-bg/95 border-line fixed inset-x-0 bottom-0 z-30 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
        <StepActions f={f} step={step} busy={busy} onBack={() => go(other && step === QUOTE_STEP ? 0 : step - 1)} onNext={next} onRestart={restart} compact />
      </div>
    </div>
  );
}

function Stepper({
  f,
  step,
  reachable,
  completed,
  onGo,
}: {
  f: Dictionary["cx"]["studioFlow"];
  step: number;
  reachable: (index: number) => boolean;
  completed: (index: number) => boolean;
  onGo: (index: number) => void;
}) {
  return (
    <nav aria-label={f.progressLabel} className="border-line bg-bg rounded-[var(--radius-card)] border p-2 sm:p-3">
      {/* Phones: where you are and how far, in one line. */}
      <div className="flex items-center justify-between gap-3 px-2 sm:hidden">
        <p className="text-fg text-sm font-semibold">
          {format(f.stepOf, { n: step + 1, total: STEPS })} · {f.steps[step]}
        </p>
      </div>
      <div className="bg-surface mx-2 mt-2 h-1.5 overflow-hidden rounded-full sm:hidden" aria-hidden="true">
        <div className="bg-accent h-full rounded-full transition-[width] duration-300" style={{ width: `${((step + 1) / STEPS) * 100}%` }} />
      </div>
      <ol className="mt-2 grid grid-cols-5 gap-1 sm:mt-0 sm:gap-2">
        {f.steps.map((label, index) => {
          const current = index === step;
          const done = !current && completed(index);
          const enabled = reachable(index);
          return (
            <li key={label}>
              <button
                type="button"
                disabled={!enabled}
                onClick={() => onGo(index)}
                aria-current={current ? "step" : undefined}
                aria-label={`${label}${current ? ` (${f.current})` : done ? ` (${f.done})` : ""}`}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] px-1 py-2 text-sm transition-colors sm:justify-start sm:px-3",
                  current ? "bg-ink-900 text-white" : enabled ? "text-fg hover:bg-surface" : "text-fg-subtle cursor-not-allowed",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                    current ? "bg-white text-ink-900" : done ? "bg-accent text-white" : "border-line-strong border",
                  )}
                >
                  {done ? <CheckIcon width={14} height={14} strokeWidth={2.5} /> : index + 1}
                </span>
                <span className="hidden truncate font-medium sm:inline">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepActions({
  f,
  step,
  busy,
  onBack,
  onNext,
  onRestart,
  compact,
  className,
}: {
  f: Dictionary["cx"]["studioFlow"];
  step: number;
  busy: boolean;
  onBack: () => void;
  onNext: () => void;
  onRestart: () => void;
  compact?: boolean;
  className?: string;
}) {
  if (step === 0) return null;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Button variant="secondary" size={compact ? "md" : "lg"} onClick={onBack} className={compact ? "flex-1" : undefined}>
        <ArrowIcon width={16} height={16} aria-hidden="true" className="rotate-180 rtl:rotate-0" />
        {f.back}
      </Button>
      {step < QUOTE_STEP ? (
        <Button size={compact ? "md" : "lg"} onClick={onNext} disabled={busy} aria-disabled={busy} className={compact ? "flex-[2]" : undefined}>
          {busy ? f.preparing : step === 3 ? f.toQuote : f.next}
          {busy ? null : <ArrowIcon width={16} height={16} aria-hidden="true" className="rtl:-scale-x-100" />}
        </Button>
      ) : compact ? null : (
        <button type="button" onClick={onRestart} className="text-fg-muted hover:text-fg ms-auto inline-flex min-h-11 items-center text-sm underline-offset-4 hover:underline">
          {f.restart}
        </button>
      )}
    </div>
  );
}

function ProductBadge({ product, name, category }: { product: MockupKey; name: string; category: string }) {
  const Mockup = MOCKUPS[product];
  return (
    <div className="border-line flex items-center gap-3 rounded-[var(--radius-control)] border py-1.5 ps-1.5 pe-4">
      <span className="bg-paper-100 block w-14 overflow-hidden rounded-[0.5rem]">
        <span className="block mix-blend-multiply">
          <Mockup design={BLANK} color={DEFAULT_COLORS[product]} label="" className="pointer-events-none w-full" />
        </span>
      </span>
      <span className="leading-tight">
        <span className="text-fg block text-sm font-semibold">{name}</span>
        <span className="text-fg-muted block text-xs">{category}</span>
      </span>
    </div>
  );
}

function ProductStep({
  products,
  config,
  f,
  name,
  selected,
  category,
  onCategory,
  onChoose,
  onOther,
}: {
  products: MockupKey[];
  config: Partial<Record<string, StudioProductConfig>>;
  f: Dictionary["cx"]["studioFlow"];
  name: (key: MockupKey) => string;
  selected: MockupKey | null;
  category: Category | null;
  onCategory: (category: Category | null) => void;
  onChoose: (key: MockupKey) => void;
  onOther: () => void;
}) {
  // Only categories that have at least one active support.
  const present = CATEGORIES.filter((c) => products.some((p) => CATEGORY_OF[p] === c));
  const shown = category ? products.filter((p) => CATEGORY_OF[p] === category) : products;
  const chip = (active: boolean) =>
    cn(
      "inline-flex min-h-10 items-center rounded-full border px-3.5 text-sm whitespace-nowrap transition-colors",
      active ? "border-fg bg-fg text-bg font-semibold" : "border-line text-fg-muted hover:border-fg hover:text-fg",
    );
  return (
    <div>
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <ul className="flex gap-2">
          <li>
            <button type="button" aria-pressed={category === null} onClick={() => onCategory(null)} className={chip(category === null)}>
              {f.all}
            </button>
          </li>
          {present.map((c) => (
            <li key={c}>
              <button type="button" aria-pressed={category === c} onClick={() => onCategory(c)} className={chip(category === c)}>
                {f.categories[c]}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {shown.map((key) => {
          const Mockup = MOCKUPS[key];
          const isSelected = key === selected;
          const twoSides = editorViews(key, config).length > 1;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onChoose(key)}
                aria-pressed={isSelected}
                className={cn(
                  "group bg-bg focus-visible:ring-accent flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-card)] border text-start transition-[border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:outline-none active:scale-[0.99]",
                  isSelected ? "border-accent ring-accent ring-2" : "border-line hover:border-line-strong",
                )}
              >
                <span className="bg-paper-100 relative block aspect-[4/3] overflow-hidden">
                  <span className="absolute inset-0 grid place-items-center p-2 mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none">
                    <Mockup design={BLANK} color={DEFAULT_COLORS[key]} label="" className="pointer-events-none max-h-full w-full" />
                  </span>
                  {isSelected ? (
                    <span className="bg-accent absolute end-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.6875rem] font-semibold text-white">
                      <CheckIcon width={12} height={12} strokeWidth={2.5} aria-hidden="true" />
                      {f.selected}
                    </span>
                  ) : null}
                </span>
                <span className="flex flex-1 flex-col p-3 sm:p-4">
                  <span className="text-fg-subtle text-xs">{f.categories[CATEGORY_OF[key]]}</span>
                  <span className="text-fg mt-0.5 font-semibold leading-snug">{name(key)}</span>
                  <span className="text-accent mt-auto pt-2 text-xs font-medium">
                    {f.visual}
                    {twoSides ? ` · ${f.twoSides}` : ""}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onOther}
            className="border-line hover:border-fg flex h-full min-h-48 w-full flex-col justify-between rounded-[var(--radius-card)] border-2 border-dashed p-4 text-start transition-colors"
          >
            <span>
              <span className="text-fg block font-semibold">{f.otherTitle}</span>
              <span className="text-fg-muted mt-1.5 block text-sm leading-relaxed">{f.otherBody}</span>
            </span>
            <span className="text-accent mt-3 inline-flex items-center gap-1 text-sm font-semibold">
              {f.otherCta}
              <ArrowIcon width={14} height={14} aria-hidden="true" className="rtl:-scale-x-100" />
            </span>
          </button>
        </li>
      </ul>
    </div>
  );
}

type Row = { label: string; value: string | null; step: number };

function ProjectSummary({
  f,
  rows,
  todo,
  onEdit,
  editLabel,
  emptyLabel,
}: {
  f: Dictionary["cx"]["studioFlow"];
  rows: Row[];
  todo: Array<{ label: string; done: boolean }>;
  onEdit: (step: number) => void;
  editLabel: string;
  emptyLabel: string;
}): ReactNode {
  return (
    <section aria-labelledby="studio-summary" className="border-line bg-bg rounded-[var(--radius-card)] border p-4 sm:p-5">
      <h2 id="studio-summary" className="text-fg font-semibold">
        {f.summaryTitle}
      </h2>
      <dl className="mt-3 space-y-2.5 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="border-line border-b pb-2.5 last:border-0">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-fg-muted">{row.label}</dt>
              <button type="button" onClick={() => onEdit(row.step)} className="text-accent text-xs font-medium underline-offset-2 hover:underline">
                {editLabel}
                <span className="sr-only"> : {row.label}</span>
              </button>
            </div>
            <dd className={cn("mt-0.5 font-medium break-words whitespace-pre-line", row.value ? "text-fg" : "text-fg-subtle")}>
              <bdi>{row.value ?? emptyLabel}</bdi>
            </dd>
          </div>
        ))}
      </dl>
      <h3 className="text-fg mt-4 text-sm font-semibold">{f.remainingTitle}</h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        {todo.map((item) => (
          <li key={item.label} className={cn("flex items-center gap-2", item.done ? "text-fg-muted line-through" : "text-fg")}>
            <span aria-hidden="true" className={cn("grid size-4 shrink-0 place-items-center rounded-full border", item.done ? "bg-accent border-accent text-white" : "border-line-strong")}>
              {item.done ? <CheckIcon width={10} height={10} strokeWidth={3} /> : null}
            </span>
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
