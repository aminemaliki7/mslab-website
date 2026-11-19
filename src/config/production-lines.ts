import type { PhotoKey } from "@/config/photos";
import type { MockupKey } from "@/features/print-on-demand/mockup-keys";

/**
 * MSLAB's production lines — confirmed by the owner on 2026-11-19 as available now, in bulk
 * (docs/POSITIONING.md §2). Names and summaries live in the dictionaries under
 * `productionLines.<key>`; `photo` is the owner-supplied product photo shown with the line
 * (`art`, the studio drawing, remains for places that need a drawing).
 * Do not add a line here without the owner's confirmation that it is produced today.
 */
export const PRODUCTION_LINES = [
  { key: "textile", art: "tshirt", photo: "hoodies" },
  { key: "merch", art: "mug", photo: "mug" },
  { key: "print", art: "business-card", photo: "posters" },
  { key: "packaging", art: "box", photo: "box" },
  { key: "privateLabel", art: "hoodie", photo: "sketch" },
] as const satisfies ReadonlyArray<{ key: string; art: MockupKey; photo: PhotoKey }>;

export type ProductionLineKey = (typeof PRODUCTION_LINES)[number]["key"];
