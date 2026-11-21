import { expect, type Page } from "@playwright/test";

export const LOCALES = ["fr", "ar", "en"] as const;

/** Fail on uncaught page errors and Content-Security-Policy violations. */
export function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error" && /Content Security Policy|Refused to/i.test(text)) problems.push(`csp: ${text}`);
    if (message.type() === "error" && /Hydration|did not match/i.test(text)) problems.push(`hydration: ${text}`);
  });
  return problems;
}

/** No horizontal scrolling at the current viewport (common RTL/overflow bug). */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "page wider than the viewport").toBeLessThanOrEqual(1);
}

export function isMobile(page: Page) {
  return (page.viewportSize()?.width ?? 1280) < 1024;
}

/** First product page linked from a catalog listing, or null when nothing is published (no product is seeded). */
export async function firstProductPath(page: Page, catalogPath: string): Promise<string | null> {
  await page.goto(catalogPath);
  const link = page.locator('main a[href*="/produits/"], main a[href*="/products/"]').first();
  return (await link.count()) > 0 ? await link.getAttribute("href") : null;
}
