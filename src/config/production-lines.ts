import type { PhotoKey } from "@/config/photos";
import type { MockupKey } from "@/features/print-on-demand/mockup-keys";

/**
 * MSLAB's core services, as presented on the site (docs/POSITIONING.md §2, revised 2026-11-21):
 * printing & reprographics, custom apparel & personalized products, corporate merchandise,
 * business stationery & office supplies, books & printed materials, packaging & bulk production.
 * Names and summaries live in the dictionaries under `productionLines.<key>`; `photo` is the
 * owner-supplied product photo shown with the line, or `serviceArt` (a service's French slug)
 * picks its drawing when no photo fits. `art` is the studio drawing for places that need one.
 * Do not add a line here without the owner's confirmation that MSLAB provides it today.
 */
export const PRODUCTION_LINES = [
  { key: "print", art: "business-card", photo: "posters" },
  { key: "textile", art: "tshirt", photo: "hoodies" },
  { key: "merch", art: "mug", photo: "corporateKit" },
  { key: "stationery", art: "letterhead", serviceArt: "fournitures-de-bureau" },
  { key: "publishing", art: "catalog", photo: "book" },
  { key: "packaging", art: "box", photo: "box" },
] as const satisfies ReadonlyArray<{ key: string; art: MockupKey } & ({ photo: PhotoKey } | { serviceArt: string })>;

export type ProductionLineKey = (typeof PRODUCTION_LINES)[number]["key"];
