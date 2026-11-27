import "server-only";
import { randomUUID } from "node:crypto";
import { sniffImageType } from "@/features/admin/image-upload";
import { createSessionClient } from "@/lib/supabase/server";
import { BUSINESS_BUCKET } from "./queries";

/**
 * Files of the business module go to the PRIVATE bucket `business-files` (signed URLs only).
 * The real type is read from the bytes; the browser's declared type and file name are not trusted.
 * Storage RLS checks the folder against the member's permission (products / expenses / activities).
 */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" } as const;
type AttachmentMime = keyof typeof EXTENSIONS;

export type CheckedFile = { bytes: Uint8Array; mime: AttachmentMime; extension: string; name: string; size: number };

export async function checkAttachment(value: FormDataEntryValue | null, { imagesOnly = false } = {}): Promise<CheckedFile | string | null> {
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > MAX_ATTACHMENT_BYTES) return "Fichier trop lourd (10 Mo maximum).";
  const bytes = new Uint8Array(await value.arrayBuffer());
  const image = sniffImageType(bytes);
  const isPdf = String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  const mime: AttachmentMime | null = image && image !== "image/avif" ? image : isPdf && !imagesOnly ? "application/pdf" : null;
  if (!mime) return "Fichier non pris en charge (JPEG, PNG, WebP ou PDF).";
  const name = value.name.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 200) || `fichier.${EXTENSIONS[mime]}`;
  return { bytes, mime, extension: EXTENSIONS[mime], name, size: value.size };
}

export async function uploadBusinessFile(folder: "products" | "expenses" | "activities", ownerId: string, file: CheckedFile): Promise<string | null> {
  const db = await createSessionClient();
  const path = `${folder}/${ownerId}/${randomUUID()}.${file.extension}`;
  const { error } = await db.storage.from(BUSINESS_BUCKET).upload(path, file.bytes, { contentType: file.mime, upsert: false });
  if (error) {
    console.error("[business] upload failed", folder, error.message);
    return null;
  }
  return path;
}

/** Records an uploaded file against an expense or a journal entry. */
export async function attachFile(entity: "expense" | "activity", entityId: string, file: CheckedFile): Promise<boolean> {
  const path = await uploadBusinessFile(entity === "expense" ? "expenses" : "activities", entityId, file);
  if (!path) return false;
  const db = await createSessionClient();
  const { error } = await db.from("business_attachments").insert({
    entity_type: entity,
    entity_id: entityId,
    storage_path: path,
    file_name: file.name,
    mime_type: file.mime,
    size_bytes: file.size,
  });
  if (error) {
    console.error("[business] attachment row failed", error.code);
    await db.storage.from(BUSINESS_BUCKET).remove([path]);
    return false;
  }
  return true;
}
