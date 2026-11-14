import type { ComponentType } from "react";
import { BusinessSupplyIllustration, LibraryIllustration, PrintShopIllustration, StationeryIllustration } from "./scenes";

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
};

/** The four core services in display order (homepage picture cards). */
export const CORE_SERVICE_SLUGS = Object.keys(SERVICE_ART);

export function ServiceArt({ slugFr, className }: { slugFr: string; className?: string }) {
  const Art = SERVICE_ART[slugFr];
  return Art ? <Art className={className} /> : null;
}
