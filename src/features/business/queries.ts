import "server-only";
import { cache } from "react";
import { safeSearchTerm } from "@/features/admin/search";
import type { Database } from "@/lib/supabase/database.types";
import { createSessionClient } from "@/lib/supabase/server";
import { dayRange } from "./dates";
import { dbMilli } from "./money";

/**
 * Reads of the business module (ADR-028). Always through the session client: RLS decides what
 * the signed-in member may see (business.read). Nothing here is cached across requests —
 * figures must reflect the latest recorded operation.
 */
type Enums = Database["public"]["Enums"];
export type OrderStatus = Enums["business_order_status"];
export type PaymentStatus = Enums["business_payment_status"];
export type PaymentMethod = Enums["business_payment_method"];
export type MovementType = Enums["business_movement_type"];
export type Treatment = Enums["business_expense_treatment"];
export type ActivityType = Enums["business_activity_type"];
export type ItemType = Enums["business_item_type"];
export type LineKind = Enums["business_line_kind"];

export const BUSINESS_BUCKET = "business-files";
const LIST_LIMIT = 200;

/** Staff display names (staff.read is part of every business role). */
export const staffNames = cache(async (): Promise<Map<string, string>> => {
  const db = await createSessionClient();
  const { data } = await db.from("admin_profiles").select("id, full_name, email");
  return new Map((data ?? []).map((p) => [p.id, p.full_name ?? p.email ?? "—"]));
});

export async function signedUrls(paths: string[], seconds = 60 * 30): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  const db = await createSessionClient();
  const { data } = await db.storage.from(BUSINESS_BUCKET).createSignedUrls(paths, seconds);
  return new Map((data ?? []).flatMap((s) => (s.path && s.signedUrl ? [[s.path, s.signedUrl] as const] : [])));
}

// ─── Categories & suppliers ─────────────────────────────────────────────────
export async function listCategories(kind?: Enums["business_category_kind"]) {
  const db = await createSessionClient();
  let query = db.from("business_categories").select("*").order("sort_order").order("name");
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function listSuppliers() {
  const db = await createSessionClient();
  const { data, error } = await db.from("business_suppliers").select("*").order("is_archived").order("name");
  return { data: data ?? [], error };
}

// ─── Products & stock ───────────────────────────────────────────────────────
export type ProductView = "active" | "low" | "archived";

export function isLowStock(p: { track_stock: boolean; min_stock: number | null; quantity_on_hand: number }): boolean {
  return p.track_stock && p.min_stock !== null && dbMilli(p.quantity_on_hand) <= dbMilli(p.min_stock);
}

export async function listProducts({ q, view = "active", category }: { q?: string; view?: ProductView; category?: string }) {
  const db = await createSessionClient();
  let query = db
    .from("business_products")
    .select("*, business_categories(name)")
    .eq("is_archived", view === "archived")
    .order("name")
    .limit(500);
  const term = safeSearchTerm(q);
  if (term) query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
  if (category) query = query.eq("category_id", category);
  const { data, error } = await query;
  const rows = data ?? [];
  return { data: view === "low" ? rows.filter(isLowStock) : rows, error };
}

/** Active items for the sale / purchase forms. */
export async function productOptions() {
  const db = await createSessionClient();
  const { data } = await db
    .from("business_products")
    .select("id, name, sku, unit, item_type, track_stock, quantity_on_hand, selling_price, purchase_cost")
    .eq("is_archived", false)
    .order("name")
    .limit(1000);
  return data ?? [];
}

export async function getProduct(id: string) {
  const db = await createSessionClient();
  const [{ data: product }, { data: movements }] = await Promise.all([
    db.from("business_products").select("*, business_categories(name)").eq("id", id).maybeSingle(),
    db
      .from("inventory_movements")
      .select("*, business_sales(id, number), business_expenses(id, label)")
      .eq("product_id", id)
      .order("occurred_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  return { product, movements: movements ?? [] };
}

export async function listMovements({ type, from, to, product }: { type?: MovementType; from: string; to: string; product?: string }) {
  const db = await createSessionClient();
  const range = dayRange(from, to);
  let query = db
    .from("inventory_movements")
    .select("*, business_products(id, name, unit), business_sales(id, number), business_expenses(id, label)")
    .gte("occurred_at", range.start)
    .lt("occurred_at", range.end)
    .order("occurred_at", { ascending: false })
    .limit(LIST_LIMIT);
  if (type) query = query.eq("movement_type", type);
  if (product) query = query.eq("product_id", product);
  const { data, error } = await query;
  return { data: data ?? [], error };
}

// ─── Customers ──────────────────────────────────────────────────────────────
export async function listCustomers({ q, archived = false }: { q?: string; archived?: boolean }) {
  const db = await createSessionClient();
  let query = db.from("business_customers").select("*").eq("is_archived", archived).order("name").limit(LIST_LIMIT);
  const term = safeSearchTerm(q);
  if (term) query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,contact_name.ilike.%${term}%`);
  const { data, error } = await query;
  const ids = (data ?? []).map((c) => c.id);
  const { data: balances } = ids.length
    ? await db.from("business_customer_balances").select("*").in("customer_id", ids)
    : { data: [] };
  const byId = new Map((balances ?? []).map((b) => [b.customer_id, b]));
  return { data: (data ?? []).map((c) => ({ ...c, balance: byId.get(c.id) ?? null })), error };
}

export async function customerOptions() {
  const db = await createSessionClient();
  const { data } = await db.from("business_customers").select("id, name, phone").eq("is_archived", false).order("name").limit(2000);
  return data ?? [];
}

export async function getCustomer(id: string) {
  const db = await createSessionClient();
  const [{ data: customer }, { data: balance }, { data: sales }, { data: payments }, { data: notes }, { data: requests }, { data: inquiries }] = await Promise.all([
    db.from("business_customers").select("*").eq("id", id).maybeSingle(),
    db.from("business_customer_balances").select("*").eq("customer_id", id).maybeSingle(),
    db.from("business_sales").select("id, number, sold_at, total, amount_paid, balance, order_status, payment_status").eq("customer_id", id).order("sold_at", { ascending: false }).limit(100),
    db.from("business_payments").select("id, sale_id, amount, method, paid_at, is_void, business_sales(number)").eq("customer_id", id).order("paid_at", { ascending: false }).limit(100),
    db.from("business_customer_notes").select("*").eq("customer_id", id).order("created_at", { ascending: false }).limit(100),
    // RLS: only returned when the member may read requests / messages.
    db.from("quotation_requests").select("id, reference, kind, status, created_at").eq("customer_id", id).order("created_at", { ascending: false }),
    db.from("inquiries").select("id, reference, subject, status, created_at").eq("customer_id", id).order("created_at", { ascending: false }),
  ]);
  return { customer, balance, sales: sales ?? [], payments: payments ?? [], notes: notes ?? [], requests: requests ?? [], inquiries: inquiries ?? [] };
}

// ─── Sales ──────────────────────────────────────────────────────────────────
export async function listSales({ status, payment, q, from, to }: { status?: OrderStatus; payment?: PaymentStatus; q?: string; from?: string; to?: string }) {
  const db = await createSessionClient();
  let query = db
    .from("business_sales")
    .select("id, number, sold_at, total, amount_paid, balance, order_status, payment_status, customer_id, business_customers(id, name)")
    .order("sold_at", { ascending: false })
    .limit(LIST_LIMIT);
  if (status) query = query.eq("order_status", status);
  if (payment) query = query.eq("payment_status", payment);
  if (from) {
    const range = dayRange(from, to ?? from);
    query = query.gte("sold_at", range.start).lt("sold_at", range.end);
  }
  const term = safeSearchTerm(q);
  if (term) query = query.ilike("number", `%${term}%`);
  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function getSale(id: string) {
  const db = await createSessionClient();
  const [{ data: sale }, { data: items }, { data: payments }, { data: events }] = await Promise.all([
    db.from("business_sales").select("*, business_customers(id, name, phone), quotation_requests(id, reference)").eq("id", id).maybeSingle(),
    db.from("business_sale_items").select("*").eq("sale_id", id).order("position"),
    db.from("business_payments").select("*").eq("sale_id", id).order("paid_at"),
    db.from("business_sale_events").select("*").eq("sale_id", id).order("created_at"),
  ]);
  return { sale, items: items ?? [], payments: payments ?? [], events: events ?? [] };
}

// ─── Expenses ───────────────────────────────────────────────────────────────
export async function listExpenses({ from, to, treatment, category }: { from: string; to: string; treatment?: Treatment; category?: string }) {
  const db = await createSessionClient();
  let query = db
    .from("business_expenses")
    .select("*, business_categories(name), business_suppliers(name)")
    .gte("expense_date", from)
    .lte("expense_date", to)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (treatment) query = query.eq("treatment", treatment);
  if (category) query = query.eq("category_id", category);
  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function getExpense(id: string) {
  const db = await createSessionClient();
  const [{ data: expense }, { data: items }, { data: files }] = await Promise.all([
    db.from("business_expenses").select("*, business_categories(name), business_suppliers(name)").eq("id", id).maybeSingle(),
    db.from("business_expense_items").select("*, business_products(id, name, unit)").eq("expense_id", id),
    db.from("business_attachments").select("*").eq("entity_type", "expense").eq("entity_id", id).order("created_at"),
  ]);
  const urls = await signedUrls((files ?? []).map((f) => f.storage_path));
  return { expense, items: items ?? [], files: (files ?? []).map((f) => ({ ...f, url: urls.get(f.storage_path) ?? null })) };
}

// ─── Daily journal ──────────────────────────────────────────────────────────
export async function listActivities(day: string) {
  const db = await createSessionClient();
  const range = dayRange(day);
  const { data: activities, error } = await db
    .from("business_activities")
    .select("*, business_customers(id, name), business_sales(id, number)")
    .gte("occurred_at", range.start)
    .lt("occurred_at", range.end)
    .order("occurred_at", { ascending: true })
    .limit(300);
  const ids = (activities ?? []).map((a) => a.id);
  const [{ data: comments }, { data: files }] = ids.length
    ? await Promise.all([
        db.from("business_activity_comments").select("*").in("activity_id", ids).order("created_at"),
        db.from("business_attachments").select("*").eq("entity_type", "activity").in("entity_id", ids).order("created_at"),
      ])
    : [{ data: [] }, { data: [] }];
  const urls = await signedUrls((files ?? []).map((f) => f.storage_path));
  return {
    error,
    data: (activities ?? []).map((a) => ({
      ...a,
      comments: (comments ?? []).filter((c) => c.activity_id === a.id),
      files: (files ?? []).filter((f) => f.entity_id === a.id).map((f) => ({ ...f, url: urls.get(f.storage_path) ?? null })),
    })),
  };
}

/** Recent sales for the journal's "related sale" select. */
export async function recentSaleOptions() {
  const db = await createSessionClient();
  const { data } = await db.from("business_sales").select("id, number, business_customers(name)").order("sold_at", { ascending: false }).limit(50);
  return data ?? [];
}

export async function staffOptions() {
  const db = await createSessionClient();
  const { data } = await db.from("admin_profiles").select("id, full_name, email").eq("is_active", true).order("full_name");
  return (data ?? []).map((p) => ({ value: p.id, label: p.full_name ?? p.email ?? p.id }));
}

// ─── Team ───────────────────────────────────────────────────────────────────
export async function getTeam() {
  const db = await createSessionClient();
  const [{ data: staff, error }, { data: assignments }, { data: roles }, { data: grants }, { data: permissions }] = await Promise.all([
    db.from("admin_profiles").select("id, full_name, email, kind, is_active, job_title").order("full_name"),
    db.from("staff_roles").select("staff_id, role_id"),
    db.from("roles").select("*").order("is_system", { ascending: false }).order("name"),
    db.from("role_permissions").select("role_id, permission_key"),
    db.from("permissions").select("*").order("sort_order"),
  ]);
  return { staff: staff ?? [], assignments: assignments ?? [], roles: roles ?? [], grants: grants ?? [], permissions: permissions ?? [], error };
}

// ─── Phase 2: overview, closing, reports, tasks ─────────────────────────────
export type TaskStatus = Enums["business_task_status"];
export type TaskPriority = Enums["business_task_priority"];

/** Every overview / closing figure, computed by Postgres (business_period_summary). */
export async function periodSummary(from: string, to: string) {
  const db = await createSessionClient();
  const { data, error } = await db.rpc("business_period_summary", { p_from: from, p_to: to });
  if (error) console.error("[business] period summary", error.message);
  return { data, error };
}

/** Latest sales, payments and expenses merged (most recent first). */
export async function recentTransactions(limit = 8) {
  const db = await createSessionClient();
  const [{ data: sales }, { data: payments }, { data: expenses }] = await Promise.all([
    db.from("business_sales").select("id, number, sold_at, total, order_status, business_customers(name)").order("sold_at", { ascending: false }).limit(limit),
    db.from("business_payments").select("id, sale_id, amount, method, paid_at, is_void, business_sales(number)").order("paid_at", { ascending: false }).limit(limit),
    db.from("business_expenses").select("id, label, amount, treatment, expense_date, created_at, is_void").order("created_at", { ascending: false }).limit(limit),
  ]);
  type Row = { key: string; kind: "sale" | "payment" | "expense"; at: string; href: string; title: string; amount: number; muted: boolean };
  const rows: Row[] = [
    ...(sales ?? []).map((s) => ({ key: `s-${s.id}`, kind: "sale" as const, at: s.sold_at, href: `/admin/business/sales/${s.id}`, title: s.business_customers?.name ? `${s.number} · ${s.business_customers.name}` : s.number, amount: s.total, muted: s.order_status === "cancelled" })),
    ...(payments ?? []).map((p) => ({ key: `p-${p.id}`, kind: "payment" as const, at: p.paid_at, href: `/admin/business/sales/${p.sale_id}`, title: p.business_sales?.number ?? "", amount: p.amount, muted: p.is_void })),
    ...(expenses ?? []).map((e) => ({ key: `e-${e.id}`, kind: "expense" as const, at: e.created_at, href: `/admin/business/expenses/${e.id}`, title: e.label, amount: e.amount, muted: e.is_void })),
  ];
  return rows.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

export async function recentActivities(limit = 6) {
  const db = await createSessionClient();
  const { data } = await db.from("business_activities").select("id, activity_type, title, occurred_at, responsible_id").order("occurred_at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function lowStockProducts(limit = 6) {
  const { data } = await listProducts({ view: "low" });
  return data.slice(0, limit);
}

export async function reportForDay(day: string) {
  const db = await createSessionClient();
  const { data } = await db.from("business_daily_reports").select("id, status, closed_at, closed_by").eq("report_date", day).maybeSingle();
  return data;
}

export async function lastReport() {
  const db = await createSessionClient();
  const { data } = await db.from("business_daily_reports").select("id, report_date").order("report_date", { ascending: false }).limit(1).maybeSingle();
  return data;
}

export async function listReports() {
  const db = await createSessionClient();
  const { data, error } = await db
    .from("business_daily_reports")
    .select("id, report_date, status, version, summary, closed_by, closed_at")
    .order("report_date", { ascending: false })
    .limit(120);
  return { data: data ?? [], error };
}

export async function getReport(id: string) {
  const db = await createSessionClient();
  const [{ data: report }, { data: corrections }, { data: comments }, { data: tasks }] = await Promise.all([
    db.from("business_daily_reports").select("*").eq("id", id).maybeSingle(),
    db.from("business_report_corrections").select("*").eq("report_id", id).order("version"),
    db.from("business_report_comments").select("*").eq("report_id", id).order("created_at"),
    db.from("business_tasks").select("id, title, status, assigned_to, due_date").eq("report_id", id).order("created_at"),
  ]);
  return { report, corrections: corrections ?? [], comments: comments ?? [], tasks: tasks ?? [] };
}

export type TaskView = "open" | "mine" | "overdue" | "done";

export async function listTasks({ view = "open", userId, today, limit = 200 }: { view?: TaskView; userId: string; today: string; limit?: number }) {
  const db = await createSessionClient();
  let query = db
    .from("business_tasks")
    .select("id, title, status, priority, due_date, assigned_to, created_by, created_at, completed_at, business_customers(id, name), business_sales(id, number)")
    .limit(limit);
  if (view === "done") query = query.eq("status", "completed").order("completed_at", { ascending: false });
  else {
    query = query.neq("status", "completed").order("due_date", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
    if (view === "mine") query = query.eq("assigned_to", userId);
    if (view === "overdue") query = query.lt("due_date", today);
  }
  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function getTask(id: string) {
  const db = await createSessionClient();
  const [{ data: task }, { data: comments }] = await Promise.all([
    db.from("business_tasks").select("*, business_customers(id, name), business_sales(id, number), business_daily_reports(id, report_date)").eq("id", id).maybeSingle(),
    db.from("business_task_comments").select("*").eq("task_id", id).order("created_at"),
  ]);
  return { task, comments: comments ?? [] };
}

// ─── Phase 3: analytics & notifications ─────────────────────────────────────
export async function analytics(from: string, to: string, granularity: "day" | "week" | "month") {
  const db = await createSessionClient();
  const { data, error } = await db.rpc("business_analytics", { p_from: from, p_to: to, p_granularity: granularity });
  if (error) console.error("[business] analytics", error.message);
  return { data, error };
}

/** Adds due "overdue task" notices for the member, then returns their unread count. */
export const unreadNotifications = cache(async (): Promise<number> => {
  const db = await createSessionClient();
  const { data, error } = await db.rpc("business_sync_notifications");
  if (error) {
    console.error("[business] notifications sync", error.message);
    return 0;
  }
  return data ?? 0;
});

export async function listNotifications(limit = 100) {
  const db = await createSessionClient();
  const { data, error } = await db.from("notifications").select("*").order("created_at", { ascending: false }).limit(limit);
  return { data: data ?? [], error };
}
