/**
 * Category-specific "what you specify in your request" lists on product pages. They name the
 * parameters a customer decides for that kind of product; they never state values MSLAB has not
 * confirmed (paper weights, techniques, lead times). Labels live in the dictionaries under
 * `cx.specs.<template>`. Verified facts entered in the admin (product specifications) are shown
 * separately, above these lists.
 *
 * Resolved by the product's French slug first, then its category's French slug.
 */
export const SPEC_TEMPLATES = [
  "textile",
  "businessCards",
  "flatPrint",
  "bound",
  "stickers",
  "letterhead",
  "notebooks",
  "merch",
  "packaging",
  "supplies",
] as const;
export type SpecTemplate = (typeof SPEC_TEMPLATES)[number];

const BY_PRODUCT: Readonly<Record<string, SpecTemplate>> = {
  "t-shirts-personnalises": "textile",
  "sweats-a-capuche-personnalises": "textile",
  "cartes-de-visite": "businessCards",
  affiches: "flatPrint",
  flyers: "flatPrint",
  depliants: "flatPrint",
  "impression-de-documents": "flatPrint",
  "stickers-autocollants": "stickers",
  "brochures-catalogues": "bound",
  livres: "bound",
  "papier-a-en-tete": "letterhead",
  "carnets-personnalises": "notebooks",
  "mugs-personnalises": "merch",
  "tote-bags-personnalises": "merch",
  "kits-d-entreprise": "merch",
  "boites-d-expedition-personnalisees": "packaging",
  "sacs-en-papier-personnalises": "packaging",
  "fournitures-de-bureau": "supplies",
};

const BY_CATEGORY: Readonly<Record<string, SpecTemplate>> = {
  "impression-reprographie": "flatPrint",
  "vetements-produits-personnalises": "textile",
  "objets-promotionnels": "merch",
  "papeterie-fournitures-de-bureau": "letterhead",
  "livres-brochures-imprimes": "bound",
  packaging: "packaging",
};

export function specTemplateFor(productSlugFr: string, categorySlugFr: string | null | undefined): SpecTemplate | null {
  return BY_PRODUCT[productSlugFr] ?? (categorySlugFr ? BY_CATEGORY[categorySlugFr] : undefined) ?? null;
}
