import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Locale } from "@/i18n/config";
import type { Database } from "@/lib/supabase/database.types";
import { createPublicClient } from "@/lib/supabase/public";
import { catalogImageUrl } from "@/lib/supabase/storage";
import { isMockupKey, type MockupKey } from "./mockup-keys";

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
