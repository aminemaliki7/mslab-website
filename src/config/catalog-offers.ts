import type { MockupKey } from "@/features/print-on-demand/mockup-keys";

/**
 * How a catalogue product is ordered (docs/CX_AUDIT_AND_PLAN.md §3, phase 4):
 * - "standard": an available article, ordered as is (supplies);
 * - "customizable": made with the customer's logo or design (every production product).
 * Anything outside the catalogue is "custom production" (the production request form).
 *
 * Kept in config, keyed by the product's French slug, until MSLAB wants it editable in the
 * admin (then: a `products.offer_type` column + admin field, and this map goes away).
 * A product not listed here is customizable: that is the default of MSLAB's catalogue.
 */
export type OfferType = "standard" | "customizable";
export const OFFER_TYPES = ["standard", "customizable"] as const satisfies readonly OfferType[];

/** French slugs of standard (non-personalized) catalogue articles. */
export const STANDARD_PRODUCT_SLUGS: readonly string[] = ["fournitures-de-bureau"];

export function offerTypeOf(slugFr: string): OfferType {
  return STANDARD_PRODUCT_SLUGS.includes(slugFr) ? "standard" : "customizable";
}

/**
 * Studio support for a catalogue product (product page → "Customize in the studio"), by French
 * slug. Shown only when that support is active in the studio (admin → Studio).
 */
export const STUDIO_SUPPORT_BY_PRODUCT: Readonly<Record<string, MockupKey>> = {
  "t-shirts-personnalises": "tshirt",
  "sweats-a-capuche-personnalises": "hoodie",
  "tote-bags-personnalises": "tote",
  "mugs-personnalises": "mug",
  "boites-d-expedition-personnalisees": "box",
  "carnets-personnalises": "notebook",
  "stickers-autocollants": "sticker",
  "cartes-de-visite": "business-card",
  flyers: "flyer",
  affiches: "poster",
  "papier-a-en-tete": "letterhead",
  depliants: "folded-card",
  "brochures-catalogues": "catalog",
};
