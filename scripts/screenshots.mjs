// Visual review screenshots (headless Chromium). Motion is reduced so scroll-reveals don't hide
// content in full-page captures. Usage: BASE_URL=http://localhost:3001 node scripts/screenshots.mjs <outDir>
import { chromium, devices } from "@playwright/test";
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const out = process.argv[2] ?? "screenshots";
const shots = [
  ["desktop", "/fr", "home-fr-desktop"],
  ["desktop", "/ar", "home-ar-desktop"],
  ["mobile", "/fr", "home-fr-mobile"],
  ["desktop", "/fr/a-propos", "about-fr"],
  ["desktop", "/fr/catalogue", "catalog-fr"],
  ["desktop", "/fr/produits/exemple-cahier", "product-fr"],
  ["desktop", "/ar/devis", "quote-ar"],
  ["mobile", "/fr/contact", "contact-fr-mobile"],
  ["desktop", "/fr/page-inexistante", "404-fr"],
];
const browser = await chromium.launch();
for (const [kind, path, name] of shots) {
  const context = await browser.newContext({
    ...(kind === "mobile" ? devices["Pixel 7"] : { viewport: { width: 1280, height: 800 } }),
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  await context.close();
}
await browser.close();
console.log("saved", shots.length, "screenshots to", out);
