"use server";

import { randomUUID } from "node:crypto";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { sniffFile } from "@/features/print-on-demand/file-sniff";
import { STUDIO_TAG } from "@/features/print-on-demand/queries";
import { OPTION_KINDS, VIEW_KEYS, isStudioProduct } from "@/features/print-on-demand/studio";
import { createSessionClient } from "@/lib/supabase/server";
import { CATALOG_BUCKET } from "@/lib/supabase/storage";
import { failure, fromDb, fromZod, success, type AdminActionState } from "./action-state";
import { requireAdmin } from "./auth";
import { MAX_IMAGE_BYTES } from "./image-upload";

/**
 * MSLAB Studio configuration (ADR-026): photos of MSLAB's own products per printable side,
 * printable areas and the verified options (colours, sizes, materials, techniques).
 * requireAdmin() → Zod → session client (RLS re-checks is_admin) → updateTag(STUDIO_TAG).
 */

const db = createSessionClient;
type Client = Awaited<ReturnType<typeof createSessionClient>>;

const int = (min: number, max: number) => z.coerce.number({ error: "Nombre entier attendu." }).int({ error: "Nombre entier attendu." }).min(min).max(max);
const optionalMm = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (!v) return null;
    const n = Number(v.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0 || n > 5000) {
      ctx.addIssue({ code: "custom", message: "Valeur en mm entre 0 et 5000." });
      return z.NEVER;
    }
    return Math.round(n * 10) / 10;
  });
const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `${max} caractères maximum.` })
    .transform((v) => (v ? v : null));
const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

function readKey(formData: FormData) {
  const key = text(formData, "product_key");
  return isStudioProduct(key) ? key : null;
}

/** Studio images: PNG, JPEG or WebP (type and pixel size read from the bytes), 5 MB max. */
async function readStudioImage(value: FormDataEntryValue | null): Promise<{ bytes: Uint8Array; type: string; ext: string; width: number; height: number } | string | null> {
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > MAX_IMAGE_BYTES) return "Image trop lourde (5 Mo maximum).";
  const bytes = new Uint8Array(await value.arrayBuffer());
  const sniffed = sniffFile(bytes);
  const ext = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[sniffed.mime ?? ""];
  if (!ext || !sniffed.width || !sniffed.height) return "Format non pris en charge (JPEG, PNG ou WebP).";
  return { bytes, type: sniffed.mime!, ext, width: sniffed.width, height: sniffed.height };
}

async function upload(client: Client, image: { bytes: Uint8Array; type: string; ext: string }): Promise<string | null> {
  const path = `studio/${randomUUID()}.${image.ext}`;
  const { error } = await client.storage.from(CATALOG_BUCKET).upload(path, image.bytes, { contentType: image.type, upsert: false, cacheControl: "31536000" });
  if (error) {
    console.error("[admin] studio upload failed", error.message);
    return null;
  }
  return path;
}

export async function saveStudioProduct(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const key = readKey(formData);
  if (!key) return failure("Requête invalide.");
  const raw = text(formData, "min_dpi").trim();
  const parsed = raw ? int(72, 1200).safeParse(raw) : { success: true as const, data: null };
  if (!parsed.success) return failure("Le formulaire contient des erreurs.", { min_dpi: "Entre 72 et 1200." });
  const { error } = await (await db()).from("studio_products").update({ min_dpi: parsed.data }).eq("key", key);
  if (error) return fromDb(error, "save studio product");
  updateTag(STUDIO_TAG);
  refresh();
  return success("Paramètres enregistrés.");
}

const viewSchema = z.object({
  view: z.enum(VIEW_KEYS, { error: "Face invalide." }),
  area_x: int(0, 10000),
  area_y: int(0, 10000),
  area_w: int(1, 10000),
  area_h: int(1, 10000),
  print_width_mm: optionalMm,
  print_height_mm: optionalMm,
  sort_order: int(-100000, 100000).catch(0),
  is_active: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

/** Create or update one printable side: photo (+ optional mask / relief map) and print area. */
export async function saveStudioView(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const key = readKey(formData);
  if (!key) return failure("Requête invalide.");
  const parsed = viewSchema.safeParse(
    Object.fromEntries(["view", "area_x", "area_y", "area_w", "area_h", "print_width_mm", "print_height_mm", "sort_order", "is_active"].map((k) => [k, formData.get(k) ?? ""])),
  );
  if (!parsed.success) return fromZod(parsed.error);
  const data = parsed.data;
  if ((data.print_width_mm === null) !== (data.print_height_mm === null)) {
    return failure("Le formulaire contient des erreurs.", { print_height_mm: "Indiquez la largeur et la hauteur, ou aucune des deux." });
  }

  const idParsed = z.uuid().safeParse(formData.get("id"));
  const id = idParsed.success ? idParsed.data : null;
  const client = await db();

  const photo = await readStudioImage(formData.get("image"));
  const mask = await readStudioImage(formData.get("mask"));
  const relief = await readStudioImage(formData.get("displacement"));
  for (const [name, value] of [["image", photo], ["mask", mask], ["displacement", relief]] as const) {
    if (typeof value === "string") return failure(value, { [name]: value });
  }

  let current: { image_path: string; image_width: number; image_height: number; mask_path: string | null; displacement_path: string | null } | null = null;
  if (id) {
    const { data: row } = await client.from("studio_views").select("image_path, image_width, image_height, mask_path, displacement_path").eq("id", id).maybeSingle();
    current = row;
    if (!current) return failure("Face introuvable.");
  } else if (!photo || typeof photo === "string") {
    return failure("Ajoutez la photo du produit.", { image: "Photo requise." });
  }

  const imageWidth = photo && typeof photo !== "string" ? photo.width : current!.image_width;
  const imageHeight = photo && typeof photo !== "string" ? photo.height : current!.image_height;
  if (data.area_x + data.area_w > imageWidth || data.area_y + data.area_h > imageHeight) {
    return failure(`La zone d'impression dépasse la photo (${imageWidth} × ${imageHeight} px).`, { area_w: `Photo de ${imageWidth} × ${imageHeight} px.` });
  }
  for (const [name, value] of [["mask", mask], ["displacement", relief]] as const) {
    if (value && typeof value !== "string" && (value.width !== imageWidth || value.height !== imageHeight)) {
      return failure("Le masque et la carte de relief doivent avoir la taille exacte de la photo.", { [name]: `${imageWidth} × ${imageHeight} px attendus.` });
    }
  }

  const uploaded: string[] = [];
  const store = async (value: typeof photo) => {
    if (!value || typeof value === "string") return null;
    const path = await upload(client, value);
    if (path) uploaded.push(path);
    return path;
  };
  const imagePath = await store(photo);
  const maskPath = await store(mask);
  const reliefPath = await store(relief);
  if ((photo && !imagePath) || (mask && !maskPath) || (relief && !reliefPath)) {
    if (uploaded.length) await client.storage.from(CATALOG_BUCKET).remove(uploaded);
    return failure("Le téléversement a échoué.");
  }

  const removeMask = formData.get("remove_mask") === "on";
  const removeRelief = formData.get("remove_displacement") === "on";
  const row = {
    product_key: key,
    ...data,
    image_width: imageWidth,
    image_height: imageHeight,
    ...(imagePath ? { image_path: imagePath } : {}),
    ...(maskPath ? { mask_path: maskPath } : removeMask ? { mask_path: null } : {}),
    ...(reliefPath ? { displacement_path: reliefPath } : removeRelief ? { displacement_path: null } : {}),
  };

  const { error } = id ? await client.from("studio_views").update(row).eq("id", id) : await client.from("studio_views").insert({ ...row, image_path: imagePath! /* required on create (checked above) */ });
  if (error) {
    if (uploaded.length) await client.storage.from(CATALOG_BUCKET).remove(uploaded);
    if (error.code === "23505") return failure("Cette face existe déjà pour ce produit.", { view: "Face déjà configurée." });
    return fromDb(error, "save studio view");
  }
  // Replaced files are removed once the row points to the new ones.
  const replaced = [
    imagePath && current?.image_path,
    (maskPath || removeMask) && current?.mask_path,
    (reliefPath || removeRelief) && current?.displacement_path,
  ].filter((p): p is string => Boolean(p));
  if (replaced.length) await client.storage.from(CATALOG_BUCKET).remove(replaced);

  updateTag(STUDIO_TAG);
  refresh();
  return success(id ? "Face enregistrée." : "Face ajoutée.");
}

export async function deleteStudioView(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = z.uuid().safeParse(formData.get("id"));
  if (!parsed.success) return failure("Requête invalide.");
  const client = await db();
  const { data: row } = await client.from("studio_views").select("image_path, mask_path, displacement_path").eq("id", parsed.data).maybeSingle();
  const { error } = await client.from("studio_views").delete().eq("id", parsed.data);
  if (error) return fromDb(error, "delete studio view");
  const files = [row?.image_path, row?.mask_path, row?.displacement_path].filter((p): p is string => Boolean(p));
  if (files.length) await client.storage.from(CATALOG_BUCKET).remove(files);
  updateTag(STUDIO_TAG);
  refresh();
  return success("Face supprimée.");
}

const optionSchema = z
  .object({
    kind: z.enum(OPTION_KINDS, { error: "Type invalide." }),
    name_fr: z.string().trim().min(1, { error: "Champ requis." }).max(120, { error: "120 caractères maximum." }),
    name_ar: opt(120),
    name_en: opt(120),
    hex: z
      .string()
      .trim()
      .transform((v) => (v ? v.toUpperCase() : null))
      .refine((v) => v === null || /^#[0-9A-F]{6}$/.test(v), { error: "Couleur au format #RRGGBB." }),
  })
  .refine((o) => (o.kind === "color") === (o.hex !== null), { error: "Une couleur doit avoir un code couleur.", path: ["hex"] });

export async function saveStudioOption(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const key = readKey(formData);
  if (!key) return failure("Requête invalide.");
  const parsed = optionSchema.safeParse(Object.fromEntries(["kind", "name_fr", "name_ar", "name_en", "hex"].map((k) => [k, text(formData, k)])));
  if (!parsed.success) return fromZod(parsed.error);
  const sort = Number(text(formData, "sort_order")) || 0;
  const { error } = await (await db()).from("studio_options").insert({ product_key: key, ...parsed.data, sort_order: sort, is_active: true });
  if (error) return fromDb(error, "save studio option");
  updateTag(STUDIO_TAG);
  refresh();
  return success("Option ajoutée.");
}

export async function toggleStudioOption(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = z.uuid().safeParse(formData.get("id"));
  if (!parsed.success) return failure("Requête invalide.");
  const active = formData.get("is_active") === "true";
  const { error } = await (await db()).from("studio_options").update({ is_active: active }).eq("id", parsed.data);
  if (error) return fromDb(error, "toggle studio option");
  updateTag(STUDIO_TAG);
  refresh();
  return success(active ? "Option affichée." : "Option masquée.");
}

export async function deleteStudioOption(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = z.uuid().safeParse(formData.get("id"));
  if (!parsed.success) return failure("Requête invalide.");
  // Submitted designs keep the option's name (snapshot), so deleting is safe.
  const { error } = await (await db()).from("studio_options").delete().eq("id", parsed.data);
  if (error) return fromDb(error, "delete studio option");
  updateTag(STUDIO_TAG);
  refresh();
  return success("Option supprimée.");
}
