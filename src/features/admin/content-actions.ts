"use server";

import { randomUUID } from "node:crypto";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CATALOG_TAG } from "@/features/catalog/queries";
import { SERVICES_TAG } from "@/features/services/queries";
import type { Json } from "@/lib/supabase/database.types";
import { createSessionClient } from "@/lib/supabase/server";
import { CATALOG_BUCKET, isSiteImage } from "@/lib/supabase/storage";
import { failure, fromDb, fromZod, success, type AdminActionState } from "./action-state";
import { requireAdmin } from "./auth";
import { categorySchema, formToObject, productSchema, serviceSchema } from "./content-schemas";
import { validateImage } from "./image-upload";

/**
 * Catalog & services mutations. Every action: requireAdmin() → Zod → write with the
 * session-bound client (RLS enforces is_admin again) → updateTag for public caches → refresh.
 */

const idSchema = z.uuid();

function readId(formData: FormData): string | null {
  const parsed = idSchema.safeParse(formData.get("id"));
  return parsed.success ? parsed.data : null;
}

function invalidateCatalog() {
  updateTag(CATALOG_TAG);
  refresh();
}

function invalidateServices() {
  updateTag(SERVICES_TAG);
  refresh();
}

// ─── Products ───────────────────────────────────────────────────────────────

export async function saveProduct(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const parsed = productSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { specifications, ...fields } = parsed.data as Record<string, unknown> & { specifications: Json };
  const row = { ...fields, specifications } as never;

  const db = await createSessionClient();
  const id = readId(formData);
  if (id) {
    const { error } = await db.from("products").update(row).eq("id", id);
    if (error) return fromDb(error, "update product");
    invalidateCatalog();
    return success("Produit enregistré.");
  }

  const { data, error } = await db
    .from("products")
    .insert({ ...(row as object), created_by: admin.id } as never)
    .select("id")
    .single();
  if (error) return fromDb(error, "insert product");
  updateTag(CATALOG_TAG);
  redirect(`/admin/products/${data.id}?created=1`);
}

export async function setProductStatus(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const id = readId(formData);
  const status = z.enum(["draft", "published", "archived"]).safeParse(formData.get("status"));
  if (!id || !status.success) return failure("Requête invalide.");
  const { error } = await (await createSessionClient()).from("products").update({ status: status.data }).eq("id", id);
  if (error) return fromDb(error, "product status");
  invalidateCatalog();
  return success("Statut mis à jour.");
}

export async function setProductFeatured(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const id = readId(formData);
  if (!id) return failure("Requête invalide.");
  const featured = formData.get("featured") === "true";
  const { error } = await (await createSessionClient()).from("products").update({ is_featured: featured }).eq("id", id);
  if (error) return fromDb(error, "product featured");
  invalidateCatalog();
  return success(featured ? "Produit mis en avant." : "Produit retiré de la une.");
}

export async function deleteProduct(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const id = readId(formData);
  if (!id) return failure("Requête invalide.");
  const db = await createSessionClient();

  const { data: images } = await db.from("product_images").select("storage_path").eq("product_id", id);
  // Quote history is preserved: quotation_items keep their name/SKU snapshots (product_id → null).
  const { error } = await db.from("products").delete().eq("id", id);
  if (error) return fromDb(error, "delete product");

  // Site images (public/catalog) are files of the site, not bucket objects: nothing to remove.
  const paths = (images ?? []).map((i) => i.storage_path).filter((p) => !isSiteImage(p));
  if (paths.length) {
    const { error: storageError } = await db.storage.from(CATALOG_BUCKET).remove(paths);
    if (storageError) console.error("[admin] orphan images after product delete", id, storageError.message);
  }
  updateTag(CATALOG_TAG);
  redirect("/admin/products?deleted=1");
}

// ─── Product images ─────────────────────────────────────────────────────────

export async function uploadProductImage(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const productId = readId(formData);
  if (!productId) return failure("Produit introuvable.");
  const image = await validateImage(formData.get("file"));
  if (typeof image === "string") return failure(image, { file: image });

  const alt = (key: string) => {
    const value = String(formData.get(key) ?? "").trim().slice(0, 250);
    return value || null;
  };

  const db = await createSessionClient();
  const path = `products/${productId}/${randomUUID()}.${image.extension}`;
  const { error: uploadError } = await db.storage
    .from(CATALOG_BUCKET)
    .upload(path, image.bytes, { contentType: image.type, upsert: false, cacheControl: "31536000" });
  if (uploadError) {
    console.error("[admin] image upload failed", uploadError.message);
    return failure("Le téléversement a échoué.");
  }

  const { count } = await db.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId);
  const { error } = await db.from("product_images").insert({
    product_id: productId,
    storage_path: path,
    alt_fr: alt("alt_fr"),
    alt_ar: alt("alt_ar"),
    alt_en: alt("alt_en"),
    sort_order: count ?? 0,
    is_primary: (count ?? 0) === 0,
  });
  if (error) {
    await db.storage.from(CATALOG_BUCKET).remove([path]);
    return fromDb(error, "insert image");
  }
  invalidateCatalog();
  return success("Image ajoutée.");
}

export async function setPrimaryImage(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const id = readId(formData);
  const productId = idSchema.safeParse(formData.get("productId"));
  if (!id || !productId.success) return failure("Requête invalide.");
  const db = await createSessionClient();
  // Two steps because of the "one primary per product" unique index.
  const reset = await db.from("product_images").update({ is_primary: false }).eq("product_id", productId.data);
  if (reset.error) return fromDb(reset.error, "reset primary");
  const { error } = await db.from("product_images").update({ is_primary: true }).eq("id", id).eq("product_id", productId.data);
  if (error) return fromDb(error, "set primary");
  invalidateCatalog();
  return success("Image principale modifiée.");
}

export async function deleteProductImage(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const id = readId(formData);
  if (!id) return failure("Requête invalide.");
  const db = await createSessionClient();
  const { data: image, error } = await db.from("product_images").delete().eq("id", id).select("storage_path, product_id, is_primary").single();
  if (error) return fromDb(error, "delete image");
  if (!isSiteImage(image.storage_path)) {
    const { error: storageError } = await db.storage.from(CATALOG_BUCKET).remove([image.storage_path]);
    if (storageError) console.error("[admin] orphan image", image.storage_path, storageError.message);
  }

  if (image.is_primary) {
    // Promote the next image so the product keeps a main image.
    const { data: next } = await db.from("product_images").select("id").eq("product_id", image.product_id).order("sort_order").limit(1).maybeSingle();
    if (next) await db.from("product_images").update({ is_primary: true }).eq("id", next.id);
  }
  invalidateCatalog();
  return success("Image supprimée.");
}

// ─── Categories ─────────────────────────────────────────────────────────────

export async function saveCategory(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(formToObject(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const row = parsed.data as never;
  const db = await createSessionClient();
  const id = readId(formData);

  if (id) {
    if ((parsed.data as { parent_id: string | null }).parent_id === id) {
      return failure("Une catégorie ne peut pas être son propre parent.", { parent_id: "Choix invalide." });
    }
    const { error } = await db.from("categories").update(row).eq("id", id);
    if (error) return fromDb(error, "update category");
    invalidateCatalog();
    return success("Catégorie enregistrée.");
  }

  const { data, error } = await db.from("categories").insert(row).select("id").single();
  if (error) return fromDb(error, "insert category");
  updateTag(CATALOG_TAG);
  redirect(`/admin/categories/${data.id}?created=1`);
}

export async function deleteCategory(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const id = readId(formData);
  if (!id) return failure("Requête invalide.");
  const db = await createSessionClient();
  const { count } = await db.from("categories").select("id", { count: "exact", head: true }).eq("parent_id", id);
  if (count) return failure("Supprimez ou déplacez d'abord les sous-catégories.");
  // Products of this category become uncategorized (ON DELETE SET NULL) — announced in the UI.
  const { error } = await db.from("categories").delete().eq("id", id);
  if (error) return fromDb(error, "delete category");
  updateTag(CATALOG_TAG);
  redirect("/admin/categories?deleted=1");
}

// ─── Services ───────────────────────────────────────────────────────────────

export async function saveService(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = serviceSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const row = parsed.data as never;
  const db = await createSessionClient();
  const id = readId(formData);

  if (id) {
    const { error } = await db.from("services").update(row).eq("id", id);
    if (error) return fromDb(error, "update service");
    invalidateServices();
    return success("Service enregistré.");
  }
  const { data, error } = await db.from("services").insert(row).select("id").single();
  if (error) return fromDb(error, "insert service");
  updateTag(SERVICES_TAG);
  redirect(`/admin/services/${data.id}?created=1`);
}

export async function setServiceStatus(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const id = readId(formData);
  const status = z.enum(["draft", "published", "archived"]).safeParse(formData.get("status"));
  if (!id || !status.success) return failure("Requête invalide.");
  const { error } = await (await createSessionClient()).from("services").update({ status: status.data }).eq("id", id);
  if (error) return fromDb(error, "service status");
  invalidateServices();
  return success("Statut mis à jour.");
}

export async function deleteService(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const id = readId(formData);
  if (!id) return failure("Requête invalide.");
  const { error } = await (await createSessionClient()).from("services").delete().eq("id", id);
  if (error) return fromDb(error, "delete service");
  updateTag(SERVICES_TAG);
  redirect("/admin/services?deleted=1");
}
