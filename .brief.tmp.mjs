import { chromium } from "@playwright/test";
const SP = process.argv[2];
const log = (...a) => console.log(...a);
const browser = await chromium.launch();
const cases = [
  // only custom for diagnosis
  { kind: "catalog", url: "/fr/devis", file: "cahier-test.docx", formHeading: "Que voulez-vous produire ?" },
  { kind: "custom", url: "/fr/devis?type=production", file: "cahier-test.pdf", formHeading: "Votre projet" },
  { kind: "digital", url: "/fr/services/solutions-digitales", file: "cahier-test.pdf", formHeading: "Votre projet" },
];
for (const c of cases) {
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addCookies([{ name: "mslab_consent", value: encodeURIComponent("1.0.2026-11-24"), domain: "localhost", path: "/" }]);
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://localhost:3000" + c.url);
    await page.getByText("Comment voulez-vous nous transmettre votre besoin ?").waitFor({ timeout: 90000 });
    const fileRadio = page.getByRole("radio", { name: /J'envoie mon fichier/ });
    log(`[${c.kind}] file option first and selected:`, await fileRadio.isChecked());

    // "Fill in the form" shows the detailed form, and back.
    await page.getByRole("radio", { name: /Je remplis le formulaire/ }).check();
    log(`[${c.kind}] form mode shows detailed form:`, await page.getByText(c.formHeading).first().isVisible());
    await fileRadio.check();

    const form = page.locator("form").filter({ has: page.locator("input[name=briefKind]") });
    const id = (f) => `#brief-${c.kind}-${f}`;
    await form.locator(id("fullName")).fill("Test Brief CX");
    await form.locator(id("email")).fill("test-brief@example.com");
    await form.locator(id("phone")).fill("0612345678");
    await form.locator(`label[for=brief-${c.kind}-consent]`).click();
    await page.waitForTimeout(3500);
    await form.getByRole("button", { name: "Envoyer ma demande" }).click();
    await form.getByText("Ajoutez votre fichier (cahier des charges) pour envoyer la demande.").waitFor({ timeout: 30000 });
    log(`[${c.kind}] no file → refused: true`);

    const input = form.locator("input[type=file]");
    await input.setInputFiles(SP + "/notes.txt");
    await page.waitForTimeout(600);
    log(`[${c.kind}] .txt rejected:`, (await form.locator(".text-danger").allInnerTexts()).join(" | ").slice(0, 120));
    await input.setInputFiles(SP + "/" + c.file);
    await form.locator("input[name=uploadedFiles]").first().waitFor({ state: "attached", timeout: 30000 }).catch(async () => { log(`[${c.kind}] UPLOAD DIAG`, (await form.locator(".text-danger").allInnerTexts()).join(" | ")); throw new Error("no upload"); });
    log(`[${c.kind}] ${c.file} uploaded:`, await form.locator("input[name=uploadedFiles]").count());
    await form.locator(id("message")).fill("Test : merci de voir le fichier joint.");
    await form.getByRole("button", { name: "Envoyer ma demande" }).click();
    await form.getByText("Récapitulatif").waitFor({ timeout: 30000 }).catch(async () => { log(`[${c.kind}] DIAG`, (await form.locator("[role=alert], .text-danger").allInnerTexts()).join(" | ").slice(0, 300), "| consent:", await form.locator("input[name=consent]").isChecked(), "| files:", await form.locator("input[name=uploadedFiles]").count(), "| ticket:", await form.locator("input[name=uploadTicket]").count()); throw new Error("no confirmation"); });
    log(`[${c.kind}] confirmation:`, (await form.locator("[role=status]").innerText()).replace(/\s+/g, " ").slice(0, 200));
    log(`[${c.kind}] errors:`, errors);
    await ctx.close();
  } catch (e) {
    log(`[${c.kind}] FAILED`, String(e.message).split("\n")[0]);
  }
}
await browser.close();
