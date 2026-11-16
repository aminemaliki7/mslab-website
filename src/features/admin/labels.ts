import type { Database } from "@/lib/supabase/database.types";
import { formatAdminDateTime, type AdminDict, type AdminLang } from "./dictionary";

type Enums = Database["public"]["Enums"];
export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";
export type StatusLabel = { label: string; tone: Tone };

/** Badge colors per status. Text comes from the admin dictionary (features/admin/dictionary.ts). */
const CONTENT_TONES: Record<Enums["content_status"], Tone> = { draft: "warning", published: "success", archived: "neutral" };

const QUOTATION_TONES: Record<Enums["quotation_status"], Tone> = {
  new: "accent",
  in_review: "warning",
  contacted: "warning",
  quoted: "accent",
  accepted: "success",
  in_production: "warning",
  ready: "success",
  delivered: "success",
  rejected: "danger",
  closed: "neutral",
};

const INQUIRY_TONES: Record<Enums["inquiry_status"], Tone> = { new: "accent", read: "neutral", replied: "success", closed: "neutral", spam: "danger" };

function withLabels<K extends string>(tones: Record<K, Tone>, labels: Record<K, string>): Record<K, StatusLabel> {
  return Object.fromEntries(Object.entries(tones).map(([key, tone]) => [key, { label: labels[key as K], tone }])) as Record<K, StatusLabel>;
}

export const contentStatuses = (t: AdminDict) => withLabels(CONTENT_TONES, t.status.content);
export const quotationStatuses = (t: AdminDict) => withLabels(QUOTATION_TONES, t.status.quotation);
export const inquiryStatuses = (t: AdminDict) => withLabels(INQUIRY_TONES, t.status.inquiry);

export const CONTENT_STATUS_KEYS = Object.keys(CONTENT_TONES) as Array<Enums["content_status"]>;
export const QUOTATION_STATUS_KEYS = Object.keys(QUOTATION_TONES) as Array<Enums["quotation_status"]>;
export const INQUIRY_STATUS_KEYS = Object.keys(INQUIRY_TONES) as Array<Enums["inquiry_status"]>;

/** French date formatting kept for server code that has no interface language (emails, logs). */
export function formatDateTime(value: string | null | undefined, lang: AdminLang = "fr"): string {
  return formatAdminDateTime(value, lang);
}
