import type { ComponentType } from "react";
import { BusinessSupplyIllustration, LibraryIllustration, PrintOnDemandIllustration, PrintShopIllustration, StationeryIllustration } from "./scenes";

/**
 * Picture for each of MSLAB's four core services, keyed by the service's French slug
 * (stable identifier; slugs are managed in /admin/services). A service added later without a
 * mapping simply has no illustration (or uses its uploaded image).
 */
export const SERVICE_ART: Record<string, ComponentType<{ className?: string }>> = {
  "impression-reprographie": PrintShopIllustration,
  "fournitures-de-bureau": BusinessSupplyIllustration,
  "papeterie-fournitures-scolaires": StationeryIllustration,
  "livres-ouvrages": LibraryIllustration,
  "impression-a-la-demande": PrintOnDemandIllustration,
};

/** The four core services in display order (homepage picture cards). */
export const CORE_SERVICE_SLUGS = ["impression-reprographie", "fournitures-de-bureau", "papeterie-fournitures-scolaires", "livres-ouvrages"];

/** French slug of the print-on-demand service (dedicated page with gallery, form and tracking). */
export const PRINT_ON_DEMAND_SLUG = "impression-a-la-demande";

export function ServiceArt({ slugFr, className }: { slugFr: string; className?: string }) {
  const Art = SERVICE_ART[slugFr];
  return Art ? <Art className={className} /> : null;
}
