/**
 * ASCII slug from a French/English name ("Fournitures de bureau" → "fournitures-de-bureau").
 * Arabic script yields an empty string: Arabic slugs are entered in Latin by the admin or left
 * empty (the page then uses the French slug — docs/ROUTING_STRATEGY.md).
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/gi, "oe")
    .replace(/æ/gi, "ae")
    .toLowerCase()
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}
