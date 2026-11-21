import { ServiceIndex } from "@/components/catalog/service-index";
import { CONTAIN_PHOTOS, PHOTOS } from "@/config/photos";
import { PRODUCTION_LINES } from "@/config/production-lines";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * MSLAB's production lines as a service index (same layout as the services list), each row
 * illustrated with the matching product photo. Every row leads to the production request.
 */
export function ProductionIndex({ dict, href, className }: { dict: Dictionary; href: string; className?: string }) {
  return (
    <ServiceIndex
      className={className}
      rows={PRODUCTION_LINES.map((line) => ({
        // A line without a fitting photo shows its service drawing (looked up by French slug).
        slugFr: "serviceArt" in line ? line.serviceArt : `production-${line.key}`,
        name: dict.productionLines[line.key].name,
        summary: dict.productionLines[line.key].summary,
        href,
        photo:
          "photo" in line
            ? { src: PHOTOS[line.photo], alt: dict.photos[line.photo], contain: CONTAIN_PHOTOS.has(line.photo) }
            : undefined,
      }))}
    />
  );
}
