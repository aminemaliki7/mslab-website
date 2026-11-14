---
name: mslab-contact-system
description: MSLAB customer interaction — contact form, quotation requests (single or multi-product), WhatsApp links, server-side validation, anti-spam, the submit_inquiry RPC, email notifications, and admin inquiry management. Use when working on forms, inquiries, WhatsApp buttons, notification emails, or the inquiries admin.
---

# MSLAB Contact & Quotation System

## Objective
Turn visitors into **qualified, actionable leads** reliably: no lost submissions, no spam flood, clear confirmation for the customer, instant notification for MSLAB.

## When to use
Contact page, quote request page, product "Request a quote" CTAs, WhatsApp integration, email notifications, inquiry admin screens.

## Flow
```
Form (Server Component shell + small client form with useActionState)
  → Server Action submitInquiry(formData)
     1. Zod parse (shared schema in features/inquiries/schema.ts)
     2. Anti-spam: honeypot field empty, fill time ≥ 3s (signed timestamp), consent = true
     3. Compute ip_hash = sha256(ip + IP_HASH_SALT) — raw IP never stored
     4. supabase.rpc('submit_inquiry', payload)   ← SECURITY DEFINER, rate-limited, inserts inquiry + items
     5. after(() => sendNotifications(inquiryId))  ← email to MSLAB + acknowledgment to customer
     6. return { ok: true, reference }
```
- The inquiry is **persisted before any email is sent**; email failure never loses a lead. Record `notified_at` / `notification_error` so failed notifications are visible in admin and can be retried.
- `after()` from `next/server` runs post-response work (read its doc in `node_modules/next/dist/docs` before use).

## Forms
- **Contact**: full name*, email* or phone* (at least one), company, subject, message*, preferred contact method (email/phone/WhatsApp), consent*.
- **Quote request**: contact fields + company + line items (product reference or free-text item, quantity*, notes) + general message. Prefilled from `?product=<id>` (validated; unknown → ignored).
- Printing quotes may need file uploads (artwork) — **not in v1** (open question; would require a private bucket, virus/size policy).
- Progressive enhancement: the form works without JavaScript (plain `<form action={serverAction}>`).
- Field errors returned from the server render next to fields (`aria-invalid`, `aria-describedby`); a form-level live region announces success/failure.
- Phone: accept Moroccan formats (`0[5-7]XXXXXXXX`, `+212…`) and international `+`; normalize to E.164 server-side.
- Success screen shows a reference number (e.g. `MS-2026-000123`) and next steps — no promises on response time unless MSLAB confirms one.

## WhatsApp
- Link format: `https://wa.me/<E164 digits without +>?text=<encodeURIComponent(localized message)>`.
- The number comes from `src/config/business.ts` (`TODO(content)` until MSLAB provides it). If missing, **hide** WhatsApp buttons — never use a placeholder number.
- Product pages prefill: localized "Bonjour, je souhaite un devis pour : {product} ({url})".
- Floating button: bottom-end (logical), doesn't cover the cookie notice or form submit buttons on mobile; `aria-label` localized.
- WhatsApp clicks are not stored as inquiries (optionally counted via privacy-friendly analytics later).

## Email notifications
- Provider: TBD (Resend, Brevo, or Postmark — decision in `docs/SYSTEM_ARCHITECTURE.md`). Call its HTTP API with `fetch` from a server-only module `src/lib/email.ts`; avoid SDKs unless needed.
- Env: `EMAIL_PROVIDER_API_KEY`, `INQUIRY_NOTIFICATION_TO`, `EMAIL_FROM` (verified sender domain required — depends on domain, open question).
- Internal email: plain, structured, includes admin link `/admin/inquiries/<id>`; reply-to = customer email.
- Customer acknowledgment: in the customer's locale, no marketing content, includes reference.
- Escape all user content in email HTML; prefer text + minimal HTML template.

## Admin inquiries
- List with filters (status, type, date, locale), detail view with items, internal notes, status changes (`new → in_progress → answered → closed`, or `spam`).
- Export CSV (Phase 5) — admin-only, server-generated.

## Quality requirements
- No submission accepted without server validation.
- Duplicate submit protection (disable button while pending; RPC is idempotent on a client-generated `submission_id`).
- All messages localized in fr/ar/en.
- E2E test: submit contact + quote in fr and ar; verify row created and success shown.

## Security
- Public cannot `select`, `update` or `delete` inquiries; inserts only via `submit_inquiry` RPC (`SECURITY DEFINER`, `search_path = ''`, validates lengths, rate limit e.g. 5 per ip_hash per 10 min).
- Max lengths enforced in Zod and in DB `CHECK` constraints.
- Never echo user input back into HTML unescaped; never put personal data in URLs.
- Data retention policy (Loi 09-08): define with MSLAB (open question); plan a purge job for `spam` and old closed inquiries.
