import { publicEnv } from "@/lib/env";

export const CATALOG_BUCKET = "catalog";

/** Public URL of an object in the public `catalog` bucket (served through next/image). */
export function catalogImageUrl(storagePath: string): string {
  const encoded = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${CATALOG_BUCKET}/${encoded}`;
}
