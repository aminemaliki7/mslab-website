import { publicEnv } from "@/lib/env";

export const CATALOG_BUCKET = "catalog";

/**
 * Site-relative image (e.g. `/catalog/products/flyers.webp`, served from `public/`): the
 * catalogue's initial product photos (supabase/seed/initial_catalog.sql). Photos uploaded in the
 * admin live in the `catalog` bucket and never start with "/".
 */
export const isSiteImage = (path: string) => path.startsWith("/");

/** Public URL of a catalog image: a bucket object (served through next/image) or a site file. */
export function catalogImageUrl(storagePath: string): string {
  if (isSiteImage(storagePath)) return storagePath;
  const encoded = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${CATALOG_BUCKET}/${encoded}`;
}
