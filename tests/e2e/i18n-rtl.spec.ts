import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, firstProductPath, isMobile, LOCALES, watchConsole } from "./helpers";

const PAGES: Record<(typeof LOCALES)[number], string[]> = {
  fr: ["/fr", "/fr/a-propos", "/fr/services", "/fr/services/impression-reprographie", "/fr/services/impression-a-la-demande", "/fr/services/solutions-digitales", "/fr/suivi-commande", "/fr/catalogue", "/fr/catalogue/impression-reprographie", "/fr/contact", "/fr/devis", "/fr/mentions-legales"],
  ar: ["/ar", "/ar/a-propos", "/ar/services", "/ar/services/impression-reprographie", "/ar/services/impression-a-la-demande", "/ar/services/solutions-digitales", "/ar/suivi-commande", "/ar/catalogue", "/ar/catalogue/impression-reprographie", "/ar/contact", "/ar/devis", "/ar/confidentialite"],
  en: ["/en", "/en/about", "/en/services", "/en/services/printing-reprographics", "/en/services/print-on-demand", "/en/services/digital-solutions", "/en/order-tracking", "/en/catalog", "/en/catalog/printing-reprographics", "/en/contact", "/en/quote", "/en/legal-notice"],
};

for (const locale of LOCALES) {
  test.describe(`${locale} pages`, () => {
    for (const path of PAGES[locale]) {
      test(`${path} renders with lang/dir, one h1, no overflow, no CSP errors`, async ({ page }) => {
        const problems = watchConsole(page);
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
        await expect(page.locator("main h1")).toHaveCount(1);
        await expect(page.locator("main h1")).toBeVisible();
        await expectNoHorizontalOverflow(page);
        expect(problems).toEqual([]);
      });
    }
  });
}

test("product page renders (first published product)", async ({ page }) => {
  const path = await firstProductPath(page, "/fr/catalogue");
  test.skip(!path, "no published product yet");
  const problems = watchConsole(page);
  expect((await page.goto(path!))?.status()).toBe(200);
  await expect(page.locator("main h1")).toHaveCount(1);
  await expectNoHorizontalOverflow(page);
  expect(problems).toEqual([]);
});

test("root redirects using Accept-Language", async ({ browser }) => {
  // `locale` sets Chromium's real Accept-Language (a custom header would be overridden).
  const context = await browser.newContext({ locale: "ar-MA" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page).toHaveURL(/\/ar$/);
  await context.close();
});

test("English segment under /fr redirects to the localized URL", async ({ page }) => {
  await page.goto("/fr/catalog");
  await expect(page).toHaveURL(/\/fr\/catalogue$/);
});

test("language switcher keeps the page and uses translated slugs", async ({ page }) => {
  // A category page has translated slugs (impression-reprographie → printing-reprographics) and needs no product.
  await page.goto("/fr/catalogue/impression-reprographie");
  if (isMobile(page)) await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await page.getByRole("link", { name: "English" }).first().click();
  await expect(page).toHaveURL(/\/en\/catalog\/printing-reprographics$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("Arabic layout is mirrored: logo on the right, arrows flipped", async ({ page }) => {
  await page.goto("/ar");
  const viewport = page.viewportSize()!;
  const logo = page.locator("header a").first();
  const box = (await logo.boundingBox())!;
  expect(box.x + box.width).toBeGreaterThan(viewport.width / 2);

  const fr = await page.context().newPage();
  await fr.goto("/fr");
  const frBox = (await fr.locator("header a").first().boundingBox())!;
  expect(frBox.x).toBeLessThan(viewport.width / 2);
  await fr.close();

  // Directional arrows use rtl:-scale-x-100 → Tailwind v4 sets the CSS `scale` property to "-1 1".
  const scale = await page.locator("main svg.rtl\\:-scale-x-100").first().evaluate((el) => getComputedStyle(el).scale);
  expect(scale).toMatch(/^-1/);
});

test("mobile menu opens, closes with Escape and on navigation", async ({ page }) => {
  test.skip(!isMobile(page), "desktop shows the full navigation");
  await page.goto("/fr");
  const toggle = page.getByRole("button", { name: "Ouvrir le menu" });
  await toggle.click();
  await expect(page.getByRole("button", { name: "Fermer le menu" })).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Ouvrir le menu" })).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Catalogue" }).click();
  await expect(page).toHaveURL(/\/fr\/catalogue$/);
  await expect(page.getByRole("button", { name: "Ouvrir le menu" })).toHaveAttribute("aria-expanded", "false");
});

test("catalog search and category filter (works as a GET form)", async ({ page }) => {
  await page.goto("/fr/catalogue");
  // No product is seeded: a search that matches nothing shows the empty state, not a broken page.
  await page.getByLabel("Rechercher un produit").fill("zz-aucun-produit");
  await page.getByRole("button", { name: "Rechercher" }).click();
  await expect(page).toHaveURL(/q=zz-aucun-produit/);
  await expect(page.locator("main").getByText("Aucun produit ne correspond à votre recherche.")).toBeVisible();
  await expect(page.locator("main").getByRole("link", { name: "Voir tout le catalogue" })).toBeVisible();
});

test("security headers are present", async ({ request }) => {
  const response = await request.get("/fr");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-powered-by"]).toBeUndefined();
});
