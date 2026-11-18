/**
 * Legal documents (ADR-024):
 * - fr/ar/en versions have the same sections, block structure and the same values, facts and
 *   links in each section (a translation can never drop a value);
 * - in running text every admin value sits inside an optional [[…]] segment, so a value that is
 *   not configured yet removes only that clause — never a whole paragraph (resolve.ts);
 * - every {ph:…} / {fact:…} / [..](route:…#anchor) token resolves;
 * - no invented company identifier or filler text slips into the content.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { cookies } from "../../src/content/legal/cookies.ts";
import { customOrders } from "../../src/content/legal/custom-orders.ts";
import { delivery } from "../../src/content/legal/delivery.ts";
import { legalNotice } from "../../src/content/legal/legal-notice.ts";
import { privacy } from "../../src/content/legal/privacy.ts";
import { returns } from "../../src/content/legal/returns.ts";
import { sales } from "../../src/content/legal/sales.ts";
import { terms } from "../../src/content/legal/terms.ts";
import { resolveSections, resolveText } from "../../src/content/legal/resolve.ts";
import { FACTS, LEGAL_DOCUMENTS, LEGAL_FACT_FIELDS, PLACEHOLDERS, type LegalBlock, type LegalDocument } from "../../src/content/legal/types.ts";

const docs: LegalDocument[] = [legalNotice, privacy, cookies, terms, sales, delivery, returns, customOrders];
const locales = ["fr", "en", "ar"] as const;
const root = new URL("../../", import.meta.url);

const blockStrings = (block: LegalBlock): string[] => {
  switch (block.type) {
    case "p":
    case "note":
      return [block.text];
    case "ul":
      return block.items;
    case "table":
      return [...block.head, ...block.rows.flat()];
    case "dl":
      return block.items.flat();
  }
};

const tokens = (text: string) =>
  [...text.matchAll(/\{(?:ph|fact):[A-Za-z]+\}|\]\(([^)\s]+)\)/g)].map((m) => (m[1] ? `link:${m[1]}` : m[0])).sort();

const routeSections = [...readFileSync(new URL("src/i18n/routes.ts", root), "utf8").matchAll(/^\s+"?([a-z-]+)"?: \{ fr:/gm)].map((m) => m[1]);

describe("legal documents", () => {
  it("covers every document key exactly once", () => {
    assert.deepEqual(docs.map((d) => d.key).sort(), [...LEGAL_DOCUMENTS].sort());
  });

  for (const doc of docs) {
    describe(doc.key, () => {
      it("has a valid date, version and status", () => {
        assert.match(doc.lastUpdated, /^\d{4}-\d{2}-\d{2}$/);
        assert.match(doc.version, /^\d+\.\d+$/);
        assert.ok(["draft", "validated"].includes(doc.status));
      });

      it("has the same structure and tokens in fr, en and ar", () => {
        const shape = (l: (typeof locales)[number]) =>
          doc.text[l].sections.map((s) => ({
            id: s.id,
            blocks: s.blocks.map((b) => `${b.type}:${blockStrings(b).length}`),
            tokens: s.blocks.flatMap(blockStrings).flatMap(tokens).sort(),
          }));
        assert.deepEqual(shape("en"), shape("fr"));
        assert.deepEqual(shape("ar"), shape("fr"));
      });

      it("has unique section ids and non-empty text", () => {
        for (const l of locales) {
          const t = doc.text[l];
          const ids = t.sections.map((s) => s.id);
          assert.equal(new Set(ids).size, ids.length);
          for (const value of [t.title, t.shortTitle, t.description, t.lead, ...t.sections.map((s) => s.title)]) assert.ok(value.trim());
        }
      });

      it("only uses known placeholders, facts, routes and anchors", () => {
        for (const l of locales) {
          for (const text of doc.text[l].sections.flatMap((s) => s.blocks.flatMap(blockStrings))) {
            for (const [, key] of text.matchAll(/\{ph:([A-Za-z]+)\}/g)) assert.ok((PLACEHOLDERS as readonly string[]).includes(key!), `ph:${key}`);
            for (const [, key] of text.matchAll(/\{fact:([A-Za-z]+)\}/g)) assert.ok(key! in FACTS, `fact:${key}`);
            for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
              if (target === "consent:open" || target!.startsWith("https://")) continue;
              const match = /^route:([a-z-]+)(?:#([a-z-]+))?$/.exec(target!);
              assert.ok(match, `link target ${target}`);
              assert.ok(routeSections.includes(match[1]!), `route ${match[1]}`);
              if (match[2]) {
                const linked = docs.find((d) => d.key === match[1]);
                assert.ok(linked?.text[l].sections.some((s) => s.id === match[2]), `anchor ${target}`);
              }
            }
          }
        }
      });

      it("contains no invented identifiers or filler", () => {
        const all = JSON.stringify(doc.text);
        assert.doesNotMatch(all, /lorem|ipsum|XXX|TODO|\b(?:RC|ICE|IF)\s*(?:n°|no\.?|:)?\s*\d{3,}/i);
        // Phone numbers and e-mail addresses come only from site settings ({fact:…}).
        assert.doesNotMatch(all, /\+?212[\s\d]{6,}|\b0[5-7](?:[\s.]?\d{2}){4}\b/);
        assert.doesNotMatch(all, /[\w.-]+@[\w-]+\.[a-z]{2,}/i);
      });
    });
  }

  it("dictionary placeholder labels match the placeholder list in every locale", () => {
    for (const l of locales) {
      const dict = JSON.parse(readFileSync(new URL(`src/i18n/dictionaries/${l}.json`, root), "utf8"));
      assert.deepEqual(Object.keys(dict.legalCenter.placeholders).sort(), [...PLACEHOLDERS].sort(), l);
    }
  });
});

/** Strings of running text (paragraphs, notes, list items) — table cells and label/value rows hide per row. */
const runningText = (block: LegalBlock): string[] => (block.type === "p" || block.type === "note" ? [block.text] : block.type === "ul" ? block.items : []);

describe("unconfigured values are hidden, never shown as placeholders", () => {
  it("[[ ]] segments are balanced and not nested", () => {
    for (const doc of docs) {
      for (const l of locales) {
        for (const text of doc.text[l].sections.flatMap((s) => s.blocks.flatMap(blockStrings))) {
          const opens = text.split("[[").length - 1;
          assert.equal(opens, text.split("]]").length - 1, `${doc.key}/${l}: ${text}`);
          assert.doesNotMatch(text, /\[\[(?:(?!\]\]).)*\[\[/, `${doc.key}/${l}: nested [[ in ${text}`);
        }
      }
    }
  });

  it("every admin value in running text is inside an optional segment", () => {
    for (const doc of docs) {
      for (const l of locales) {
        for (const text of doc.text[l].sections.flatMap((s) => s.blocks.flatMap(runningText))) {
          const outside = text.replace(/\[\[[\s\S]*?\]\]/g, "").replace(/\{fact:legalName\}/g, "");
          assert.doesNotMatch(outside, /\{(?:ph|fact):/, `${doc.key}/${l}: ${text}`);
        }
      }
    }
  });

  it("every {ph:…} used in the texts can be configured in /admin/settings", () => {
    const configurable = new Set<string>(LEGAL_FACT_FIELDS.map((f) => f.key));
    for (const doc of docs) {
      for (const [, key] of JSON.stringify(doc.text).matchAll(/\{ph:([A-Za-z]+)\}/g)) assert.ok(configurable.has(key!), `${doc.key}: ph:${key}`);
    }
  });

  it("resolveText removes unknown optional segments and hides strings with other unknown values", () => {
    const values = { "ph:rc": "RC 1", "fact:email": "a@b.ma" };
    assert.equal(resolveText("Registre[[ : {ph:rc}]].", values), "Registre : {ph:rc}.");
    assert.equal(resolveText("Délai[[ : {ph:claimDeadline}]]. Suite.", values), "Délai. Suite.");
    assert.equal(resolveText("[[A : {ph:paymentMethods}.]] [[B : {ph:paymentTerms}.]]", values), null);
    assert.equal(resolveText("Texte. [[A : {ph:paymentMethods}.]] Fin.", values), "Texte. Fin.");
    assert.equal(resolveText("Valeur : {ph:courts}.", values), null);
  });

  it("with nothing configured, every document still renders and no token is left unresolved", () => {
    for (const doc of docs) {
      for (const l of locales) {
        const sections = resolveSections(doc.text[l].sections, { "fact:legalName": "MSLAB SARL" });
        assert.ok(sections.length > 0, `${doc.key}/${l} is empty`);
        for (const text of sections.flatMap((s) => s.blocks.flatMap(blockStrings))) {
          assert.doesNotMatch(text.replace(/\{fact:legalName\}/g, ""), /\{(?:ph|fact):|\[\[|\]\]/, `${doc.key}/${l}: ${text}`);
        }
      }
    }
  });
});
