import type { StatusLabel, Tone } from "@/features/admin/labels";
import type { BusinessDict } from "./dictionary";
import type { MovementType, OrderStatus, PaymentStatus } from "./queries";

/** Badge colours of the business statuses; text from the business dictionary. Pure module. */
const ORDER_TONES: Record<OrderStatus, Tone> = {
  new: "accent",
  confirmed: "accent",
  in_production: "warning",
  ready: "success",
  delivered: "neutral",
  cancelled: "danger",
};
const PAYMENT_TONES: Record<PaymentStatus, Tone> = { unpaid: "danger", partial: "warning", paid: "success" };

export const orderStatusLabel = (b: BusinessDict, s: OrderStatus): StatusLabel => ({ label: b.orderStatus[s], tone: ORDER_TONES[s] });
export const paymentStatusLabel = (b: BusinessDict, s: PaymentStatus): StatusLabel => ({ label: b.paymentStatus[s], tone: PAYMENT_TONES[s] });

export const ORDER_STATUSES = Object.keys(ORDER_TONES) as OrderStatus[];
export const OPEN_ORDER_STATUSES = ORDER_STATUSES.filter((s) => s !== "cancelled");
export const PAYMENT_STATUSES = Object.keys(PAYMENT_TONES) as PaymentStatus[];
export const PAYMENT_METHODS = ["cash", "transfer", "cheque", "card", "other"] as const;
export const MOVEMENT_TYPES: MovementType[] = ["initial", "entry", "purchase", "purchase_void", "exit", "sale", "sale_return", "damage", "loss", "adjustment"];
export const ACTIVITY_TYPES = [
  "production_completed",
  "customer_meeting",
  "new_order",
  "delivery",
  "supplier_visit",
  "purchase",
  "maintenance",
  "administrative",
  "incident",
  "other",
] as const;
export const MANUAL_MOVEMENTS = ["entry", "exit", "damage", "loss", "adjustment"] as const;

export const movementTone = (type: MovementType, quantity: number): Tone =>
  type === "damage" || type === "loss" ? "danger" : type === "adjustment" ? "warning" : quantity > 0 ? "success" : "neutral";
