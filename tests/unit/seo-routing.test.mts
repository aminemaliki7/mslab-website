import assert from "node:assert/strict";
import * as nodeModule from "node:module";
import { describe, it } from "node:test";

// Node ≥ 22.15 API; the installed @types/node predates it.
type NextResolve = (specifier: string, context: unknown) => unknown;
const { registerHooks } = nodeModule as unknown as {
  registerHooks: (hooks: { resolve: (specifier: string, context: unknown, nextResolve: NextResolve) => unknown }) => void;
};

// src/i18n/routes.ts imports "./config" without an extension (bundler style): let Node try ".ts".
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.startsWith(".") && !specifier.endsWith(".ts")) return nextResolve(`${specifier}.ts`, context);
      throw error;
    }
  },
});

const { localeFromHreflang, localeMeta } = await import("../../src/i18n/config.ts");
const { entityFromPath, switchLocalePath } = await import("../../src/i18n/routes.ts");

/** Multilingual SEO routing helpers (language switcher fallback, entity guard, hreflang codes). */
describe("switchLocalePath (switcher links before hydration)", () => {
  it("translates static section segments", () => {
    assert.equal(switchLocalePath("/fr/a-propos", "en"), "/en/about");
    assert.equal(switchLocalePath("/en/quote", "ar"), "/ar/devis");
    assert.equal(switchLocalePath("/fr", "en"), "/en");
  });

  it("never guesses an entity slug in another language", () => {
    assert.equal(switchLocalePath("/fr/catalogue/vetements-produits-personnalises", "en"), "/en/catalog");
    assert.equal(switchLocalePath("/en/services/office-supplies", "fr"), "/fr/services");
  });

  it("sends product pages to the catalog (products have no index page)", () => {
    assert.equal(switchLocalePath("/en/products/business-cards", "fr"), "/fr/catalogue");
    assert.equal(switchLocalePath("/fr/produits/cartes-de-visite", "ar"), "/ar/catalogue");
  });
});

describe("entityFromPath (proxy slug guard)", () => {
  it("recognizes localized entity paths", () => {
    assert.deepEqual(entityFromPath("fr", ["produits", "cartes-de-visite"]), { route: "product", slug: "cartes-de-visite" });
    assert.deepEqual(entityFromPath("en", ["catalog", "custom-apparel"]), { route: "category", slug: "custom-apparel" });
    assert.deepEqual(entityFromPath("ar", ["services", "impression-reprographie"]), { route: "service", slug: "impression-reprographie" });
  });

  it("decodes percent-encoded slugs", () => {
    assert.deepEqual(entityFromPath("fr", ["produits", "caf%C3%A9"]), { route: "product", slug: "café" });
  });

  it("ignores section indexes, deeper paths, other sections and malformed encodings", () => {
    assert.equal(entityFromPath("fr", ["catalogue"]), null);
    assert.equal(entityFromPath("fr", ["produits", "a", "b"]), null);
    assert.equal(entityFromPath("fr", ["contact", "x"]), null);
    assert.equal(entityFromPath("fr", ["produits", "%E0%A4%A"]), null);
  });
});

describe("hreflang codes", () => {
  it("targets Morocco for French and Arabic", () => {
    assert.equal(localeMeta.fr.hreflang, "fr-MA");
    assert.equal(localeMeta.ar.hreflang, "ar-MA");
    assert.equal(localeMeta.en.hreflang, "en");
  });

  it("maps hreflang values back to site locales (case-insensitive)", () => {
    assert.equal(localeFromHreflang("fr-MA"), "fr");
    assert.equal(localeFromHreflang("ar-ma"), "ar");
    assert.equal(localeFromHreflang("en"), "en");
    assert.equal(localeFromHreflang("x-default"), null);
  });
});
