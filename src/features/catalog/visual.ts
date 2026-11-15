/**
 * Catalog presentation contract (docs/CATALOG_AUDIT_AND_PLAN.md §3.1).
 *
 * A product record holds real data only. What the visitor sees is decided here, in one place:
 *   1. a real photo, when the product has one (always wins);
 *   2. otherwise an illustration — the drawing chosen by MSLAB (`visual_key`), or, when none
 *      is set, the drawing picked from keywords in the French slug.
 *
 * Pure module (no React, no Supabase) so it can be shared by server and client code and
 * unit-tested with plain Node.
 */

/** Drawings available in components/illustrations/product-art.tsx. */
export const PRODUCT_VISUAL_KEYS = ["notebook", "pen", "book", "binder", "stapler", "paper", "print", "supplies"] as const;

export type ProductVisualKey = (typeof PRODUCT_VISUAL_KEYS)[number];

export function isProductVisualKey(value: unknown): value is ProductVisualKey {
  return typeof value === "string" && (PRODUCT_VISUAL_KEYS as readonly string[]).includes(value);
}

/** Drawing used when nothing matches the slug. */
export const DEFAULT_VISUAL_KEY: ProductVisualKey = "supplies";

/** Keyword → drawing. Checked in order on the accent-free, lower-cased French slug. */
const SLUG_RULES: ReadonlyArray<readonly [RegExp, ProductVisualKey]> = [
  [/cahier|carnet|bloc|agenda|repertoire|notebook/, "notebook"],
  [/stylo|crayon|feutre|marqueur|surligneur|porte-mine|\bpens?\b|pencil|marker/, "pen"],
  [/livre|ouvrage|manuel|roman|dictionnaire|encyclopedie|book/, "book"],
  [/classeur|chemise|dossier|pochette|trieur|archive|binder|folder/, "binder"],
  [/agrafeuse|agrafe|perforatrice|stapler|punch/, "stapler"],
  [/ramette|\brames?\b|papier|feuille|enveloppe|paper|ream/, "paper"],
  [/impression|imprime|flyer|depliant|affiche|brochure|carte|kakemono|print/, "print"],
];

/** Automatic drawing for a product, from its French slug (fallback when MSLAB chose none). */
export function visualKeyFromSlug(slugFr: string): ProductVisualKey {
  const text = slugFr
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  return SLUG_RULES.find(([pattern]) => pattern.test(text))?.[1] ?? DEFAULT_VISUAL_KEY;
}

/** Drawing to show when there is no photo: MSLAB's explicit choice first, then the slug rule. */
export function resolveVisualKey(source: { visualKey?: string | null; slugFr: string }): ProductVisualKey {
  return isProductVisualKey(source.visualKey) ? source.visualKey : visualKeyFromSlug(source.slugFr);
}

export type ProductVisual<Image> = { kind: "photo"; image: Image } | { kind: "illustration"; key: ProductVisualKey };

/** What a card or gallery shows for a product. A real photo always wins over an illustration. */
export function resolveProductVisual<Image>(source: {
  image: Image | null | undefined;
  visualKey?: string | null;
  slugFr: string;
}): ProductVisual<Image> {
  return source.image ? { kind: "photo", image: source.image } : { kind: "illustration", key: resolveVisualKey(source) };
}
