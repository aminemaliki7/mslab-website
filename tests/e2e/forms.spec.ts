import { expect, test } from "@playwright/test";
import { firstProductPath, watchConsole } from "./helpers";

/**
 * JavaScript form flows (the no-JS path is covered by tests/http). Desktop only, to keep the
 * number of rows written to the DEV database small. Rows use @example.com.
 */
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "submission flows run once (desktop)");
  // CI sets this: no rows are written to the database from automated pipelines.
  test.skip(Boolean(process.env.E2E_SKIP_SUBMISSIONS), "E2E_SKIP_SUBMISSIONS is set");
});

/** Product pages linked from the catalog (real published products; none are seeded). */
async function productPaths(page: import("@playwright/test").Page, count: number) {
  await page.goto("/fr/catalogue");
  const hrefs = await page.locator('main a[href^="/fr/produits/"]').evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
  return [...new Set(hrefs)].slice(0, count);
}

// The server rejects forms filled in under 3 s (anti-spam): wait like a human would.
const humanPause = (page: import("@playwright/test").Page) => page.waitForTimeout(3_200);

test("multi-product quote: add from product pages, custom item, submit, list cleared", async ({ page }) => {
  const products = await productPaths(page, 2);
  test.skip(products.length < 2, "needs two published products");
  const problems = watchConsole(page);

  await page.goto(products[0]);
  await page.getByRole("button", { name: "Ajouter à ma demande de devis" }).click();
  await expect(page.getByRole("button", { name: "Ajouté à votre demande" })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Voir ma demande (1)" })).toBeVisible();

  await page.goto(products[1]);
  await page.getByRole("button", { name: "Ajouter à ma demande de devis" }).click();
  await page.getByRole("link", { name: "Voir ma demande (2)" }).click();
  await expect(page).toHaveURL(/\/fr\/devis$/);

  const rows = page.locator("form ol > li");
  await expect(rows).toHaveCount(2);
  await rows.nth(0).getByRole("spinbutton", { name: "Quantité" }).fill("25");

  await page.getByRole("button", { name: /Ajouter un besoin sur mesure/ }).click();
  await expect(rows).toHaveCount(3);
  await rows.nth(2).getByLabel("Description du besoin").fill("Impression de flyers A5 (test E2E)");
  await rows.nth(2).getByRole("spinbutton", { name: "Quantité" }).fill("500");

  // The list survives a reload (localStorage).
  await page.reload();
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0).getByRole("spinbutton", { name: "Quantité" })).toHaveValue("25");

  await page.getByLabel("Nom complet").fill("E2E Buyer");
  await page.getByLabel("E-mail").fill("buyer@example.com");
  await page.getByLabel("Téléphone", { exact: false }).first().fill("06 12 34 56 78");
  await page.getByLabel(/J'accepte que MSLAB/).check();
  await humanPause(page);
  await page.getByRole("button", { name: "Envoyer la demande de devis" }).click();

  await expect(page.getByRole("status")).toContainText("Demande de devis envoyée");
  await expect(page.getByRole("status")).toContainText(/MSQ-\d{4}-\d{6}/);
  const stored = await page.evaluate(() => localStorage.getItem("mslab.quote.v1"));
  expect(stored).toBe("[]");
  expect(problems).toEqual([]);
});

test("quote list: remove a row", async ({ page }) => {
  const product = await firstProductPath(page, "/fr/catalogue");
  test.skip(!product, "no published product yet");
  await page.goto(product!);
  await page.getByRole("button", { name: "Ajouter à ma demande de devis" }).click();
  await page.goto("/fr/devis");
  const rows = page.locator("form ol > li");
  await expect(rows).toHaveCount(1);
  await rows.first().getByRole("button", { name: "Retirer" }).click();
  await expect(rows).toHaveCount(0);
  await expect(page.getByText("Votre demande ne contient encore aucun article.")).toBeVisible();
});

test("contact: errors keep the typed values, then success in Arabic", async ({ page }) => {
  await page.goto("/ar/contact");
  await page.getByLabel("الاسم الكامل").fill("E2E Visitor");
  await page.getByLabel("البريد الإلكتروني").fill("not-an-email");
  await page.getByRole("textbox", { name: "الموضوع", exact: true }).fill("اختبار");
  await page.getByLabel("الرسالة").fill("رسالة اختبار آلية طويلة بما يكفي.");
  await page.getByLabel(/أوافق/).check();
  await humanPause(page);
  await page.getByRole("button", { name: "إرسال الرسالة" }).click();

  await expect(page.getByText("عنوان البريد الإلكتروني غير صالح.")).toBeVisible();
  await expect(page.getByLabel("الاسم الكامل")).toHaveValue("E2E Visitor"); // not reset
  await expect(page.getByLabel("البريد الإلكتروني")).toBeFocused();

  await page.getByLabel("البريد الإلكتروني").fill("visitor@example.com");
  await page.getByRole("button", { name: "إرسال الرسالة" }).click();
  await expect(page.getByRole("status")).toContainText("تم إرسال الرسالة");
  await expect(page.getByRole("status")).toContainText(/MSC-\d{4}-\d{6}/);
});
