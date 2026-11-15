# Legal Content Checklist (for MSLAB)

The website shows **Mentions légales** and **Politique de confidentialité** pages whose text is entered by MSLAB in `/admin/settings → Pages légales`. Developers do not write this text. Until it is entered, each page shows "being prepared" and is not indexed by search engines.

This is a checklist of topics, **not legal advice**. Have the final texts validated by a qualified person (lawyer or DPO), especially regarding Moroccan Law 09-08 and CNDP obligations.

## Mentions légales — information usually expected
- [ ] Legal name and legal form (e.g. SARL), share capital
- [ ] Registered office address
- [ ] Registration identifiers MSLAB chooses to publish (RC, ICE, IF, Patente)
- [ ] Contact: phone and email
- [ ] Publication director (person responsible for the content)
- [ ] Hosting provider (name, address) — known once the production hosting is chosen (Vercel / Supabase region)
- [ ] Intellectual property of the content (texts, logos, images)

## Politique de confidentialité — facts from the current implementation
Use these facts; MSLAB decides the legal wording:

| Topic | What the website actually does |
|---|---|
| Data collected — contact form | name, email, optional phone, subject, message, language, page of origin |
| Data collected — quote form | name, email, phone, optional company, preferred contact method, requested products/quantities/specifications, message |
| Technical data | a **salted hash** of the IP address for anti-spam rate limiting (the raw IP is not stored); a language-preference cookie (`NEXT_LOCALE`); the quote list kept in the visitor's browser (localStorage), never sent until the form is submitted |
| Admin cookies | authentication cookies for MSLAB staff only (`/admin`) |
| Purpose | answering contact messages and quotation requests |
| Legal basis | consent checkbox on each form (+ pre-contractual relationship for quotes — to be confirmed) |
| Recipients | MSLAB staff; processors: database/storage hosting (Supabase), website hosting (Vercel), email provider (not chosen yet) |
| Transfers outside Morocco | database in the EU (Paris region) for the development project; production region to be decided |
| Retention period | **to be decided by MSLAB** (then implemented as an automatic purge) |
| Analytics / trackers | Google Tag Manager container `GTM-MDTX63Q6` loads on production site pages; the tags, cookies, and data collection depend on the container configuration and must be documented and reviewed by MSLAB |
| Rights | access, rectification, opposition under Law 09-08 — specify how to exercise them (email/address) |
| CNDP | declaration/authorization reference, if applicable — **MSLAB's responsibility** |

## Open decisions
- Retention period for messages and quotation requests (and for spam)
- Contact point for data-protection requests
- Production hosting regions (impacts "transfers" section)
- Email provider (impacts "recipients" section)
- Google Tag Manager tags, consent requirements, and privacy notice wording
