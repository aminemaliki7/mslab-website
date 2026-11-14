/**
 * End-to-end form tests over plain HTTP, exactly like a browser WITHOUT JavaScript:
 * GET the page, copy the server-action hidden fields from the form, POST multipart data,
 * read the rendered result. Covers the real server actions, validation, anti-spam and DB writes.
 *
 *   BASE_URL=http://localhost:3001 npm run test:http      (against a running `next start`)
 *
 * Uses the DEV database only; rows use @example.com and are removed by
 * supabase/seed/remove_test_submissions.sql.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

const BASE = process.env.BASE_URL ?? "http://localhost:3001";
const SAMPLE_PRODUCT = "b0000000-0000-4000-8000-000000000001";
const SAMPLE_PRODUCT_2 = "b0000000-0000-4000-8000-000000000003";
const DRAFT_PRODUCT = "b0000000-0000-4000-8000-000000000006";

/** Hidden inputs React renders for a server-action form (action id + bound state). */
async function actionFields(path: string): Promise<[string, string][]> {
  const html = await (await fetch(`${BASE}${path}`)).text();
  const fields: [string, string][] = [];
  for (const match of html.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
    const tag = match[0];
    const name = /name="([^"]+)"/.exec(tag)?.[1];
    if (!name?.startsWith("$ACTION")) continue;
    const value = /value="([^"]*)"/.exec(tag)?.[1] ?? "";
    fields.push([name, value.replace(/&quot;/g, '"').replace(/&amp;/g, "&")]);
  }
  assert.ok(fields.length > 0, `no server-action fields found on ${path}`);
  return fields;
}

async function post(path: string, data: Record<string, string>, ip: string): Promise<string> {
  const form = new FormData();
  for (const [name, value] of await actionFields(path)) form.append(name, value);
  for (const [name, value] of Object.entries(data)) form.append(name, value);
  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    body: form,
    headers: { "x-forwarded-for": ip },
  });
  assert.equal(response.status, 200);
  return response.text();
}

const ip = () => `203.0.113.${Math.floor(Math.random() * 250) + 1}-${randomUUID().slice(0, 4)}`;

const contactBase = {
  fullName: "HTTP Test Visitor",
  email: "visitor@example.com",
  subject: "Test sans JavaScript",
  message: "Message envoyé par le test HTTP sans JavaScript.",
  consent: "on",
  locale: "fr",
  sourcePath: "/fr/contact",
};

const quoteBase = {
  fullName: "HTTP Test Buyer",
  email: "buyer@example.com",
  phone: "06 12 34 56 78",
  companyName: "Test Company (HTTP)",
  preferredContact: "whatsapp",
  consent: "on",
  locale: "fr",
  sourcePath: "/fr/devis",
};

describe("contact form (no JavaScript)", () => {
  it("stores a valid message and shows the reference", async () => {
    const html = await post("/fr/contact", contactBase, ip());
    assert.match(html, /Message envoyé/);
    assert.match(html, /MSC-\d{4}-\d{6}/);
  });

  it("shows localized field errors and keeps the typed values", async () => {
    const html = await post("/fr/contact", { ...contactBase, email: "pas-un-email", message: "court" }, ip());
    assert.match(html, /Adresse e-mail invalide/);
    assert.match(html, /Ce texte est trop court/);
    assert.match(html, /HTTP Test Visitor/);
    assert.doesNotMatch(html, /MSC-\d{4}-\d{6}/);
  });

  it("requires consent", async () => {
    const withoutConsent: Record<string, string> = { ...contactBase };
    delete withoutConsent.consent;
    const html = await post("/fr/contact", withoutConsent, ip());
    assert.match(html, /Votre accord est nécessaire/);
  });

  it("silently drops honeypot submissions (generic success, nothing stored)", async () => {
    const html = await post("/fr/contact", { ...contactBase, website: "http://spam.example" }, ip());
    assert.match(html, /Message envoyé/);
    assert.doesNotMatch(html, /MSC-\d{4}-\d{6}/);
  });

  it("localizes errors in Arabic", async () => {
    const html = await post("/ar/contact", { ...contactBase, locale: "ar", email: "x" }, ip());
    assert.match(html, /عنوان البريد الإلكتروني غير صالح/);
  });
});

describe("quotation form (no JavaScript)", () => {
  it("accepts a custom requirement only (no catalog product)", async () => {
    const html = await post(
      "/fr/devis",
      { ...quoteBase, "items.0.label": "Impression de flyers A5 (test)", "items.0.quantity": "500", "items.0.specifications": "Recto-verso" },
      ip(),
    );
    assert.match(html, /Demande de devis envoyée/);
    assert.match(html, /MSQ-\d{4}-\d{6}/);
  });

  it("accepts several catalog products plus a custom item with quantities", async () => {
    const html = await post(
      "/fr/devis",
      {
        ...quoteBase,
        "items.0.productId": SAMPLE_PRODUCT,
        "items.0.quantity": "20",
        "items.1.productId": SAMPLE_PRODUCT_2,
        "items.1.quantity": "3",
        "items.2.label": "Reliure sur mesure (test)",
        "items.2.quantity": "10",
      },
      ip(),
    );
    assert.match(html, /MSQ-\d{4}-\d{6}/);
  });

  it("rejects an unpublished product", async () => {
    const html = await post("/fr/devis", { ...quoteBase, "items.0.productId": DRAFT_PRODUCT, "items.0.quantity": "1" }, ip());
    assert.match(html, /Ce produit n&#x27;est plus disponible|Ce produit n'est plus disponible/);
  });

  it("requires at least one item and a valid phone", async () => {
    const html = await post("/fr/devis", { ...quoteBase, phone: "123" }, ip());
    assert.match(html, /Numéro de téléphone invalide/);
  });

  it("rejects invalid quantities", async () => {
    const html = await post("/fr/devis", { ...quoteBase, "items.0.label": "Test", "items.0.quantity": "0" }, ip());
    assert.match(html, /Quantité invalide/);
  });
});
