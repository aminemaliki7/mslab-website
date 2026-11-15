import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_VISUAL_KEY,
  PRODUCT_VISUAL_KEYS,
  isProductVisualKey,
  resolveProductVisual,
  resolveVisualKey,
  visualKeyFromSlug,
} from "../../src/features/catalog/visual.ts";

describe("visualKeyFromSlug (automatic drawing)", () => {
  const cases: Array<[string, string]> = [
    ["cahier-spirale-a4", "notebook"],
    ["bloc-notes", "notebook"],
    ["stylo-bille-bleu", "pen"],
    ["crayon-hb", "pen"],
    ["livre-de-lecture", "book"],
    ["dictionnaire-francais", "book"],
    ["classeur-a-levier", "binder"],
    ["chemise-cartonnee", "binder"],
    ["agrafeuse-de-bureau", "stapler"],
    ["ramette-papier-a4", "paper"],
    ["enveloppe-kraft", "paper"],
    ["impression-flyers", "print"],
    ["cartes-de-visite", "print"],
    ["calculatrice", DEFAULT_VISUAL_KEY],
  ];
  for (const [slug, expected] of cases) {
    it(`${slug} → ${expected}`, () => assert.equal(visualKeyFromSlug(slug), expected));
  }

  it("ignores accents and case", () => {
    assert.equal(visualKeyFromSlug("Répertoire-Alphabétique"), "notebook");
    assert.equal(visualKeyFromSlug("ENCYCLOPÉDIE"), "book");
  });

  it("matches the initial catalog slugs", () => {
    assert.equal(visualKeyFromSlug("cahier"), "notebook");
    assert.equal(visualKeyFromSlug("stylo"), "pen");
    assert.equal(visualKeyFromSlug("classeur"), "binder");
    assert.equal(visualKeyFromSlug("agrafeuse"), "stapler");
    assert.equal(visualKeyFromSlug("livre"), "book");
  });
});

describe("resolveVisualKey", () => {
  it("prefers the drawing chosen by MSLAB over the slug rule", () => {
    assert.equal(resolveVisualKey({ visualKey: "book", slugFr: "stylo-bille" }), "book");
  });

  it("falls back to the slug rule when no drawing is chosen", () => {
    assert.equal(resolveVisualKey({ visualKey: null, slugFr: "stylo-bille" }), "pen");
    assert.equal(resolveVisualKey({ slugFr: "stylo-bille" }), "pen");
  });

  it("ignores an unknown stored key instead of breaking the card", () => {
    assert.equal(resolveVisualKey({ visualKey: "rocket", slugFr: "stylo-bille" }), "pen");
  });
});

describe("resolveProductVisual", () => {
  const photo = { url: "https://example.test/a.webp", alt: "Cahier" };

  it("a real photo always wins", () => {
    assert.deepEqual(resolveProductVisual({ image: photo, visualKey: "book", slugFr: "cahier" }), { kind: "photo", image: photo });
  });

  it("shows an illustration when there is no photo", () => {
    assert.deepEqual(resolveProductVisual({ image: null, visualKey: null, slugFr: "cahier" }), { kind: "illustration", key: "notebook" });
    assert.deepEqual(resolveProductVisual({ image: undefined, visualKey: "print", slugFr: "cahier" }), { kind: "illustration", key: "print" });
  });
});

describe("PRODUCT_VISUAL_KEYS", () => {
  it("lists eight unique drawings and validates them", () => {
    assert.equal(new Set(PRODUCT_VISUAL_KEYS).size, 8);
    for (const key of PRODUCT_VISUAL_KEYS) assert.ok(isProductVisualKey(key));
    assert.equal(isProductVisualKey("Notebook"), false);
    assert.equal(isProductVisualKey(42), false);
  });
});
