import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Automated WCAG 2.2 A/AA checks (axe-core) on the main templates in French and Arabic. */
const PAGES = [
  "/fr",
  "/fr/a-propos",
  "/fr/services/impression-reprographie",
  "/fr/services/impression-a-la-demande",
  "/fr/suivi-commande",
  "/fr/catalogue",
  "/fr/produits/cahier",
  "/fr/contact",
  "/fr/devis",
  "/ar",
  "/ar/catalogue",
  "/ar/produits/cahier",
  "/ar/devis",
  "/ar/services/impression-a-la-demande",
  "/admin/login",
];

for (const path of PAGES) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.locator("main").first().waitFor();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const serious = results.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => ({ id: v.id, impact: v.impact, help: v.help, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}

test("skip link moves focus to main content", async ({ page }) => {
  await page.goto("/fr");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Aller au contenu" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});
