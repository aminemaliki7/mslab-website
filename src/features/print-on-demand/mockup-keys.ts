/** Products available in the live mockup studio (drawings in components/print-on-demand/mockups.tsx). */
export const MOCKUP_KEYS = [
  "tshirt",
  "hoodie",
  "tote",
  "mug",
  "box",
  "notebook",
  "sticker",
  "business-card",
  "flyer",
  "poster",
  "letterhead",
  "folded-card",
  "catalog",
  "banner",
] as const;
export type MockupKey = (typeof MOCKUP_KEYS)[number];

export function isMockupKey(value: string): value is MockupKey {
  return (MOCKUP_KEYS as readonly string[]).includes(value);
}
