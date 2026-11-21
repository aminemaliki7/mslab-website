import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DIGITAL_FEATURES, DIGITAL_PROJECT_TYPES, digitalRequestSchema } from "../../src/features/digital/schema.ts";
import { toFieldErrors } from "../../src/features/inquiries/schema.ts";

/** Digital Solutions request (web project): server-side validation. */
const valid = {
  projectTypes: ["ecommerce", "uiux"],
  description: "Boutique en ligne pour nos produits, en français et en arabe.",
  features: ["multilingual", "payment"],
  existingWebsite: "",
  budget: "",
  deadline: "",
  fullName: "Test Client",
  email: "client@example.com",
  phone: "06 12 34 56 78",
  companyName: "",
  preferredContact: "email",
  consent: "on",
  locale: "fr",
  sourcePath: "/fr/services/solutions-digitales",
};

const errors = (input: Record<string, unknown>) => {
  const result = digitalRequestSchema.safeParse(input);
  return result.success ? {} : toFieldErrors(result.error);
};

describe("digitalRequestSchema", () => {
  it("accepts a complete request and normalizes it", () => {
    const result = digitalRequestSchema.parse({ ...valid, projectTypes: ["ecommerce", "ecommerce", "uiux"] });
    assert.deepEqual(result.projectTypes, ["ecommerce", "uiux"]);
    assert.equal(result.phone, "+212612345678");
    assert.equal(result.existingWebsite, null);
    assert.equal(result.budget, null);
    assert.equal(result.companyName, null);
  });

  it("requires at least one project type", () => {
    assert.equal(errors({ ...valid, projectTypes: [] }).projectTypes, "required");
  });

  it("rejects unknown project types and features", () => {
    assert.equal(errors({ ...valid, projectTypes: ["hacking"] })["projectTypes.0"], "invalid_option");
    assert.equal(errors({ ...valid, features: ["crypto"] })["features.0"], "invalid_option");
  });

  it("adds https:// to a bare domain and rejects invalid addresses", () => {
    assert.equal(digitalRequestSchema.parse({ ...valid, existingWebsite: "exemple.ma" }).existingWebsite, "https://exemple.ma/");
    assert.equal(errors({ ...valid, existingWebsite: "not a site" }).existingWebsite, "invalid_url");
    assert.equal(errors({ ...valid, existingWebsite: "javascript:alert(1)" }).existingWebsite, "invalid_url");
  });

  it("requires a description, a valid phone and consent", () => {
    const e = errors({ ...valid, description: "court", phone: "123", consent: undefined });
    assert.equal(e.description, "too_short");
    assert.equal(e.phone, "invalid_phone");
    assert.equal(e.consent, "consent_required");
  });

  it("rejects a launch date in the past", () => {
    assert.equal(errors({ ...valid, deadline: "2020-01-01" }).deadline, "invalid_date");
  });

  it("keys match the database allow-lists", () => {
    assert.deepEqual([...DIGITAL_PROJECT_TYPES], ["corporate", "ecommerce", "webapp", "platform", "uiux", "maintenance"]);
    assert.deepEqual([...DIGITAL_FEATURES], ["multilingual", "payment", "accounts", "booking", "content", "backoffice", "integrations", "seo"]);
  });
});
