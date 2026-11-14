import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  contactSchema,
  normalizePhone,
  quoteSchema,
  readQuoteItems,
  toFieldErrors,
} from "../../src/features/inquiries/schema.ts";

describe("normalizePhone", () => {
  const ok: Array<[string, string]> = [
    ["0612345678", "+212612345678"],
    ["06 12 34 56 78", "+212612345678"],
    ["06.12.34.56.78", "+212612345678"],
    ["0522-12-34-56", "+212522123456"],
    ["212712345678", "+212712345678"],
    ["+212 6 12 34 56 78", "+212612345678"],
    ["00212612345678", "+212612345678"],
    ["+33 6 12 34 56 78", "+33612345678"],
  ];
  for (const [input, expected] of ok) {
    it(`accepts ${input}`, () => assert.equal(normalizePhone(input), expected));
  }
  for (const input of ["", "abc", "0812345678", "+212 8 12 34 56 78", "12+34", "061234", "+2126123456789"]) {
    it(`rejects "${input}"`, () => assert.equal(normalizePhone(input), null));
  }
});

describe("contactSchema", () => {
  const valid = {
    fullName: "Test Person",
    email: " Person@Example.COM ",
    phone: "",
    subject: "Question",
    message: "A message long enough.",
    consent: "on",
    locale: "ar",
    sourcePath: "/ar/contact",
  };

  it("accepts a valid message and normalizes fields", () => {
    const result = contactSchema.parse(valid);
    assert.equal(result.email, "person@example.com");
    assert.equal(result.phone, null);
    assert.equal(result.consent, true);
    assert.equal(result.locale, "ar");
  });

  it("requires consent", () => {
    const result = contactSchema.safeParse({ ...valid, consent: undefined });
    assert.equal(result.success, false);
    assert.equal(toFieldErrors(result.error!).consent, "consent_required");
  });

  it("reports precise error codes", () => {
    const result = contactSchema.safeParse({ ...valid, email: "nope", message: "short", fullName: "" });
    assert.equal(result.success, false);
    const errors = toFieldErrors(result.error!);
    assert.equal(errors.email, "invalid_email");
    assert.equal(errors.message, "too_short");
    assert.equal(errors.fullName, "required");
  });

  it("rejects an invalid optional phone", () => {
    const result = contactSchema.safeParse({ ...valid, phone: "12" });
    assert.equal(toFieldErrors(result.error!).phone, "invalid_phone");
  });

  it("falls back to fr for an unknown locale and drops a bad source path", () => {
    const result = contactSchema.parse({ ...valid, locale: "de", sourcePath: "https://evil.example" });
    assert.equal(result.locale, "fr");
    assert.equal(result.sourcePath, null);
  });
});

describe("quoteSchema + readQuoteItems", () => {
  function form(entries: Record<string, string>) {
    const data = new FormData();
    for (const [k, v] of Object.entries(entries)) data.append(k, v);
    return data;
  }

  it("reads catalog + custom rows and drops empty custom rows", () => {
    const items = readQuoteItems(
      form({
        "items.0.productId": "b0000000-0000-4000-8000-000000000001",
        "items.0.quantity": "10",
        "items.1.label": "Flyers A5",
        "items.1.quantity": "500",
        "items.1.specifications": "Couleur recto-verso",
        "items.2.label": "",
        "items.2.quantity": "1",
        "items.99.label": "ignored: index too large",
        "other.field": "x",
      }),
    );
    assert.equal(items.length, 2);
    assert.deepEqual(items[1], { label: "Flyers A5", quantity: "500", specifications: "Couleur recto-verso" });
  });

  const base = {
    fullName: "Buyer",
    email: "buyer@example.com",
    phone: "0612345678",
    preferredContact: "whatsapp",
    consent: "on",
    locale: "fr",
  };

  it("accepts multiple items and normalizes the phone", () => {
    const result = quoteSchema.parse({
      ...base,
      items: [
        { productId: "b0000000-0000-4000-8000-000000000001", quantity: "3" },
        { label: "Impression sur mesure", quantity: "250" },
      ],
    });
    assert.equal(result.phone, "+212612345678");
    assert.equal(result.items[1]!.quantity, 250);
    assert.equal(result.preferredContact, "whatsapp");
  });

  it("requires at least one item", () => {
    const result = quoteSchema.safeParse({ ...base, items: [] });
    assert.equal(toFieldErrors(result.error!).items, "no_items");
  });

  it("validates quantities and product ids per row", () => {
    const result = quoteSchema.safeParse({
      ...base,
      items: [
        { label: "x", quantity: "0" },
        { productId: "not-a-uuid", quantity: "1" },
      ],
    });
    const errors = toFieldErrors(result.error!);
    assert.equal(errors["items.0.quantity"], "invalid_quantity");
    assert.equal(errors["items.1.productId"], "invalid_item");
  });

  it("requires a phone for quotes", () => {
    const result = quoteSchema.safeParse({ ...base, phone: "", items: [{ label: "x", quantity: "1" }] });
    assert.equal(toFieldErrors(result.error!).phone, "required");
  });
});
