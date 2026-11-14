import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Locale } from "@/i18n/config";
import { pick, slugFor } from "@/i18n/localize";
import { createPublicClient } from "@/lib/supabase/public";
import { catalogImageUrl } from "@/lib/supabase/storage";

export const SERVICES_TAG = "services";

export type ServiceSummary = {
  id: string;
  name: string;
  slug: string;
  slugs: { fr: string; ar: string | null; en: string | null };
  summary: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
};

export type ServiceDetail = ServiceSummary & { description: string | null; updatedAt: string };

const COLUMNS =
  "id, name_fr, name_ar, name_en, slug_fr, slug_ar, slug_en, summary_fr, summary_ar, summary_en, " +
  "description_fr, description_ar, description_en, image_path, is_featured, sort_order, updated_at";

type ServiceRow = {
  id: string;
  name_fr: string;
  name_ar: string | null;
  name_en: string | null;
  slug_fr: string;
  slug_ar: string | null;
  slug_en: string | null;
  summary_fr: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  description_fr: string | null;
  description_ar: string | null;
  description_en: string | null;
  image_path: string | null;
  is_featured: boolean;
  updated_at: string;
};

function toDetail(row: ServiceRow, locale: Locale): ServiceDetail {
  return {
    id: row.id,
    name: pick(row, "name", locale) ?? row.name_fr,
    slug: slugFor(row, locale),
    slugs: { fr: row.slug_fr, ar: row.slug_ar, en: row.slug_en },
    summary: pick(row, "summary", locale),
    description: pick(row, "description", locale),
    imageUrl: row.image_path ? catalogImageUrl(row.image_path) : null,
    isFeatured: row.is_featured,
    updatedAt: row.updated_at,
  };
}

/** Published services (RLS hides drafts/archived). */
export async function listServices(locale: Locale, options: { featuredOnly?: boolean } = {}): Promise<ServiceSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(SERVICES_TAG);

  let request = createPublicClient().from("services").select(COLUMNS).eq("status", "published");
  if (options.featuredOnly) request = request.eq("is_featured", true);
  const { data, error } = await request.order("sort_order").order("name_fr");
  if (error) throw new Error(`[services] listServices: ${error.code}`);
  return (data as unknown as ServiceRow[]).map((row) => toDetail(row, locale));
}

export async function getServiceBySlug(locale: Locale, slug: string): Promise<ServiceDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(SERVICES_TAG);

  const column = locale === "fr" ? "slug_fr" : locale === "ar" ? "slug_ar" : "slug_en";
  const client = createPublicClient();
  let { data, error } = await client.from("services").select(COLUMNS).eq("status", "published").eq(column, slug).maybeSingle();
  if (!error && !data && locale !== "fr") {
    ({ data, error } = await client.from("services").select(COLUMNS).eq("status", "published").eq("slug_fr", slug).maybeSingle());
  }
  if (error) throw new Error(`[services] getServiceBySlug: ${error.code}`);
  return data ? toDetail(data as unknown as ServiceRow, locale) : null;
}
