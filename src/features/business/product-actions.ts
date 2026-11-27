"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { failure, fromZod, success, type AdminActionState } from "@/features/admin/action-state";
import { createSessionClient } from "@/lib/supabase/server";
import { fromRpc, notAllowed } from "./errors";
import { checkAttachment, uploadBusinessFile } from "./files";
import { centsToDecimal, milliToDecimal } from "./money";
import { authorize } from "./permissions";
import { formFields, movementSchema, productSchema } from "./schemas";

/** Products & stock (ADR-028): validate → authorize → RLS write / stock RPC → refresh. */

export async function saveProduct(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.products.manage"))) return notAllowed();
  const parsed = productSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  const image = await checkAttachment(formData.get("image"), { imagesOnly: true });
  if (typeof image === "string") return failure(image, { image });

  const trackStock = v.item_type === "service" ? false : v.track_stock;
  const row = {
    name: v.name,
    sku: v.sku,
    item_type: v.item_type,
    category_id: v.category_id,
    unit: v.unit,
    description: v.description,
    purchase_cost: v.purchase_cost === null ? null : Number(centsToDecimal(v.purchase_cost)),
    selling_price: v.selling_price === null ? null : Number(centsToDecimal(v.selling_price)),
    min_stock: v.min_stock === null || !trackStock ? null : Number(milliToDecimal(v.min_stock)),
    allow_negative: trackStock && v.allow_negative,
    catalog_product_id: v.catalog_product_id,
  };
  const db = await createSessionClient();

  let id = v.id;
  if (id) {
    const { error } = await db.from("business_products").update({ ...row, track_stock: trackStock }).eq("id", id);
    if (error) return fromRpc(error, "update product");
  } else {
    // Opening stock is posted as an 'initial' movement by the database (same transaction).
    const initial = trackStock && v.initial_quantity ? Number(milliToDecimal(v.initial_quantity)) : 0;
    if (initial > 0 && !(await authorize("business.stock.manage"))) return notAllowed();
    const { data, error } = await db.from("business_products").insert({ ...row, track_stock: trackStock, quantity_on_hand: initial }).select("id").single();
    if (error) return fromRpc(error, "create product");
    id = data.id;
  }

  if (image) {
    const path = await uploadBusinessFile("products", id, image);
    if (!path) return failure("Le téléversement a échoué.");
    const { error } = await db.from("business_products").update({ image_path: path }).eq("id", id);
    if (error) return fromRpc(error, "product image");
  }

  if (!v.id) redirect(`/admin/business/products/${id}?saved=1`);
  refresh();
  return success("Produit enregistré.");
}

const archiveSchema = z.object({ id: z.uuid(), archived: z.enum(["true", "false"]) });

export async function setProductArchived(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.products.manage"))) return notAllowed();
  const parsed = archiveSchema.safeParse(formFields(formData));
  if (!parsed.success) return failure("Requête invalide.");
  const archived = parsed.data.archived === "true";
  const { error } = await (await createSessionClient())
    .from("business_products")
    .update({ is_archived: archived, archived_at: archived ? new Date().toISOString() : null })
    .eq("id", parsed.data.id);
  if (error) return fromRpc(error, "archive product");
  refresh();
  return success(archived ? "Produit archivé." : "Produit réactivé.");
}

export async function recordMovement(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await authorize("business.stock.manage"))) return notAllowed();
  const fields = formFields(formData);
  const parsed = movementSchema.safeParse({ ...fields, client_key: fields.client_key || crypto.randomUUID() });
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  const { error } = await (await createSessionClient()).rpc("business_record_stock_movement", {
    p_product_id: v.product_id,
    p_type: v.movement_type,
    p_quantity: Number(milliToDecimal(v.quantity ?? 0)),
    p_reason: v.reason ?? undefined,
    p_occurred_at: v.occurred_at ?? undefined,
    p_unit_cost: v.unit_cost === null ? undefined : Number(centsToDecimal(v.unit_cost)),
    p_allow_negative: v.allow_negative,
    p_client_key: v.client_key,
  });
  if (error) return fromRpc(error, "stock movement");
  refresh();
  return success("Mouvement enregistré.");
}
