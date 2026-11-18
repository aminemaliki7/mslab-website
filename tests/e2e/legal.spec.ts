import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, LOCALES, watchConsole } from "./helpers";

/** Public URL of every legal document (src/i18n/routes.ts). */
const LEGAL_PATHS: Record<(typeof LOCALES)[number], string[]> = {
  fr: ["mentions-legales", "confidentialite", "politique-cookies", "conditions-utilisation", "conditions-vente", "livraison", "retours-remboursements", "commandes-personnalisees"].map((s) => `/fr/${s}`),
  ar: ["mentions-legales", "confidentialite", "politique-cookies", "conditions-utilisation", "conditions-vente", "livraison", "retours-remboursements", "commandes-personnalisees"].map((s) => `/ar/${s}`),
  en: ["legal-notice", "privacy", "cookie-policy", "terms-of-use", "terms-of-sale", "delivery", "returns-refunds", "custom-orders"].map((s) => `/en/${s}`),
};

for (const locale of LOCALES) {
  test.describe(`${locale} legal documents`, () => {
    for (const path of LEGAL_PATHS[locale]) {
      test(`${path} renders publicly, draft is noindex, anchors resolve`, async ({ page, context }) => {
        await context.clearCookies();
        const problems = watchConsole(page);
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await expect(page).toHaveURL(new RegExp(`${path}$`));
        await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
        await expect(page.locator("main h1")).toHaveCount(1);
        await expect(page.locator("main time[datetime]")).toHaveCount(1);
        // Drafts stay out of search results without showing a provisional notice.
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path}$`));

        // Every in-page link points at an existing section.
        const anchors = await page.locator('main a[href^="#"]').evaluateAll((links) => links.map((a) => a.getAttribute("href")!));
        for (const anchor of anchors) await expect(page.locator(anchor)).toHaveCount(1);

        // Values not configured in /admin/settings are hidden: no marker, token or markup leaks.
        const text = await page.locator("main").innerText();
        expect(text).not.toMatch(/compléter|to be completed|يُستكمل|\{(?:ph|fact):|\[\[|\]\]/i);
        expect(text).not.toMatch(/Version provisoire|Provisional version|نسخة مؤقتة/i);

        await expectNoHorizontalOverflow(page);
        expect(problems).toEqual([]);
      });
    }
  });
}

test("short legal pages omit the contents list and visitor-facing version", async ({ page }) => {
  await page.goto("/fr/mentions-legales");
  await expect(page.locator("#legal-toc-title")).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText(/Version \d+\.\d+/);
  await page.goto("/fr/confidentialite");
  await expect(page.locator("#legal-toc-title")).toHaveCount(1);
});

test("legal pages pass axe (fr + ar)", async ({ page }) => {
  for (const path of ["/fr/confidentialite", "/ar/politique-cookies", "/en/terms-of-sale"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => `${path}: ${v.id}`)).toEqual([]);
  }
});

test("footer links every legal document in each language", async ({ page }) => {
  for (const locale of LOCALES) {
    await page.goto(`/${locale}`);
    const nav = page.locator("footer nav").filter({ has: page.locator("#footer-legal") });
    const hrefs = await nav.locator("a").evaluateAll((links) => links.map((a) => new URL((a as HTMLAnchorElement).href).pathname));
    expect(hrefs).toEqual(LEGAL_PATHS[locale]);
    await expect(nav.getByRole("button")).toHaveCount(1);
  }
});

test.describe("cookie consent", () => {
  test.beforeEach(async ({ context }) => context.clearCookies());

  test("banner offers equal accept/reject, stores the choice, and can be reopened", async ({ page, context }) => {
    await page.goto("/fr");
    const banner = page.getByRole("region", { name: "Cookies et mesure d'audience" });
    await expect(banner).toBeVisible();
    const reject = banner.getByRole("button", { name: "Tout refuser" });
    const accept = banner.getByRole("button", { name: "Tout accepter" });
    expect(await reject.getAttribute("class")).toBe(await accept.getAttribute("class"));

    await reject.click();
    await expect(banner).toBeHidden();
    const consent = (await context.cookies()).find((c) => c.name === "mslab_consent");
    expect(decodeURIComponent(consent?.value ?? "")).toMatch(/^1\.0\.\d{4}-\d{2}-\d{2}$/);

    // No Google Tag Manager without consent.
    expect(await page.evaluate(() => [...document.scripts].some((s) => s.src.includes("googletagmanager")))).toBe(false);

    await page.reload();
    await expect(banner).toBeHidden();

    await page.locator("footer").getByRole("button", { name: "Gérer les cookies" }).click();
    const dialog = page.getByRole("dialog", { name: "Préférences de cookies" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("switch", { name: "Mesure d'audience" })).not.toBeChecked();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("cookie policy button opens preferences (ar)", async ({ page }) => {
    await page.goto("/ar/politique-cookies");
    await page.getByRole("button", { name: "تدبير تفضيلاتي" }).click();
    await expect(page.getByRole("dialog", { name: "تفضيلات ملفات تعريف الارتباط" })).toBeVisible();
  });
});
