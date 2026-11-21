/**
 * Integration tests against the DEV Supabase project through the public REST API
 * (publishable key = anonymous visitor). Never point this at production.
 *
 *   npm run test:integration
 *
 * Creates rows in inquiries / quotation_requests with emails @example.com;
 * clean up with supabase/seed/remove_test_submissions.sql.
 */
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { createClient } from "@supabase/supabase-js";
// Type-only import: erased by Node's type stripping, resolved by tsc.
import type { Database, Json } from "../../src/lib/supabase/database.types";

type Payload = { [key: string]: Json };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const submissionKey = process.env.FORM_SUBMISSION_KEY;
if (!url || !key || !submissionKey) throw new Error("Missing env — run with --env-file=.env.local");
if (!url.includes("xccgcoznshndfquwsuwq")) throw new Error("Refusing to run: not the mslab-dev project");

const db = createClient<Database>(url, key, { auth: { persistSession: false } });
const ipHash = (seed: string) => createHash("sha256").update(seed).digest("hex");

// Real published products, if MSLAB has added any (no product is seeded; tests that need two
// skip until then).
const { data: publishedRows } = await db.from("products").select("id").limit(2);
const [PUBLISHED_PRODUCT, PUBLISHED_PRODUCT_2] = (publishedRows ?? []).map((p) => p.id);
// Not a published product (former sample id, deleted by initial_catalog.sql).
const DRAFT_PRODUCT = "b0000000-0000-4000-8000-000000000006";
// Snapshot preservation after product deletion needs admin rights to delete the product;
// it is verified with SQL (docs/DATABASE_SCHEMA.md §5) and by the admin E2E tests in M6/M8.

function contactPayload(overrides: Payload = {}): Payload {
  return {
    submission_id: randomUUID(),
    full_name: "Test Visitor",
    email: "visitor@example.com",
    phone: null,
    subject: "Integration test",
    message: "Automated integration test message.",
    locale: "fr",
    source_path: "/fr/contact",
    consent: true,
    ip_hash: ipHash(`contact-${randomUUID()}`),
    ...overrides,
  };
}

function quotePayload(items: Json[], overrides: Payload = {}): Payload {
  return {
    submission_id: randomUUID(),
    full_name: "Test Buyer",
    email: "buyer@example.com",
    phone: "+212500000000",
    company_name: "Test Company (integration)",
    message: "Automated integration test.",
    preferred_contact: "email",
    locale: "en",
    source_path: "/en/quote",
    consent: true,
    ip_hash: ipHash(`quote-${randomUUID()}`),
    items,
    ...overrides,
  };
}

describe("public catalog reads (RLS)", () => {
  it("returns published products only — never drafts", async () => {
    const { data, error } = await db.from("products").select("id, status");
    assert.equal(error, null);
    assert.ok(data);
    assert.ok(data.every((p) => p.status === "published"));
    assert.ok(!data.some((p) => p.id === DRAFT_PRODUCT));
  });

  it("cannot read customer data", async () => {
    for (const table of ["inquiries", "quotation_requests", "quotation_items", "admin_profiles"] as const) {
      const { data, error } = await db.from(table).select("id").limit(1);
      assert.ok(error || (data && data.length === 0), `${table} must not be readable`);
    }
  });

  it("cannot write catalog rows", async () => {
    const { error } = await db.from("products").insert({ name_fr: "x", slug_fr: "anon-write" });
    assert.ok(error, "anonymous insert must fail");
  });
});

describe("contact inquiry RPC", () => {
  it("accepts a valid submission and returns a reference", async () => {
    const { data, error } = await db.rpc("submit_contact_inquiry", { payload: contactPayload(), submission_key: submissionKey });
    assert.equal(error, null);
    assert.match(String(data), /^MSC-\d{4}-\d{6}$/);
  });

  it("is idempotent for the same submission_id", async () => {
    const payload = contactPayload();
    const first = await db.rpc("submit_contact_inquiry", { payload, submission_key: submissionKey });
    const second = await db.rpc("submit_contact_inquiry", { payload, submission_key: submissionKey });
    assert.equal(first.error, null);
    assert.equal(second.data, first.data);
  });

  it("rejects calls without the server submission key", async () => {
    const { error } = await db.rpc("submit_contact_inquiry", { payload: contactPayload(), submission_key: "not-the-key" });
    assert.ok(error);
    assert.match(error.message, /forbidden/);
  });

  it("enforces database constraints (invalid email)", async () => {
    const { error } = await db.rpc("submit_contact_inquiry", {
      payload: contactPayload({ email: "not-an-email" }),
      submission_key: submissionKey,
    });
    assert.ok(error);
  });

  it("rate limits after 5 submissions per IP hash in 10 minutes", async () => {
    const ip = ipHash(`rate-${randomUUID()}`);
    for (let i = 0; i < 5; i++) {
      const accepted: { error: unknown } = await db.rpc("submit_contact_inquiry", { payload: contactPayload({ ip_hash: ip }), submission_key: submissionKey });
      assert.equal(accepted.error, null, `submission ${i + 1} should pass`);
    }
    const blocked = await db.rpc("submit_contact_inquiry", { payload: contactPayload({ ip_hash: ip }), submission_key: submissionKey });
    assert.ok(blocked.error);
    assert.match(blocked.error.message, /rate_limited/);
  });
});

describe("quotation request RPC", () => {
  it("stores multiple catalog items plus a custom item", { skip: !PUBLISHED_PRODUCT_2 && "needs two published products" }, async () => {
    const { data, error } = await db.rpc("submit_quotation_request", {
      payload: quotePayload([
        { product_id: PUBLISHED_PRODUCT, quantity: 100, specifications: "Integration item 1" },
        { product_id: PUBLISHED_PRODUCT_2, quantity: 5 },
        { label: "Custom printing job (integration test)", quantity: 250, specifications: "Custom spec" },
      ]),
      submission_key: submissionKey,
    });
    assert.equal(error, null);
    assert.match(String(data), /^MSQ-\d{4}-\d{6}$/);
  });

  it("rejects products that are not published and stores nothing", async () => {
    const { error } = await db.rpc("submit_quotation_request", {
      payload: quotePayload([{ product_id: DRAFT_PRODUCT, quantity: 1 }], { company_name: "SHOULD-NOT-EXIST" }),
      submission_key: submissionKey,
    });
    assert.ok(error);
    assert.match(error.message, /invalid_product/);
  });

  it("rejects empty item lists and invalid quantities", async () => {
    const empty = await db.rpc("submit_quotation_request", { payload: quotePayload([]), submission_key: submissionKey });
    assert.ok(empty.error);
    const zero = await db.rpc("submit_quotation_request", {
      payload: quotePayload([{ label: "Zero quantity", quantity: 0 }]),
      submission_key: submissionKey,
    });
    assert.ok(zero.error);
  });
});
