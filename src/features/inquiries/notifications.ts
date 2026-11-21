import "server-only";
import { getDictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { emailConfig, sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/env";
import { getServerEnv } from "@/lib/server-env";
import { createPublicClient } from "@/lib/supabase/public";
import type { ContactInput, QuoteInput } from "./schema";

/**
 * Notification emails, run with after() once the submission is stored.
 * Internal email (French, for MSLAB staff) + acknowledgment to the customer in their locale.
 * The outcome is written back to the row so admins can see unsent notifications.
 */

async function recordOutcome(kind: "contact" | "quote", reference: string, error: string | null) {
  const { error: rpcError } = await createPublicClient().rpc("record_submission_notification", {
    kind,
    reference,
    error_message: error,
    submission_key: getServerEnv().FORM_SUBMISSION_KEY,
  });
  if (rpcError) console.error("[notifications] could not record outcome", rpcError.code);
}

async function acknowledge(locale: ContactInput["locale"], to: string, name: string, reference: string, kind: "contact" | "quote") {
  const dict = await getDictionary(locale);
  return sendEmail({
    to,
    subject: format(dict.emails.ackSubject, { reference }),
    text: [
      format(dict.emails.ackGreeting, { name }),
      "",
      kind === "contact" ? dict.emails.ackContactBody : dict.emails.ackQuoteBody,
      "",
      format(dict.emails.ackReference, { reference }),
      "",
      "MSLAB",
      siteUrl,
      "",
      dict.emails.ackFooter,
    ].join("\n"),
  });
}

async function deliver(kind: "contact" | "quote", reference: string, internal: { subject: string; text: string; replyTo: string }, ack: () => Promise<{ ok: boolean; error?: string }>) {
  const config = emailConfig();
  if (!config.enabled || !config.notifyTo) {
    // Provider not configured yet (ADR-008): keep the lead, flag it for the admin. No PII in logs.
    await recordOutcome(kind, reference, "email_disabled");
    console.info(`[notifications] ${kind} ${reference} stored; email delivery disabled`);
    return;
  }
  const internalResult = await sendEmail({ to: config.notifyTo, ...internal });
  const ackResult = await ack();
  const errors = [internalResult, ackResult].filter((r) => !r.ok).map((r) => ("error" in r ? r.error : "unknown"));
  await recordOutcome(kind, reference, errors.length ? errors.join(", ") : null);
}

export async function notifyContact(input: ContactInput, reference: string) {
  const text = [
    `Nouveau message de contact — ${reference}`,
    "",
    `Nom : ${input.fullName}`,
    `E-mail : ${input.email}`,
    `Téléphone : ${input.phone ?? "—"}`,
    `Langue : ${input.locale}`,
    `Objet : ${input.subject}`,
    "",
    input.message,
    "",
    `Administration : ${siteUrl}/admin/inquiries?ref=${encodeURIComponent(reference)}`,
  ].join("\n");

  await deliver(
    "contact",
    reference,
    { subject: `[MSLAB] Contact ${reference}`, text, replyTo: input.email },
    () => acknowledge(input.locale, input.email, input.fullName, reference, "contact"),
  );
}

export async function notifyQuote(input: QuoteInput, reference: string, productNames: Map<string, string>) {
  const lines = input.items.map((item, index) => {
    const name = item.productId ? (productNames.get(item.productId) ?? `Produit ${item.productId}`) : `[Sur mesure] ${item.label}`;
    const specs = item.specifications ? `\n     ${item.specifications}` : "";
    return `  ${index + 1}. ${name} × ${item.quantity}${specs}`;
  });

  const text = [
    `Nouvelle demande de devis — ${reference}`,
    "",
    `Nom : ${input.fullName}`,
    `Entreprise : ${input.companyName ?? "—"}`,
    `E-mail : ${input.email}`,
    `Téléphone : ${input.phone}`,
    `Contact préféré : ${input.preferredContact}`,
    `Langue : ${input.locale}`,
    "",
    "Articles :",
    ...lines,
    "",
    input.message ? `Précisions :\n${input.message}\n` : "",
    `Administration : ${siteUrl}/admin/quotations?ref=${encodeURIComponent(reference)}`,
  ].join("\n");

  await deliver(
    "quote",
    reference,
    { subject: `[MSLAB] Devis ${reference}`, text, replyTo: input.email },
    () => acknowledge(input.locale, input.email, input.fullName, reference, "quote"),
  );
}

/** Print-on-demand request (custom production): same pipeline as a quote. */
export async function notifyCustomRequest(
  input: Pick<QuoteInput, "fullName" | "companyName" | "email" | "phone" | "preferredContact" | "locale"> & {
    projectType: string;
    description: string;
    quantity: number;
    dimensions: string | null;
    material: string | null;
    deadline: string | null;
  },
  reference: string,
) {
  const text = [
    `Nouvelle demande d'impression à la demande — ${reference}`,
    "",
    `Nom : ${input.fullName}`,
    `Entreprise : ${input.companyName ?? "—"}`,
    `E-mail : ${input.email}`,
    `Téléphone : ${input.phone}`,
    `Contact préféré : ${input.preferredContact}`,
    `Langue : ${input.locale}`,
    "",
    `Projet : ${input.projectType}`,
    `Quantité : ${input.quantity}`,
    `Dimensions : ${input.dimensions ?? "—"}`,
    `Matière : ${input.material ?? "—"}`,
    `Date souhaitée : ${input.deadline ?? "—"}`,
    "",
    input.description,
    "",
    "Fichiers et finitions : voir l'administration.",
    `Administration : ${siteUrl}/admin/quotations?ref=${encodeURIComponent(reference)}`,
  ].join("\n");

  await deliver(
    "quote",
    reference,
    { subject: `[MSLAB] Impression à la demande ${reference}`, text, replyTo: input.email },
    () => acknowledge(input.locale, input.email, input.fullName, reference, "quote"),
  );
}

export async function notifyDigitalRequest(
  input: Pick<QuoteInput, "fullName" | "companyName" | "email" | "phone" | "preferredContact" | "locale"> & {
    projectTypes: string[];
    features: string[];
    description: string;
    existingWebsite: string | null;
    budget: string | null;
    deadline: string | null;
  },
  reference: string,
) {
  // Internal e-mail in French: labels from the French dictionary (keys are stable).
  const f = (await getDictionary("fr")).digitalForm;
  const label = (map: Record<string, string>, key: string) => map[key] ?? key;
  const text = [
    `Nouvelle demande Solutions digitales — ${reference}`,
    "",
    `Nom : ${input.fullName}`,
    `Entreprise : ${input.companyName ?? "—"}`,
    `E-mail : ${input.email}`,
    `Téléphone : ${input.phone}`,
    `Contact préféré : ${input.preferredContact}`,
    `Langue : ${input.locale}`,
    "",
    `Type de projet : ${input.projectTypes.map((k) => label(f.projectTypes, k)).join(", ")}`,
    `Fonctionnalités : ${input.features.length ? input.features.map((k) => label(f.features, k)).join(", ") : "—"}`,
    `Site actuel : ${input.existingWebsite ?? "—"}`,
    `Budget indicatif : ${input.budget ?? "—"}`,
    `Date souhaitée : ${input.deadline ?? "—"}`,
    "",
    input.description,
    "",
    `Administration : ${siteUrl}/admin/quotations?ref=${encodeURIComponent(reference)}`,
  ].join("\n");

  await deliver(
    "quote",
    reference,
    { subject: `[MSLAB] Solutions digitales ${reference}`, text, replyTo: input.email },
    () => acknowledge(input.locale, input.email, input.fullName, reference, "quote"),
  );
}
