import type { StaticImageData } from "next/image";
import blankBook from "@/assets/production/blank-book.jpg";
import blackHoodieViews from "@/assets/production/black-hoodie-views.jpg";
import corporateKit from "@/assets/production/corporate-kit.jpg";
import eventStaffTshirt from "@/assets/production/event-staff-tshirt.jpg";
import eventToteBags from "@/assets/production/event-tote-bags.jpg";
import framedPosters from "@/assets/production/framed-posters.jpg";
import heatPressGarment from "@/assets/production/heat-press-garment.jpg";
import heatPressIllustration from "@/assets/production/heat-press-illustration.jpg";
import hoodieTechnicalSketch from "@/assets/production/hoodie-technical-sketch.jpg";
import kraftMailerBox from "@/assets/production/kraft-mailer-box.jpg";
import mugPress from "@/assets/production/mug-press.jpg";
import printedSweatshirts from "@/assets/production/printed-sweatshirts.jpg";
import paperShoppingBag from "@/assets/production/paper-shopping-bag.jpg";
import tshirtTechnicalSketch from "@/assets/production/tshirt-technical-sketch.jpg";
import whiteMug from "@/assets/production/white-mug.jpg";
// Catalogue products printed with MSLAB’s identity (scripts/build-catalogue-mockups.mjs): the
// square crops of the catalogue images, for small square slots (homepage production lines).
import designedTshirt from "../../public/catalog/mockups/apparel/t-shirts/t-shirts-front-print-cutout-square.webp";
import designedMug from "../../public/catalog/mockups/merchandise/mugs/mugs-wrap-print-cutout-square.webp";
import designedMailerBox from "../../public/catalog/mockups/packaging/mailer-boxes/mailer-boxes-kraft-print-cutout-square.webp";
import designedBrochure from "../../public/catalog/mockups/printed-materials/brochures-catalogs/brochures-catalogs-cover-cutout-square.webp";
import designedBusinessCards from "../../public/catalog/mockups/printing/business-cards/business-cards-front-back-cutout-square.webp";
import designedLetterhead from "../../public/catalog/mockups/stationery/letterhead/letterhead-a4-cutout-square.webp";
// Catalogue photo of the "Fournitures de bureau" product (Catalogue & fournitures division card).
import officeSupplies from "../../public/catalog/products/office-supplies.webp";
// Division cards on the homepage (sources in src/assets/divisions/CREDITS.md).
import divisionCatalogue from "@/assets/divisions/division-catalogue.jpg";
import divisionDigital from "@/assets/divisions/division-digital.jpg";

/**
 * Product and production photos supplied by the owner (2026-11-19). Every image carries the
 * MSLAB logo (scripts/brand-mockups.mjs: perspective / cylinder warp; on the three photos the
 * previous mark was erased first). Illustrative — never captioned as a specific client, order
 * or MSLAB's own premises. A watermarked stock preview (stationery set) was removed.
 * Alt text lives in the dictionaries under `photos.<key>`.
 * Statically imported so Next.js knows their size (no layout shift) and optimizes them.
 */
export const PHOTOS = {
  heatPress: heatPressGarment,
  /** Owner-supplied illustration, used as is: heat press printing a T-shirt ("Notre production"). */
  heatPressArt: heatPressIllustration,
  mugPress,
  eventTotes: eventToteBags,
  /** Owner-supplied, used as is (not re-branded): corporate merchandise kit. */
  corporateKit,
  shoppingBag: paperShoppingBag,
  hoodies: blackHoodieViews,
  mug: whiteMug,
  box: kraftMailerBox,
  sketch: hoodieTechnicalSketch,
  tshirt: tshirtTechnicalSketch,
  posters: framedPosters,
  book: blankBook,
  /**
   * Stock photo from Unsplash (Unsplash License: free commercial use, no attribution required),
   * chosen by the owner on 2026-11-20 for the "For businesses" card. A generic scene, not an
   * MSLAB client or order: unsplash.com/photos/RlakZ84ex2g.
   */
  staffTshirt: eventStaffTshirt,
  /** Supplied by the owner (2026-11-20) for the "For brands & creators" card: printed sweatshirts
   *  on a shop front. Illustrative, not MSLAB's work. */
  printedSweatshirts,
  /** Catalogue mockups in MSLAB’s identity (design/catalogue-mockups/README.md), square on white. */
  designedBusinessCards,
  designedTshirt,
  designedMug,
  designedLetterhead,
  designedBrochure,
  designedMailerBox,
  officeSupplies,
  /**
   * Division cards (2026-11-25; the production card uses `heatPressArt`). Catalogue: unbranded
   * corporate kit supplied by the owner. Digital: Unsplash photo (Unsplash License). Generic
   * scenes, never captioned as MSLAB's premises, clients or orders.
   */
  divisionCatalogue,
  divisionDigital,
} satisfies Record<string, StaticImageData>;

export type PhotoKey = keyof typeof PHOTOS;

/** Wide product views on a white background: shown whole (contain) on white, never cropped. */
export const CONTAIN_PHOTOS: ReadonlySet<PhotoKey> = new Set<PhotoKey>([
  "hoodies", "sketch", "tshirt",
  "designedBusinessCards", "designedTshirt", "designedMug", "designedLetterhead", "designedBrochure", "designedMailerBox",
]);
