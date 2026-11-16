import { expect, test } from "@playwright/test";
import { watchConsole } from "./helpers";

/**
 * Print on demand: dedicated page, request form (validation, file upload, submission) and
 * order tracking. The submission test writes one row + one file to the DEV project
 * (maker@example.com) and runs once (desktop) unless E2E_SKIP_SUBMISSIONS is set.
 */

test("page explains the service and links to the form and tracking", async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto("/fr/services/impression-a-la-demande");
  await expect(page.locator("main h1")).toHaveText("Votre idée. Votre design. Notre production.");
  await expect(page.getByRole("heading", { name: "Comment ça marche" })).toBeVisible();
  // Hero CTA jumps to the studio; the closing band jumps to the form. Wait until the page is
  // interactive (as a visitor would): a click during hydration has its #hash reset by the router.
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("link", { name: "Créer mon aperçu" })).toHaveAttribute("href", "#studio");
  await page.getByRole("link", { name: "Démarrer mon projet" }).click();
  await expect(page).toHaveURL(/#demande$/);
  await expect(page.getByRole("heading", { name: "Décrivez votre projet" })).toBeInViewport();
  await expect(page.getByRole("link", { name: "Suivre ma commande" }).first()).toHaveAttribute("href", "/fr/suivi-commande");
  expect(problems).toEqual([]);
});

test("empty request shows field errors and sends nothing", async ({ page }) => {
  await page.goto("/fr/services/impression-a-la-demande");
  await page.waitForTimeout(3_200);
  await page.getByRole("button", { name: "Envoyer ma demande" }).click();
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.locator("#projectType")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#description")).toHaveAttribute("aria-invalid", "true");
});

test("unknown reference is not found (no data leak)", async ({ page }) => {
  await page.goto("/en/order-tracking");
  await page.getByLabel("Request reference").fill("MSQ-2026-999999");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByRole("button", { name: "See progress" }).click();
  // Repeated runs from one machine can hit the lookup rate limit (10 / 10 min / IP) — also no leak.
  await expect(page.getByText(/No request matches this reference and email address\.|Too many requests sent/).first()).toBeVisible();
  // Values stay in the form after a lookup.
  await expect(page.getByLabel("Request reference")).toHaveValue("MSQ-2026-999999");
});

test.describe("submission", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "submission flows run once (desktop)");
    test.skip(Boolean(process.env.E2E_SKIP_SUBMISSIONS), "E2E_SKIP_SUBMISSIONS is set");
  });

  test("request with a file, then track it", async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto("/fr/services/impression-a-la-demande");
    await page.getByLabel("Type de produit").fill("Boîtes personnalisées");
    await page.getByLabel("Quantité").first().fill("250");
    await page.getByRole("button", { name: "1 couleur" }).click();
    await page.getByLabel("Autres précisions (facultatif)").fill("Boîtes kraft avec un logo imprimé sur le dessus.");
    await page.getByLabel("Largeur").fill("20");
    await page.getByLabel("Hauteur").fill("12,5");
    await page.locator('input[type="file"]').setInputFiles({
      name: "brief.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"),
    });
    await expect(page.getByText("brief.pdf")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retirer brief.pdf" })).toBeVisible({ timeout: 15_000 });
    await page.getByLabel("Nom complet").fill("Test Atelier");
    await page.getByLabel("E-mail").fill("maker@example.com");
    await page.getByLabel("Téléphone").fill("0612345678");
    await page.locator("#consent").check();
    await page.waitForTimeout(3_200);
    await page.getByRole("button", { name: "Envoyer ma demande" }).click();

    const status = page.getByRole("status");
    await expect(status.getByText("Demande envoyée")).toBeVisible({ timeout: 20_000 });
    const reference = /MSQ-\d{4}-\d{6}/.exec(await status.innerText())?.[0];
    expect(reference).toBeTruthy();

    await page.goto("/fr/suivi-commande");
    await page.getByLabel("Référence de la demande").fill(reference!);
    await page.getByLabel("E-mail").fill("maker@example.com");
    await page.getByRole("button", { name: "Voir l'avancement" }).click();
    await expect(page.getByRole("heading", { name: `Demande ${reference}` })).toBeVisible();
    await expect(page.getByText("Demande reçue").first()).toBeVisible();
    expect(problems).toEqual([]);
  });
});

test("mockup studio: text on a product, then use it in the request form", async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto("/fr/services/impression-a-la-demande");
  await expect(page.getByRole("heading", { name: "Visualisez votre design" })).toBeVisible();
  await page.getByLabel("Ou un texte").fill("ATELIER");
  // Scoped to the studio: the product cards above also have a "Carte de visite" button.
  await page.locator("#studio").getByRole("button", { name: /Carte de visite/ }).click();
  await expect(page.getByRole("img", { name: "Aperçu : Carte de visite" })).toContainText("ATELIER");
  await page.getByRole("button", { name: "Bleu nuit" }).click();
  await expect(page.getByRole("button", { name: "Bleu nuit" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Utiliser ce produit pour ma demande" }).click();
  await expect(page.locator("#projectType")).toHaveValue("Carte de visite");
  expect(problems).toEqual([]);
});
