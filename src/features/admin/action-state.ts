import type { PostgrestError } from "@supabase/supabase-js";
import type { z } from "zod";

/** Result of every admin mutation (rendered by <AdminForm>). */
export type AdminActionState = {
  ok: boolean | null;
  message: string | null;
  fieldErrors: Record<string, string>;
};

export const idle: AdminActionState = { ok: null, message: null, fieldErrors: {} };

export const success = (message: string): AdminActionState => ({ ok: true, message, fieldErrors: {} });

export const failure = (message: string, fieldErrors: Record<string, string> = {}): AdminActionState => ({
  ok: false,
  message,
  fieldErrors,
});

const FIELD_MESSAGES: Record<string, string> = {
  too_small: "Valeur trop courte ou manquante.",
  too_big: "Valeur trop longue.",
  invalid_format: "Format invalide.",
  invalid_type: "Valeur invalide.",
};

export function fromZod(error: z.ZodError): AdminActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message && !issue.message.startsWith("Invalid") ? issue.message : (FIELD_MESSAGES[issue.code] ?? "Valeur invalide.");
  }
  return failure("Le formulaire contient des erreurs.", fieldErrors);
}

/** Map Postgres errors to actionable French messages (never leak raw DB errors). */
export function fromDb(error: PostgrestError, context = ""): AdminActionState {
  console.error(`[admin] ${context}`, error.code, error.message);
  if (error.code === "23505") {
    const field = /slug_(fr|ar|en)/.exec(error.message)?.[0] ?? (error.message.includes("sku") ? "sku" : null);
    return failure("Cette valeur est déjà utilisée par un autre élément.", field ? { [field]: "Déjà utilisé." } : {});
  }
  if (error.code === "23503") return failure("Suppression impossible : cet élément est encore utilisé (ex. sous-catégories).");
  if (error.code === "23514") return failure("Une valeur ne respecte pas les règles (longueur, format).");
  if (error.code === "42501" || error.code === "PGRST301") return failure("Action non autorisée.");
  return failure("L'enregistrement a échoué. Réessayez.");
}
