import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";
import { failure, fromDb, type AdminActionState } from "@/features/admin/action-state";

/**
 * Business RPCs raise short machine codes (`raise exception 'insufficient_stock'`). They become
 * actionable French messages here (translated for display by translateMessage). Anything else
 * goes through the generic admin mapping — raw database errors never reach the screen.
 */
const CODES: Record<string, string> = {
  forbidden: "Action non autorisée.",
  insufficient_stock: "Stock insuffisant pour cet article.",
  overpayment: "Le montant dépasse le reste à payer.",
  sale_cancelled: "Cette vente est annulée.",
  has_payments: "Annulez d'abord les paiements de cette vente.",
  reason_required: "Motif obligatoire (3 caractères minimum).",
  future_date: "La date ne peut pas être dans le futur.",
  discount_too_high: "La remise dépasse le sous-total.",
  lines_exceed_amount: "Le total des articles dépasse le montant de la dépense.",
  product_not_found: "Article introuvable ou archivé.",
  not_stock_tracked: "Cet article ne suit pas de stock.",
  no_change: "Rien n'a changé.",
  already_void: "Déjà annulé.",
  invalid_items: "Ajoutez au moins une ligne.",
  invalid_amount: "Montant invalide.",
  invalid_quantity: "Quantité invalide.",
  user_not_found: "Aucun compte avec cet e-mail. Invitez d'abord la personne depuis Supabase.",
  already_staff: "Ce compte fait déjà partie de l'équipe.",
  last_administrator: "Au moins un administrateur actif doit rester.",
  protected_column: "Ce champ ne peut pas être modifié directement.",
  not_found: "Demande introuvable.",
  day_closed: "Cette journée est clôturée : seule une correction autorisée peut encore l'enregistrer.",
  already_closed: "Cette journée est déjà clôturée.",
  invalid_period: "Période invalide (400 jours maximum).",
  report_not_found: "Requête invalide.",
};

export function fromRpc(error: PostgrestError, context: string): AdminActionState {
  const code = error.message?.trim();
  if (code === "invalid_line") {
    const line = Number(error.details);
    return failure(Number.isInteger(line) && line > 0 ? `Ligne ${line} invalide.` : "Requête invalide.");
  }
  if (code && CODES[code]) {
    if (code !== "forbidden") console.info(`[business] ${context}: ${code}`);
    else console.warn(`[business] ${context}: forbidden`);
    return failure(CODES[code]);
  }
  return fromDb(error, context);
}

export const notAllowed = (): AdminActionState => failure("Action non autorisée.");
