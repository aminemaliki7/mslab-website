// Mobile performance smoke check (Pixel 7, ~9 Mbps / 150 ms, 4x CPU slowdown).
// Usage: start the production server, then: BASE_URL=http://localhost:3001 node scripts/perf-check.mjs
import { chromium, devices } from "@playwright/test";
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const pages = ["/fr", "/ar", "/fr/catalogue", "/fr/catalogue/impression-reprographie", "/fr/devis", "/fr/contact"];
const browser = await chromium.launch();
const context = await browser.newContext({ ...devices["Pixel 7"] });
for (const path of pages) {
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  await client.send("Network.enable");
  // Simulated "fast 4G"-like mobile network + 4x CPU slowdown
  await client.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (2 * 1024 * 1024) / 8 });
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const sizes = { script: 0, stylesheet: 0, font: 0, image: 0, document: 0, other: 0 };
  page.on("response", async (r) => {
    try { const body = await r.body(); const t = r.request().resourceType(); sizes[t in sizes ? t : "other"] += body.length; } catch {}
  });
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  const m = await page.evaluate(() => new Promise((resolve) => {
    let lcp = 0, cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    const nav = performance.getEntriesByType("navigation")[0];
    setTimeout(() => resolve({ lcp: Math.round(lcp), cls: +cls.toFixed(3), ttfb: Math.round(nav.responseStart), dcl: Math.round(nav.domContentLoadedEventEnd) }), 1500);
  }));
  const kb = (n) => Math.round(n / 1024);
  console.log(`${path.padEnd(28)} LCP ${String(m.lcp).padStart(5)}ms  CLS ${m.cls}  TTFB ${m.ttfb}ms  | JS ${kb(sizes.script)}KB CSS ${kb(sizes.stylesheet)}KB fonts ${kb(sizes.font)}KB img ${kb(sizes.image)}KB html ${kb(sizes.document)}KB`);
  await page.close();
}
await browser.close();
