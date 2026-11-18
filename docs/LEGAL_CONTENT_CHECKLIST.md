# Legal Content Checklist (for MSLAB)

_Updated 2026-11-18 (ADR-024, trimmed to Moroccan legal context)._ The website publishes eight legal documents in French, Arabic and English. Their text is versioned in `src/content/legal/` and was drafted with reference to Moroccan law (Loi 09-08, Loi 31-08, Loi 53-05, Loi 2-00, Loi 17-97, DOC). French LCEN-style extras (publication director, share capital, IF, patente) are omitted. **This is not legal advice.** Every document has `status: "draft"` until a qualified Moroccan lawyer has reviewed it.

Draft documents remain `noindex` and are excluded from `sitemap.xml`, but no provisional notice is displayed. Information MSLAB has not entered yet is **hidden**, never shown as a placeholder (ADR-025): the clause that needs it is written as an optional `[[…]]` segment and removed, table and label rows are hidden, and empty sections disappear.

| Document | FR URL | File |
|---|---|---|
| Mentions légales | `/fr/mentions-legales` | `legal-notice.ts` |
| Politique de confidentialité | `/fr/confidentialite` | `privacy.ts` |
| Politique relative aux cookies | `/fr/politique-cookies` | `cookies.ts` |
| Conditions générales d'utilisation | `/fr/conditions-utilisation` | `terms.ts` |
| Conditions générales de vente | `/fr/conditions-vente` | `sales.ts` |
| Politique de livraison | `/fr/livraison` | `delivery.ts` |
| Retours et remboursements | `/fr/retours-remboursements` | `returns.ts` |
| Conditions des commandes personnalisées | `/fr/commandes-personnalisees` | `custom-orders.ts` |

## 1. Information MSLAB enters in `/admin/settings` → « Informations légales »

Each key below is a `{ph:key}` in the texts, stored in `site_settings.legal_facts` (migration `20261118120000_site_settings_legal_facts.sql`). Each field shows which documents use it and whether it is currently shown or hidden. RC, ICE, CNDP reference and email provider take one value for all languages; the others are entered in French, with optional Arabic and English translations (French is used when a translation is empty).

| Key | Information | Used in |
|---|---|---|
| `rc` | Trade register number + court | Legal notice |
| `ice` | ICE | Legal notice |
| `courts` | Competent court for business disputes | Legal notice, Terms of Sale |
| `cndpReference` | CNDP receipt / authorisation number (declaration + transfers abroad) | Privacy |
| `retentionInquiries` / `retentionQuotes` / `retentionFiles` / `retentionCustomers` | Retention periods | Privacy, Custom orders |
| `emailProvider` | Email notification provider (not chosen yet) | Privacy |
| `carriers` | Carriers used | Privacy, Delivery |
| `quoteValidity` | Quotation validity | Terms of Sale |
| `paymentMethods` / `paymentTerms` | Payment methods; deposit / balance / deadline | Terms of Sale |
| `productionLeadTimes` | Production lead times | Terms of Sale |
| `proofProcess` | Proof (BAT) format, revisions included, physical proof | Custom orders |
| `deliveryZones` / `deliveryLeadTimes` / `deliveryFees` / `pickup` | Delivery areas, times, charges; collection | Delivery |
| `claimDeadline` | Period to report a defect / non-conformity | Terms of Sale, Delivery, Returns |
| `refundMethod` | Refund method | Returns |

Address, phone, email and legal name come from `/admin/settings` (`{fact:…}`). MSLAB confirmed the contact address is also the registered office. When a setting is empty, the clause or row that uses it is hidden.

## 2. Statements to confirm (written from the code or from the brief)
- Legal form **SARL** and the name **MSLAB SARL** (from the brief). `legal_name` in settings overrides the name.
- Hosting: Vercel (application servers in `cdg1`, Paris) and Supabase in the EU (Paris). **The production Supabase region must be confirmed** before the privacy policy is validated.
- No online payment on the site (true in the code today).
- Commitments MSLAB must be willing to keep:
  - customer work is shown in the portfolio only with the customer's written agreement;
  - files are not reused without permission;
  - files are deleted on request;
  - acknowledgement of quote acceptance;
  - production errors are reprinted, replaced or refunded.
- Cookie inventory (`cookies.ts`) matches the code as of 2026-11-18. **The tags configured inside GTM container `GTM-NZGP5ZDF` must be checked.** If it contains anything besides Google Analytics, update the Cookie Policy (and bump `CONSENT_VERSION` if a new category is needed).

## 3. Points for the lawyer to verify
- Law 31-08: the article references for the 7-day withdrawal (art. 36), refund (art. 37), the exceptions (art. 38), consumer court jurisdiction, and the delivery-delay rights.
- Law 09-08: arts. 7–9 (rights) and 43–44 (transfers). Which CNDP formalities apply to each processing activity.
- DOC: art. 549 et seq. (warranty against defects) and art. 269 (force majeure).
- Law 53-05: electronic acceptance of quotations, and the acknowledgement of receipt.
- B2B vs B2C wording, and the indemnity and liability clauses in the Custom Orders Policy.

## 4. Publishing a validated document
1. Fill in the values in `/admin/settings` (contact details and « Informations légales »).
2. Set `status: "validated"`, increase `version`, and set `lastUpdated`.
3. Run `npm run test:unit`. It checks that the fr/ar/en versions keep the same structure and values, that every value in running text sits in an optional `[[…]]` segment, and that no invented identifiers appear.
4. The page then becomes indexable and appears in the sitemap.

## 5. Not implemented (needs a decision or a separate change)
- An automatic purge applying the retention periods (messages, quotations, files, abandoned upload tickets).
