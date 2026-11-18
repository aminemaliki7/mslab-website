import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { watchConsole } from "./helpers";

/**
 * Print on demand: dedicated page, request form (validation, file upload, submission), order
 * tracking and the MSLAB Studio editor. Submission tests write rows + files to the DEV project
 * (maker@example.com) and run once (desktop) unless E2E_SKIP_SUBMISSIONS is set.
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
    // exact: the quick-choice groups are labelled "Type de produit — Choix rapide" etc.
    await page.getByRole("textbox", { name: "Type de produit", exact: true }).fill("Boîtes personnalisées");
    await page.locator("#quantity").fill("250");
    await page.getByRole("button", { name: "1 couleur" }).click();
    await page.getByLabel("Autres précisions (facultatif)").fill("Boîtes kraft avec un logo imprimé sur le dessus.");
    await page.getByLabel("Largeur").fill("20");
    await page.getByLabel("Hauteur").fill("12,5");
    await page.locator("#demande").locator('input[type="file"]').setInputFiles({
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

// ─── MSLAB Studio editor (ADR-026) ────────────────────────────────────────────

/** A real 600 × 400 PNG (customer logo stand-in). */
const logoPng = () => sharp({ create: { width: 600, height: 400, channels: 4, background: { r: 11, g: 110, b: 138, alpha: 1 } } }).png().toBuffer();

test("studio: layers, text, undo/redo and keyboard nudging", async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto("/fr/services/impression-a-la-demande");
  const studio = page.locator("#studio");
  await expect(studio.getByRole("heading", { name: "Visualisez votre design" })).toBeVisible();
  await page.waitForLoadState("networkidle");

  await studio.getByRole("button", { name: "Ajouter un texte" }).click();
  await studio.getByLabel("Texte", { exact: true }).fill("ATELIER");
  await expect(studio.getByRole("application")).toContainText("ATELIER");

  // Second layer: delete it with the keyboard, bring it back with undo, remove it again with redo.
  await studio.getByRole("button", { name: "Ajouter un texte" }).click();
  const second = studio.getByRole("button", { name: /Votre texte/ });
  await expect(second).toBeVisible();
  await studio.getByRole("application").focus();
  await page.keyboard.press("Delete");
  await expect(second).toHaveCount(0);
  await studio.getByRole("button", { name: "Annuler" }).click();
  await expect(second).toBeVisible();
  await studio.getByRole("button", { name: "Rétablir" }).click();
  await expect(second).toHaveCount(0);

  // Arrow keys move the selected layer (1 % per press).
  await studio.getByRole("button", { name: /ATELIER/ }).first().click();
  const horizontal = studio.getByLabel("Position horizontale");
  await expect(horizontal).toHaveValue("50");
  await studio.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(horizontal).toHaveValue("52");

  // Rotation, then the drawn business card can be recoloured; the layer follows the product.
  await studio.getByLabel("Rotation").fill("30");
  await expect(studio.getByLabel("Rotation")).toHaveValue("30");
  await studio.getByRole("button", { name: /Carte de visite/ }).click();
  await studio.getByRole("button", { name: "Bleu nuit" }).click();
  await expect(studio.getByRole("button", { name: "Bleu nuit" })).toHaveAttribute("aria-pressed", "true");
  await expect(studio.getByRole("application")).toContainText("ATELIER");
  expect(problems).toEqual([]);
});

test("studio: a file is identified by its content, not its name", async ({ page }) => {
  await page.goto("/fr/services/impression-a-la-demande");
  const studio = page.locator("#studio");
  await page.waitForLoadState("networkidle");
  await studio.locator('input[type="file"]').setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: Buffer.from("<html><script>alert(1)</script></html>".padEnd(200, " ")) });
  await expect(studio.getByRole("alert")).toContainText("logo.png");
  await expect(studio.getByText("Ajoutez une image ou un texte pour commencer.")).toBeVisible();
});

test.describe("studio → quotation", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "submission flows run once (desktop)");
    test.skip(Boolean(process.env.E2E_SKIP_SUBMISSIONS), "E2E_SKIP_SUBMISSIONS is set");
  });

  test("design is handed to the request form with the original file and a PNG mockup, then submitted", async ({ page }, testInfo) => {
    const problems = watchConsole(page);
    const logo = await logoPng();
    // Record what the browser uploads to Storage (Playwright cannot read File request bodies):
    // fetch is wrapped before the page loads and keeps each uploaded body as base64.
    await page.addInitScript(() => {
      const w = window as unknown as { __uploads: Array<{ name: string; type: string; base64: string }> };
      w.__uploads = [];
      const original = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (url.includes("/storage/v1/object/custom-uploads/") && init?.body instanceof Blob) {
          const bytes = new Uint8Array(await init.body.arrayBuffer());
          let binary = "";
          for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          const headers = new Headers(init.headers);
          w.__uploads.push({ name: decodeURIComponent(url.split("/").pop() ?? ""), type: headers.get("content-type") ?? "", base64: btoa(binary) });
        }
        return original(input, init);
      };
    });
    const recorded = async () =>
      (await page.evaluate(() => (window as unknown as { __uploads: Array<{ name: string; type: string; base64: string }> }).__uploads)).map((u) => ({
        name: u.name,
        type: u.type,
        body: Buffer.from(u.base64, "base64"),
      }));

    await page.goto("/fr/services/impression-a-la-demande");
    const studio = page.locator("#studio");
    await page.waitForLoadState("networkidle");
    await studio.locator('input[type="file"]').setInputFiles({ name: "logo-client.png", mimeType: "image/png", buffer: logo });
    await expect(studio.getByRole("button", { name: /logo-client\.png/ })).toBeVisible();
    await studio.getByRole("button", { name: "Ajouter un texte" }).click();
    await studio.getByLabel("Texte", { exact: true }).fill("ATELIER");

    await studio.getByRole("button", { name: "Utiliser ce design dans ma demande" }).click();
    await expect(studio.getByRole("status")).toContainText("Design ajouté à votre demande", { timeout: 30_000 });
    await expect(page.locator("#projectType")).toHaveValue("T-shirt");

    const design = JSON.parse((await page.locator('input[name="studioDesign"]').inputValue()) || "{}");
    expect(design).toMatchObject({ version: 1, product: "tshirt" });
    expect(design.layers.map((l: { kind: string }) => l.kind)).toEqual(["image", "text"]);
    expect(design.layers[0].file).toMatchObject({ name: "logo-client.png", type: "image/png", width: 600, height: 400 });
    expect(JSON.stringify(design)).not.toContain("blob:");

    // Original artwork uploaded unchanged; the mockup is a real PNG at the photo's resolution.
    const form = page.locator("#demande");
    await expect(form.getByRole("button", { name: "Retirer logo-client.png" })).toBeVisible({ timeout: 20_000 });
    await expect(form.getByRole("button", { name: "Retirer mslab-mockup-tshirt-front.png" })).toBeVisible({ timeout: 20_000 });
    const uploads = await recorded();
    const original = uploads.find((u) => u.name.endsWith("logo-client.png"));
    expect(original?.body.equals(logo)).toBe(true);
    const mockup = uploads.find((u) => u.name.endsWith("mslab-mockup-tshirt-front.png"));
    expect(mockup?.type).toBe("image/png");
    expect(mockup?.body.subarray(1, 4).toString()).toBe("PNG");
    expect(mockup?.body.readUInt32BE(16)).toBe(1200);
    if (mockup) await testInfo.attach("studio-mockup.png", { body: mockup.body, contentType: "image/png" });

    await page.locator("#quantity").fill("50");
    await page.getByLabel("Autres précisions (facultatif)").fill("T-shirts pour un événement, logo devant.");
    await page.getByLabel("Nom complet").fill("Test Studio");
    await page.getByLabel("E-mail").fill("maker@example.com");
    await page.getByLabel("Téléphone").fill("0612345678");
    await page.locator("#consent").check();
    await page.waitForTimeout(3_200);
    await page.getByRole("button", { name: "Envoyer ma demande" }).click();
    await expect(page.getByRole("status").getByText("Demande envoyée")).toBeVisible({ timeout: 20_000 });
    expect(problems).toEqual([]);
  });
});
