import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Locale } from "@/i18n/config";
import type { Database } from "@/lib/supabase/database.types";
import { createPublicClient } from "@/lib/supabase/public";
import { catalogImageUrl } from "@/lib/supabase/storage";
import { isMockupKey, type MockupKey } from "./mockup-keys";
import {
  OPTION_KINDS,
  VIEW_KEYS,
  emptyOptions,
  isStudioProduct,
  type OptionKind as StudioOptionKind,
  type StudioProductConfig,
  type StudioProductKey,
  type StudioView,
  type ViewKey,
} from "./studio";


export const PRODUCTION_OPTIONS_TAG = "production-options";
export const PORTFOLIO_TAG = "portfolio";
export const MOCKUPS_TAG = "mockups";

type OptionKind = Database["public"]["Enums"]["production_option_kind"];
export type ProductionOption = { id: string; kind: OptionKind; name: string };
export type PortfolioItem = { id: string; title: string; caption: string | null; imageUrl: string | null };

function localized<T extends Record<string, unknown>>(row: T, base: string, locale: Locale): string | null {
  const value = row[`${base}_${locale}`] ?? row[`${base}_fr`];
  return typeof value === "string" && value.trim() ? value : null;
}

/** Active materials and finishes offered in the request form (managed in /admin/print-on-demand). */
export async function listProductionOptions(locale: Locale): Promise<ProductionOption[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTION_OPTIONS_TAG);
  const { data, error } = await createPublicClient()
    .from("production_options")
    .select("id, kind, name_fr, name_ar, name_en")
    .eq("is_active", true)
    .order("sort_order")
    .order("name_fr");
  if (error) throw new Error(`[print-on-demand] listProductionOptions: ${error.code}`);
  return (data ?? []).map((row) => ({ id: row.id, kind: row.kind, name: localized(row, "name", locale) ?? row.name_fr }));
}

/** Published portfolio items (gallery of products MSLAB has made). */
export async function listPortfolio(locale: Locale): Promise<PortfolioItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(PORTFOLIO_TAG);
  const { data, error } = await createPublicClient()
    .from("portfolio_items")
    .select("id, title_fr, title_ar, title_en, caption_fr, caption_ar, caption_en, image_path")
    .eq("status", "published")
    .order("sort_order")
    .order("created_at", { ascending: false })
    .limit(24);
  if (error) throw new Error(`[print-on-demand] listPortfolio: ${error.code}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    title: localized(row, "title", locale) ?? row.title_fr,
    caption: localized(row, "caption", locale),
    imageUrl: row.image_path ? catalogImageUrl(row.image_path) : null,
  }));
}

/** Products shown in the mockup studio, in admin order (all off → the studio is hidden). */
export async function listMockupProducts(): Promise<MockupKey[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(MOCKUPS_TAG);
  const { data, error } = await createPublicClient()
    .from("mockup_products")
    .select("key")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(`[print-on-demand] listMockupProducts: ${error.code}`);
  return (data ?? []).map((row) => row.key).filter(isMockupKey);
}

// ─── Studio configuration (ADR-026) ─────────────────────────────────────────

export const STUDIO_TAG = "studio";

type StudioViewRow = {
  product_key: string;
  view: string;
  image_path: string;
  image_width: number;
  image_height: number;
  mask_path: string | null;
  displacement_path: string | null;
  area_x: number;
  area_y: number;
  area_w: number;
  area_h: number;
  print_width_mm: number | string | null;
  print_height_mm: number | string | null;
};
type StudioOptionRow = { id: string; product_key: string; kind: string; name_fr: string; name_ar: string | null; name_en: string | null; hex: string | null };

/**
 * Verified Studio configuration entered by MSLAB, per product. A product without an active
 * view is absent: the Studio then shows its placeholder visual and no specification.
 * The tables come from migration 20261118150000; until it is applied this returns {}.
 */
export async function getStudioConfig(locale: Locale): Promise<Partial<Record<StudioProductKey, StudioProductConfig>>> {
  "use cache";
  cacheTag(STUDIO_TAG);
  const db = createPublicClient();
  const [products, views, options] = await Promise.all([
    db.from("studio_products").select("key, min_dpi"),
    db.from("studio_views").select("*").eq("is_active", true).order("sort_order"),
    db.from("studio_options").select("id, product_key, kind, name_fr, name_ar, name_en, hex").eq("is_active", true).order("sort_order").order("name_fr"),
  ]);
  // Hours in both cases: a short cache would make the page dynamic. Saving the configuration in
  // the admin calls updateTag(STUDIO_TAG), so new data shows immediately anyway.
  cacheLife("hours");
  if (products.error || views.error || options.error) {
    // PGRST205 = tables missing: migration 20261118150000 not applied yet → placeholders.
    console.warn("[studio] configuration unavailable", products.error?.code ?? views.error?.code ?? options.error?.code);
    return {};
  }

  const result: Partial<Record<StudioProductKey, StudioProductConfig>> = {};
  for (const product of (products.data ?? []) as Array<{ key: string; min_dpi: number | null }>) {
    if (!isStudioProduct(product.key)) continue;
    const productViews: StudioView[] = ((views.data ?? []) as StudioViewRow[])
      .filter((v) => v.product_key === product.key && (VIEW_KEYS as readonly string[]).includes(v.view))
      .map((v) => {
        const pw = v.print_width_mm === null ? null : Number(v.print_width_mm);
        const ph = v.print_height_mm === null ? null : Number(v.print_height_mm);
        return {
          key: v.view as ViewKey,
          src: catalogImageUrl(v.image_path),
          width: v.image_width,
          height: v.image_height,
          area: { x: v.area_x, y: v.area_y, w: v.area_w, h: v.area_h },
          mask: v.mask_path ? catalogImageUrl(v.mask_path) : null,
          displacement: v.displacement_path ? catalogImageUrl(v.displacement_path) : null,
          printMm: pw && ph ? { w: pw, h: ph } : null,
        };
      });
    if (productViews.length === 0) continue;
    const productOptions = emptyOptions();
    for (const o of (options.data ?? []) as StudioOptionRow[]) {
      if (o.product_key !== product.key || !(OPTION_KINDS as readonly string[]).includes(o.kind)) continue;
      const kind = o.kind as StudioOptionKind;
      productOptions[kind].push({ id: o.id, kind, name: localized(o, "name", locale) ?? o.name_fr, hex: o.hex });
    }
    result[product.key] = { key: product.key, views: productViews, options: productOptions, minDpi: product.min_dpi };
  }
  return result;
}
