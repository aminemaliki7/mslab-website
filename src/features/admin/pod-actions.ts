"use server";

import { randomUUID } from "node:crypto";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isMockupKey } from "@/features/print-on-demand/mockup-keys";
import { MOCKUPS_TAG, PORTFOLIO_TAG, PRODUCTION_OPTIONS_TAG } from "@/features/print-on-demand/queries";
import { createSessionClient } from "@/lib/supabase/server";
import { CATALOG_BUCKET } from "@/lib/supabase/storage";
import { failure, fromDb, fromZod, success, type AdminActionState } from "./action-state";
import { requireAdmin } from "./auth";
import { validateImage } from "./image-upload";
import { FINISH_PRESETS, MATERIAL_PRESETS } from "./presets";

/**
 * Print on demand back office: production options (materials, finishes) and the portfolio
 * gallery. requireAdmin() → Zod → session client (RLS checks is_admin again) → updateTag.
 */

const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `${max} caractères maximum.` })
    .transform((v) => (v ? v : null));
const req = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, { error: min > 1 ? `${min} caractères minimum.` : "Champ requis." })
    .max(max, { error: `${max} caractères maximum.` });
const sortOrder = z.coerce.number({ error: "Nombre entier attendu." }).int().min(-100000).max(100000).catch(0);
const idSchema = z.uuid();

function readId(formData: FormData): string | null {
  const parsed = idSchema.safeParse(formData.get("id"));
  return parsed.success ? parsed.data : null;
}

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

// ─── Production options ──────────────────────────────────────────────────────

const optionSchema = z.object({
  kind: z.enum(["material", "finishing"], { error: "Type invalide." }),
  name_fr: req(1, 120),
  name_ar: opt(120),
  name_en: opt(120),
  sort_order: sortOrder,
  is_active: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

export async function saveProductionOption(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = optionSchema.safeParse({
    kind: formData.get("kind"),
    name_fr: text(formData, "name_fr"),
    name_ar: text(formData, "name_ar"),
    name_en: text(formData, "name_en"),
    sort_order: formData.get("sort_order"),
    is_active: formData.get("is_active"),
  });
  if (!parsed.success) return fromZod(parsed.error);
  const db = await createSessionClient();
  const id = readId(formData);
  const { error } = id
    ? await db.from("production_options").update(parsed.data).eq("id", id)
    : await db.from("production_options").insert(parsed.data);
  if (error) return fromDb(error, "save production option");
  updateTag(PRODUCTION_OPTIONS_TAG);
  refresh();
  return success(id ? "Option enregistrée." : "Option ajoutée.");
}

/**
 * Add several ready-made materials or finishes at once (ticked from the list). Names come from
 * features/admin/presets.ts — the browser only sends keys. Already-added names are skipped.
 */
export async function addPresetOptions(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const kind = z.enum(["material", "finishing"]).safeParse(formData.get("kind"));
  if (!kind.success) return failure("Requête invalide.");
  const presets = kind.data === "material" ? MATERIAL_PRESETS : FINISH_PRESETS;
  const keys = new Set(formData.getAll("preset").map(String));
  const chosen = presets.filter((p) => keys.has(p.key));
  if (chosen.length === 0) return failure("Cochez au moins un élément.");

  const db = await createSessionClient();
  const { data: existing } = await db.from("production_options").select("name_fr").eq("kind", kind.data);
  const taken = new Set((existing ?? []).map((o) => o.name_fr.toLowerCase()));
  const rows = chosen
    .filter((p) => !taken.has(p.names.fr.toLowerCase()))
    .map((p, index) => ({ kind: kind.data, name_fr: p.names.fr, name_ar: p.names.ar, name_en: p.names.en, sort_order: (existing?.length ?? 0) + index, is_active: true }));
  if (rows.length > 0) {
    const { error } = await db.from("production_options").insert(rows);
    if (error) return fromDb(error, "add preset options");
  }
  updateTag(PRODUCTION_OPTIONS_TAG);
  refresh();
  return success("Options ajoutées.");
}

export async function toggleProductionOption(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const id = readId(formData);
  if (!id) return failure("Requête invalide.");
  const active = formData.get("is_active") === "true";
  const { error } = await (await createSessionClient()).from("production_options").update({ is_active: active }).eq("id", id);
  if (error) return fromDb(error, "toggle production option");
  updateTag(PRODUCTION_OPTIONS_TAG);
  refresh();
  return success(active ? "Option affichée." : "Option masquée.");
}

export async function deleteProductionOption(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const id = readId(formData);
  if (!id) return failure("Requête invalide.");
  // Past requests keep the option's name (snapshot), so deleting is safe.
  const { error } = await (await createSessionClient()).from("production_options").delete().eq("id", id);
  if (error) return fromDb(error, "delete production option");
  updateTag(PRODUCTION_OPTIONS_TAG);
  refresh();
  return success("Option supprimée.");
}

// ─── Portfolio ───────────────────────────────────────────────────────────────

const portfolioSchema = z.object({
  title_fr: req(2, 160),
  title_ar: opt(160),
  title_en: opt(160),
  caption_fr: opt(500),
  caption_ar: opt(500),
  caption_en: opt(500),
  status: z.enum(["draft", "published", "archived"]).catch("draft"),
  sort_order: sortOrder,
});

export async function savePortfolioItem(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = portfolioSchema.safeParse(
    Object.fromEntries(["title_fr", "title_ar", "title_en", "caption_fr", "caption_ar", "caption_en", "status", "sort_order"].map((k) => [k, text(formData, k)])),
  );
  if (!parsed.success) return fromZod(parsed.error);

  const db = await createSessionClient();
  const id = readId(formData);
  const file = formData.get("file");
  const hasFile = file instanceof File && file.size > 0;

  // A published item must have a photo (the gallery shows real work only).
  let imagePath: string | null = null;
  if (hasFile) {
    const image = await validateImage(file);
    if (typeof image === "string") return failure(image, { file: image });
    imagePath = `portfolio/${randomUUID()}.${image.extension}`;
    const { error: uploadError } = await db.storage
      .from(CATALOG_BUCKET)
      .upload(imagePath, image.bytes, { contentType: image.type, upsert: false, cacheControl: "31536000" });
    if (uploadError) {
      console.error("[admin] portfolio upload failed", uploadError.message);
      return failure("Le téléversement a échoué.");
    }
  }

  let previousImage: string | null = null;
  if (id) {
    const { data: current } = await db.from("portfolio_items").select("image_path").eq("id", id).maybeSingle();
    previousImage = current?.image_path ?? null;
  }
  if (parsed.data.status === "published" && !imagePath && !previousImage) {
    return failure("Ajoutez une photo avant de publier.", { file: "Photo requise pour publier." });
  }

  const row = { ...parsed.data, ...(imagePath ? { image_path: imagePath } : {}) };
  if (id) {
    const { error } = await db.from("portfolio_items").update(row).eq("id", id);
    if (error) {
      if (imagePath) await db.storage.from(CATALOG_BUCKET).remove([imagePath]);
      return fromDb(error, "update portfolio item");
    }
    if (imagePath && previousImage) await db.storage.from(CATALOG_BUCKET).remove([previousImage]);
    updateTag(PORTFOLIO_TAG);
    refresh();
    return success("Réalisation enregistrée.");
  }

  const { data, error } = await db.from("portfolio_items").insert(row).select("id").single();
  if (error) {
    if (imagePath) await db.storage.from(CATALOG_BUCKET).remove([imagePath]);
    return fromDb(error, "insert portfolio item");
  }
  updateTag(PORTFOLIO_TAG);
  redirect(`/admin/print-on-demand/portfolio/${data.id}?created=1`);
}

export async function deletePortfolioItem(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const id = readId(formData);
  if (!id) return failure("Requête invalide.");
  const db = await createSessionClient();
  const { data: current } = await db.from("portfolio_items").select("image_path").eq("id", id).maybeSingle();
  const { error } = await db.from("portfolio_items").delete().eq("id", id);
  if (error) return fromDb(error, "delete portfolio item");
  if (current?.image_path) await db.storage.from(CATALOG_BUCKET).remove([current.image_path]);
  updateTag(PORTFOLIO_TAG);
  redirect("/admin/print-on-demand");
}

// ─── Mockup studio products ──────────────────────────────────────────────────

export async function toggleMockupProduct(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const key = String(formData.get("key") ?? "");
  if (!isMockupKey(key)) return failure("Requête invalide.");
  const active = formData.get("is_active") === "true";
  const { error } = await (await createSessionClient()).from("mockup_products").update({ is_active: active }).eq("key", key);
  if (error) return fromDb(error, "toggle mockup product");
  updateTag(MOCKUPS_TAG);
  refresh();
  return success(active ? "Produit affiché." : "Produit masqué.");
}
