import type { StaticImageData } from "next/image";
import blankBook from "@/assets/production/blank-book.jpg";
import blackHoodieViews from "@/assets/production/black-hoodie-views.jpg";
import corporateKit from "@/assets/production/corporate-kit.jpg";
import eventToteBags from "@/assets/production/event-tote-bags.jpg";
import framedPosters from "@/assets/production/framed-posters.jpg";
import heatPressGarment from "@/assets/production/heat-press-garment.jpg";
import heatPressIllustration from "@/assets/production/heat-press-illustration.jpg";
import hoodieTechnicalSketch from "@/assets/production/hoodie-technical-sketch.jpg";
import kraftMailerBox from "@/assets/production/kraft-mailer-box.jpg";
import mugPress from "@/assets/production/mug-press.jpg";
import paperShoppingBag from "@/assets/production/paper-shopping-bag.jpg";
import tshirtTechnicalSketch from "@/assets/production/tshirt-technical-sketch.jpg";
import whiteMug from "@/assets/production/white-mug.jpg";

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
} satisfies Record<string, StaticImageData>;

export type PhotoKey = keyof typeof PHOTOS;

/** Wide product views on a white background: shown whole (contain) on white, never cropped. */
export const CONTAIN_PHOTOS: ReadonlySet<PhotoKey> = new Set<PhotoKey>(["hoodies", "sketch", "tshirt"]);
