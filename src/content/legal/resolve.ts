/**
 * Removes every unconfigured value from a legal document before it is rendered, so the public
 * site never shows a "to be completed" marker (ADR-024, revised 2026-11-18).
 * Pure module (type-only imports): unit-tested directly by tests/unit/legal-content.test.mts.
 */
import type { LegalBlock, LegalSection } from "./types";

const TOKEN = /\{(?:ph|fact):([A-Za-z]+)\}/g;
const OPTIONAL = /\[\[([\s\S]*?)\]\]/g;

/** Tokens whose value is known, e.g. "ph:rc" → "RC Casablanca 123". */
export type ResolvedValues = Partial<Record<string, string>>;

const allKnown = (text: string, values: ResolvedValues) =>
  [...text.matchAll(TOKEN)].every((m) => Boolean(values[m[0].slice(1, -1)]));

/**
 * One content string → the text to render (tokens kept, rendered later), or null to hide the
 * unit. Optional `[[…]]` segments with an unknown value are removed; any other unknown value
 * hides the whole string.
 */
export function resolveText(text: string, values: ResolvedValues): string | null {
  const withoutOptional = text.replace(OPTIONAL, (_, inner: string) => (allKnown(inner, values) ? inner : ""));
  if (!allKnown(withoutOptional, values)) return null;
  const cleaned = withoutOptional.replace(/[ \t]{2,}/g, " ").trim();
  return cleaned || null;
}

function resolveBlock(block: LegalBlock, values: ResolvedValues): LegalBlock | null {
  const r = (text: string) => resolveText(text, values);
  switch (block.type) {
    case "p":
    case "note": {
      const text = r(block.text);
      return text ? { ...block, text } : null;
    }
    case "ul": {
      const items = block.items.map(r).filter((item): item is string => item !== null);
      return items.length ? { ...block, items } : null;
    }
    case "table": {
      const rows = block.rows
        .map((row) => row.map(r))
        .filter((row): row is string[] => row.every((cell) => cell !== null));
      return rows.length ? { ...block, rows } : null;
    }
    case "dl": {
      const items = block.items
        .map(([label, value]) => [label, r(value)] as const)
        .filter((item): item is readonly [string, string] => item[1] !== null)
        .map(([label, value]): [string, string] => [label, value]);
      return items.length ? { ...block, items } : null;
    }
  }
}

/** Sections with their hidden units removed; a section left without content disappears. */
export function resolveSections(sections: LegalSection[], values: ResolvedValues): LegalSection[] {
  return sections.flatMap((section) => {
    const blocks = section.blocks.map((b) => resolveBlock(b, values)).filter((b): b is LegalBlock => b !== null);
    return blocks.length ? [{ ...section, blocks }] : [];
  });
}
