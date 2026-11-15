import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];
export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

/** French labels for the back office (ADR-015). */
export const contentStatus: Record<Enums["content_status"], { label: string; tone: Tone }> = {
  draft: { label: "Brouillon", tone: "warning" },
  published: { label: "Publié", tone: "success" },
  archived: { label: "Archivé", tone: "neutral" },
};

export const quotationStatus: Record<Enums["quotation_status"], { label: string; tone: Tone }> = {
  new: { label: "Nouvelle", tone: "accent" },
  in_review: { label: "En cours d'étude", tone: "warning" },
  contacted: { label: "Client contacté", tone: "warning" },
  quoted: { label: "Devis envoyé", tone: "accent" },
  accepted: { label: "Acceptée", tone: "success" },
  in_production: { label: "En production", tone: "warning" },
  ready: { label: "Prête", tone: "success" },
  delivered: { label: "Livrée / remise", tone: "success" },
  rejected: { label: "Refusée", tone: "danger" },
  closed: { label: "Clôturée", tone: "neutral" },
};

export const inquiryStatus: Record<Enums["inquiry_status"], { label: string; tone: Tone }> = {
  new: { label: "Nouveau", tone: "accent" },
  read: { label: "Lu", tone: "neutral" },
  replied: { label: "Répondu", tone: "success" },
  closed: { label: "Clôturé", tone: "neutral" },
  spam: { label: "Spam", tone: "danger" },
};

export const contactMethod: Record<Enums["contact_method"], string> = {
  email: "E-mail",
  phone: "Téléphone",
  whatsapp: "WhatsApp",
};

export const localeLabel: Record<string, string> = { fr: "Français", ar: "Arabe", en: "Anglais" };

const dateTime = new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Casablanca" });
export function formatDateTime(value: string | null | undefined): string {
  return value ? dateTime.format(new Date(value)) : "—";
}
