/**
 * Translation and RTL guards (Milestone 7):
 * - fr/ar/en dictionaries have exactly the same keys, no empty strings, same {placeholders};
 * - no physical-direction Tailwind classes (ml-, pr-, left-, text-right…) anywhere in src/,
 *   so layouts mirror correctly in Arabic (use ms-/pe-/start-/text-end instead).
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const root = new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dictDir = join(root, "src/i18n/dictionaries");
const load = (locale: string) => JSON.parse(readFileSync(join(dictDir, `${locale}.json`), "utf8")) as Record<string, unknown>;

function flatten(value: unknown, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      for (const [k, v] of flatten(child, prefix ? `${prefix}.${key}` : key)) out.set(k, v);
    }
  } else {
    out.set(prefix, String(value));
  }
  return out;
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

describe("dictionaries", () => {
  const fr = flatten(load("fr"));
  for (const locale of ["ar", "en"]) {
    const other = flatten(load(locale));

    it(`${locale} has exactly the French keys`, () => {
      const missing = [...fr.keys()].filter((k) => !other.has(k));
      const extra = [...other.keys()].filter((k) => !fr.has(k));
      assert.deepEqual({ missing, extra }, { missing: [], extra: [] });
    });

    it(`${locale} has no empty strings`, () => {
      assert.deepEqual([...other].filter(([, v]) => !v.trim()).map(([k]) => k), []);
    });

    it(`${locale} keeps the same {placeholders}`, () => {
      const mismatched = [...fr].filter(([k, v]) => other.has(k) && placeholders(v) !== placeholders(other.get(k)!)).map(([k]) => k);
      assert.deepEqual(mismatched, []);
    });
  }

  it("French has no empty strings", () => {
    assert.deepEqual([...fr].filter(([, v]) => !v.trim()).map(([k]) => k), []);
  });
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx?|css)$/.test(name) ? [path] : [];
  });
}

const PHYSICAL =
  /(?<![\w-])-?(?:ml|mr|pl|pr|left|right|scroll-ml|scroll-mr|scroll-pl|scroll-pr)-(?:\d|\[|px|auto|full)|(?<![\w-])(?:rounded|border)-(?:l|r|tl|tr|bl|br)(?![\w])|(?<![\w-])(?:text|float|clear)-(?:left|right)(?![\w-])/g;

describe("RTL-safe styling", () => {
  it("uses logical utilities only (no ml-/pr-/left-/text-right…)", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(join(root, "src"))) {
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, index) => {
        for (const match of line.matchAll(PHYSICAL)) offenders.push(`${file.slice(root.length)}:${index + 1} ${match[0]}`);
      });
    }
    assert.deepEqual(offenders, []);
  });
});
