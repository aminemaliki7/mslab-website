import { expect, test } from "@playwright/test";

/**
 * Admin access. Unauthenticated checks always run. Signed-in checks run only when the OWNER
 * provides a test account through environment variables (never committed):
 *   E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… npm run test:e2e
 */
const ADMIN_PAGES = ["/admin", "/admin/products", "/admin/products/new", "/admin/categories", "/admin/services", "/admin/quotations", "/admin/inquiries", "/admin/settings"];

test.describe("without a session", () => {
  for (const path of ADMIN_PAGES) {
    test(`${path} redirects to login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login$/);
      await expect(page.getByRole("heading", { name: "Administration" })).toBeVisible();
    });
  }

  test("login page is not indexable", async ({ request }) => {
    const response = await request.get("/admin/login");
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
  });
});

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe("signed in (owner-provided test account)", () => {
  test.skip(!email || !password, "set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD to run");
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "admin flows run once (desktop)");
    await page.goto("/admin/login");
    await page.getByLabel("E-mail").fill(email!);
    await page.getByLabel("Mot de passe").fill(password!);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("dashboard and navigation", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
    for (const label of ["Demandes de devis", "Messages", "Produits", "Catégories", "Services", "Paramètres"]) {
      await page.getByRole("navigation", { name: "Administration" }).getByRole("link", { name: new RegExp(label) }).click();
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("create, publish and delete a product", async ({ page }) => {
    const name = `Produit E2E ${Date.now()}`;
    await page.goto("/admin/products/new");
    await page.getByLabel("Français").first().fill(name);
    await page.getByRole("button", { name: "Créer le produit" }).click();
    await expect(page).toHaveURL(/\/admin\/products\/[0-9a-f-]{36}\?created=1$/);
    await page.getByLabel("Statut").selectOption("published");
    await page.getByRole("button", { name: "Enregistrer" }).first().click();
    await expect(page.getByText("Produit enregistré.")).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Supprimer le produit" }).click();
    await expect(page).toHaveURL(/\/admin\/products\?deleted=1$/);
  });
});
