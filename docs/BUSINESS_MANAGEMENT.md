# MSLAB — Business Management module (ADR-028)

> Status: **Phases 1, 2 and 3 implemented.** Phase 3 migration `20261129100000_business_phase3` applied to `mslab-dev` on 2026-11-27 (owner approval).
> Phase 2: Phase 2 migration `20261128100000_business_phase2` applied to `mslab-dev` on 2026-11-27 (owner approval).
>
> Phase 1: Migrations applied to `mslab-dev` on 2026-11-27 (ERP Phase 0 `…22100000/100/200`, then
> `20261127100000_business_management` + `20261127100100_business_guard_definer`), RPC/RLS tests run there in
> rolled-back transactions (no data left). Not applied to any production project (none exists yet).
> Lightweight operational CRM for the Gérant and remote monitoring for the Associés, inside the
> existing `/admin` back office. It is the first concrete slice of `docs/ERP_ARCHITECTURE.md`
> (ADR-027) and replaces, for now, its heavier quote → order → invoice chain with a single
> "sale" document. Invoicing (gapless invoice numbers, credit notes, TVA) stays an ERP topic for later.

## 1. Audit summary (2026-11-27)

| Area | Finding | Consequence |
|---|---|---|
| App | Next.js 16.4 App Router, `/admin/(panel)` shell, `requireAdmin()` (active `admin_profiles` row **and** MFA aal2), server actions `requireAdmin → Zod → session client (RLS) → refresh`, `AdminActionState` | Same pattern for every business action |
| UI kit | `AdminPageHeader, Panel, Table/Td (cards on phones), FilterBar, Dl, Tile, StatusBadge, Notice, EmptyState`, `AdminForm`, `ActionButton`, `fields.tsx`, admin i18n fr/en/ar (RTL) | Reused everywhere; no second design system |
| Auth / roles | ERP Phase 0 migrations (`20261122100000…100200`: audit log, roles/permissions, `private.can()`, `my_permissions()`, `attach_staff_by_email`, notifications, `document_sequences`) are **in the repo but not applied** to `mslab-dev`; no app code uses them yet | Business module builds on Phase 0. Phase 0 must be applied first (it rewrites every policy from `is_admin()` to named permissions; the 4 existing accounts are `owner` → *Administrator*, so their access is unchanged) |
| Migration drift | Remote history has `print_on_demand_attach_listed_files`, `mockup_products_hoodie_poster`, `catalogue_hoodie_remove_back_view` that are not in the repo; `site_settings_legal_facts` and `studio_configuration` exist remotely without a history row | Known since ERP §0.2-6; Phase 0's statements were checked against the live policy names and apply cleanly |
| Data model | No customer, stock, payment or expense entity. `quotation_requests` / `inquiries` hold customer identity per request. Public `products` has no prices (ADR-007) and is `anon`-readable | New staff-only tables; `customer_id` link added to requests & messages; inventory is **independent** from the public catalogue (optional `catalog_product_id` link only) |
| Storage | Buckets `catalog` (public) and `custom-uploads` (private) | New private bucket `business-files` (product photos, receipts, journal attachments), signed URLs only |

## 2. Roles & permissions

Built on Phase 0's `roles / role_permissions / staff_roles` and `private.can()` (MFA required).
Two system roles are added; the Administrator keeps every permission implicitly.

| Permission | Administrateur | Gérant | Associé |
|---|---|---|---|
| `business.read` — see every business screen and figure | ✓ | ✓ | ✓ |
| `business.products.manage` — products, product categories | ✓ | ✓ | — |
| `business.stock.manage` — stock movements | ✓ | ✓ | — |
| `business.stock.negative` — allow a movement below zero | ✓ | — | — |
| `business.customers.manage` | ✓ | ✓ | — |
| `business.sales.manage` — sales, status, payments, cancellation | ✓ | ✓ | — |
| `business.expenses.manage` — expenses, expense categories, suppliers | ✓ | ✓ | — |
| `business.finance.correct` — void a payment or an expense (with reason) | ✓ | — | — |
| `business.journal.write` — daily journal entries | ✓ | ✓ | — |
| `business.journal.comment` — comments / follow-up notes | ✓ | ✓ | ✓ |
| `business.day.close` — close the business day | ✓ | ✓ | — |
| `business.reports.correct` — correct a closed report / record on a closed day | ✓ | — | — |
| `business.tasks.assign` — create and assign tasks | ✓ | ✓ | ✓ |
| `business.tasks.update` — update progress of tasks assigned to oneself | ✓ | ✓ | — |

Grants are rows: the Administrator changes them in *Équipe & permissions* without code. Every
check exists three times: navigation (convenience), `requireBusiness(permission)` in every page and
action, and RLS / SECURITY DEFINER RPC in the database (the real boundary).

## 3. Data model (Phase 1, migration `20261127100000_business_management.sql`)

Money `numeric(14,2)`, quantities `numeric(14,3)`, currency MAD, timestamps `timestamptz` (displayed
in `Africa/Casablanca`; "business day" = Morocco local date). RLS on every table, `anon` has no grant,
audit trigger on every table.

| Table | Purpose | Write path |
|---|---|---|
| `business_categories` | configurable categories, `kind` = `product` \| `expense` | RLS (products.manage / expenses.manage) |
| `business_products` | product, material or service: SKU, unit, purchase cost, selling price, `quantity_on_hand`, `min_stock`, image, archive, optional `catalog_product_id` | RLS for descriptive fields; **quantity only through stock RPCs** (guard trigger) |
| `inventory_movements` | append-only stock ledger: type, signed quantity, before/after, reason, user, source (sale / expense) | `business_record_stock_movement`, sale & expense RPCs only |
| `business_customers` | individual / company, contact data, notes, archive | RLS (customers.manage), no delete |
| `business_customer_notes` | internal notes & follow-up history (insert-only) | RLS |
| `business_suppliers` | suppliers | RLS (expenses.manage) |
| `business_sales` + `business_sale_items` | sale / order: number `VTE-YYYY-00001`, customer, lines (product, service or custom), discounts, totals, order status, payment status, amount paid | `business_record_sale`, `business_set_sale_status`, `business_cancel_sale` only |
| `business_sale_events` | order history (status changes, payments, cancellation) | written by the RPCs |
| `business_payments` | payments received; `client_key` unique (double-submit safe); void with reason, never deleted | `business_record_payment`, `business_void_payment` |
| `business_expenses` + `business_expense_items` | expense or purchase; `treatment` = `operating` \| `stock_purchase` \| `investment`; stock purchases post `purchase` movements | `business_record_expense`, `business_void_expense`; descriptive fields editable through RLS |
| `business_activities` | daily journal (type, title, description, time, responsible, customer/sale ref) | RLS (journal.write) |
| `business_activity_comments` | comments / follow-ups (insert-only) | RLS (journal.comment) |
| `business_attachments` | files of expenses and journal entries (bucket `business-files`) | RLS |
| `quotation_requests.customer_id`, `inquiries.customer_id` | link existing requests & messages to a customer (nullable, additive) | existing policies |
| view `business_customer_balances` (security invoker) | Σ sales − Σ valid payments per customer | read |

### Accounting rules (kept distinguishable on purpose)

- **Revenue** = Σ totals of non-cancelled sales, by sale date.
- **Collected** = Σ non-voided payments, by payment date (cash view).
- **Receivables** = revenue − collected per sale (never negative: overpayment is rejected).
- **Operating expenses** = expenses with `treatment = 'operating'`. Stock purchases are cash out and
  stock value, not operating expenses (no double counting); investments (equipment) likewise.
- **Operating result** (Phase 2 overview / daily closing) = revenue − operating expenses. It is
  neither the cash balance nor an accounting profit (no COGS, depreciation or tax), and the UI says so.

### Integrity guarantees

- Each financial / stock operation is one PL/pgSQL function = one transaction, with row locks on the
  product(s) and sale, and a `client_key` unique index so a double click or retry cannot post twice.
- Stock cannot go below zero unless the product allows it or the caller holds `business.stock.negative`
  and explicitly asks for it.
- Services and custom lines never touch stock; a product line deducts stock only when the product
  tracks stock.
- Cancelling a sale returns its stock (`sale_return` movements) and is refused while it still has valid
  payments (void them first, with a reason — the refund is then explicit).
- Ledger tables have no UPDATE/DELETE grant; corrections are new rows. Every table is in `audit.log`.

## 4. Screens (Phase 1)

New sidebar group **Gestion commerciale**, shown only with `business.read`. Existing groups are
unchanged for the current accounts (they are filtered by their own Phase 0 permissions so a Gérant or
Associé does not see empty website-content menus).

| Route | Content |
|---|---|
| `/admin/business/products` | stock list (low-stock first filter, category, archived), value at cost |
| `/admin/business/products/new`, `/[id]` | product form; stock movement form; movement history |
| `/admin/business/stock` | whole ledger (filters: type, product, dates) |
| `/admin/business/customers`, `/[id]` | list with balances, quick add; profile: sales, payments, balance, linked requests, notes |
| `/admin/business/sales`, `/new`, `/[id]` | list (status / payment filters); fast sale form with lines and live total; detail: status, payments, cancel, history |
| `/admin/business/expenses`, `/[id]` | quick expense form (+ stock purchase lines, receipt); list with totals per treatment; void |
| `/admin/business/settings` | product & expense categories, suppliers |
| `/admin/business/journal` | quick-action buttons per activity type, day timeline, comments, attachments |
| `/admin/business/team` | staff, role assignment, attach an invited account (Phase 0 RPC) |

Phase 2 (implemented):

| Route | Content |
|---|---|
| `/admin/business` | Overview: period filter (today, yesterday, 7 / 30 days, custom), revenue · collected · estimated operating result · receivables (each with its definition), open orders by status, low stock, open/overdue tasks, new customers, latest operations, recent journal, pending tasks, low-stock list. Members without website rights (Gérant, Associé) land here from `/admin`. |
| `/admin/business/closing` | Day closing: live automatic summary (financial + operational, products sold, stock movements), the day's timeline, notes (observations, problems, decisions, priorities), **Close business day** |
| `/admin/business/reports`, `/[id]` | Report history; frozen report with financial / operational summary, timeline snapshot, notes, corrections history (version, who, reason, figures recomputed or not), associates' comments, follow-up requests (tasks linked to the report) |
| `/admin/business/tasks`, `/[id]` | Tasks: open / mine / overdue / done, overdue highlighted, assign (title, assignee, priority, due date, customer / sale), status (to do, in progress, completed, blocked), progress history + comments |

Phase 3 (implemented):

| Route | Content |
|---|---|
| `/admin/business/analytics` | Period filter + grouping (day / week / month, sensible default). One chart only — revenue trend (single-series bars, hover tooltips, peak label) with its full table (revenue, sales, collected, operating expenses, cash out, totals). Tables: order delivery rate, receivables by age (0–30 / 31–60 / 61–90 / 90+ days), sales by product with estimated cost & margin (purchase cost recorded on each sale line; "~" when incomplete), services & custom lines, expense breakdown by category & nature with share, stock value at cost by category (missing costs and low stock flagged), customer activity (active, new, walk-in revenue, top 20 with what they still owe). |
| `/admin/notifications` + bell in the shell | Personal inbox (unread first-weight, links to the record), "mark all as read". Types: new request / message (Phase 0), day closed, task assigned, task overdue, low stock, new sale, payment received, incident reported. |
| `/admin/business/export/[kind]` | CSV exports (`sales, payments, expenses, movements, products, customers, reports, series`), `;` separator, decimal comma, UTF-8 BOM, Morocco local times, paginated beyond the API row limit; links on Analytics and on each list page |
| Daily report "Print / PDF" | print stylesheet (shell, forms and buttons hidden) → the browser's "Save as PDF"; no PDF library added |

### Phase 2 data model (migration `20261128100000_business_phase2.sql`)

| Object | Purpose |
|---|---|
| `business_period_summary(from, to)` | the single source of every overview / closing figure (Postgres, numeric, Morocco days, max 400 days) |
| `business_daily_reports` | one report per day: summary + timeline **snapshot**, notes, `closed_by`, `closed_at`, `status` (closed/corrected), `version`; written only by `business_close_day` / `business_correct_report` |
| `business_report_corrections` | every correction: version, reason, previous and next values, who, when |
| `business_report_comments` | associates' comments (insert-only) |
| closed-day lock | triggers refuse new sales, payments, stock movements, expenses and journal entries dated on a closed day unless `business.reports.correct` |
| `business_tasks` + `business_task_comments` | tasks; status history written by a trigger (same transaction); RLS: assignee (tasks.update), creator (tasks.assign) or administrator may update |

Closing locks the day on purpose: an operation forgotten before closing is recorded by an administrator, then the report is corrected with "recompute figures" — the old figures stay in the correction history.

## 5. Tests performed (Phase 1)

- Database, as real personas (Gérant, Associé, Administrator, aal1 session, anonymous) inside rolled-back blocks:
  initial-stock movement, quantity guard, ledger insert refused, negative stock refused (also with override without
  `business.stock.negative`), adjustment to counted quantity, sale totals (210.10 − 5 = 205.10), idempotent retry
  (same `client_key` → same sale, one payment), overpayment refused, cancellation refused while paid, payment void
  refused for the Gérant, Administrator voids then cancels → stock returned, stock purchase (+qty, cost updated) and
  its void (−qty), future expense date refused, Associé reads but cannot write (RLS + RPC), aal1 sees nothing,
  anonymous denied, audit rows written. Bug found and fixed: guard trigger needed SECURITY DEFINER (`…100100`).
- `tsc --noEmit`, ESLint, `npm run test:unit` (157 tests incl. `tests/unit/business-money.test.mts`), `npm run build`.
- Browser: new routes redirect signed-out visitors to `/admin/login`; public site unaffected; no server errors.
  **Not done:** signed-in walkthrough of the screens (needs the owner's password + MFA) and e2e tests with accounts.

### Phase 3 data model (migration `20261129100000_business_phase3.sql`)

| Object | Purpose |
|---|---|
| `business_analytics(from, to, granularity)` | every analytics figure, in Postgres (numeric, Morocco days, ≤ 400 days, empty buckets included) |
| `notifications` (Phase 0 table) | 7 new types / 5 new entity types; rows created by `private.business_notify_event()` triggers in the same transaction as the event, for active members holding the right permission, never for the person who caused it |
| `business_sync_notifications()` | adds one "task overdue" notice per overdue task of the signed-in member (unique index → never twice) and returns the unread count; called when the admin shell renders (no scheduler on this project) |

Recipients: day closed, new sale, payment received, incident → `business.read`; low stock (crossing the threshold) → `business.stock.manage`; task assigned / overdue → the assignee.

### Phase 3 tests

- Database (rolled back): analytics of a sample week exact — 7 daily buckets, revenue 185.00 (135.00 product + 50.00 custom line), collected 100.00, operating 40.50, product estimated cost 90.00 (complete), stock value 210.00 with 1 low item, 1 active customer owing 85.00, ageing 0–30 = 85.00, orders 1 open; 3 monthly / 5 weekly buckets; invalid grouping refused; anonymous refused. Notifications: the Associé received new sale, payment, incident and task assigned; the overdue notice is created once even when synced twice; the Gérant was not notified of their own actions but received the low-stock alert; nobody reads another member's notifications; "mark all read" works.
- `tsc`, ESLint, unit tests (171, incl. `business-analytics.test.mts`), production build; browser: new routes and the CSV endpoint redirect signed-out visitors to the login page.

### Phase 2 tests

- Database, per persona in a rolled-back block: summary of a sample day exact (revenue 135.00, collected 100.00, operating 40.50, stock purchase 60.00 excluded, result 94.50, receivables 35.00, 1 order delivered, 3 units sold); Associé cannot close the day or record an expense, can assign a task and comment on the report; Gérant moves the task to completed (history = 2 status rows, `completed_at` set); closing stores the snapshot (timeline 2 entries); double close refused; expense and journal entry on the closed day refused for the Gérant; Gérant cannot correct; direct report update refused; Administrator records the late expense and corrects with recomputed figures (operating 45.50, version 2, 1 correction row); anonymous denied on tables and on the summary function.
- `tsc`, ESLint, unit tests (165, incl. `business-summary.test.mts`), production build.

## 6. Environment & rollout

No new environment variable. No service-role key (staff accounts are invited from the Supabase
dashboard, then attached with `attach_staff_by_email`). Order of migrations on a project (then `20261128100000_business_phase2`, `20261129100000_business_phase3`):
`20261122100000`, `20261122100100`, `20261122100200` (ERP Phase 0), then `20261127100000`.
Then regenerate `src/lib/supabase/database.types.ts`. Never run `supabase/seed/*` on production;
the business module ships **no** seed data.
