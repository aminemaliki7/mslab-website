---
name: mslab-multilingual
description: MSLAB internationalization — French (default), Arabic (RTL) and English; locale routing with app/[lang], next/root-params, JSON dictionaries, localized URL segments via proxy rewrites, translated DB content, RTL rules and hreflang. Use for any user-visible string, new route, language switcher, locale detection, or translated data.
---

# MSLAB Multilingual

## Objective
Every public page exists in `fr`, `ar`, `en` with localized URLs, correct `lang`/`dir`, complete translations, and correct SEO alternates — with **no i18n library**.

## When to use
- Adding/changing any user-visible text.
- Adding a public route or link.
- Language switcher, locale detection, redirects.
- Translated DB fields (product/category translations).

## Architecture
- Locales: `export const locales = ['fr', 'ar', 'en'] as const; export const defaultLocale = 'fr'`. Defined once in `src/i18n/config.ts`.
- Root layout `src/app/[lang]/layout.tsx`:
  - `generateStaticParams` returns all three locales (required with Cache Components).
  - Validates locale with `hasLocale`; `notFound()` otherwise.
  - Renders `<html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>`.
- Read the locale anywhere in server code with `import { lang } from 'next/root-params'` (not available in Client Components, Server Actions or Route Handlers — pass the locale explicitly there, e.g. a hidden form field validated by Zod).
- Dictionaries: `src/i18n/dictionaries/{fr,ar,en}.json`, loaded by `getDictionary()` (server-only, dynamic import). Type the dictionary from `fr.json` so missing keys in `ar`/`en` fail type checking.
- Client Components receive only the strings they need as props (do not ship whole dictionaries to the client).
- Formatting: `Intl.DateTimeFormat`, `Intl.NumberFormat` with locales `fr-MA`, `ar-MA`, `en` (verify Arabic numeral style preference with MSLAB — open question; default Latin digits via `ar-MA-u-nu-latn`).

## Localized URLs
- Prefix always: `/fr/...`, `/ar/...`, `/en/...`. `/` redirects to the negotiated locale.
- Internal route folders use English names (`catalog`, `products`, `quote`, ...). Public segments are localized through a **typed route map** `src/i18n/routes.ts`:
  ```ts
  export const routes = {
    about:   { fr: 'a-propos',  ar: 'a-propos', en: 'about' },
    catalog: { fr: 'catalogue', ar: 'catalogue', en: 'catalog' },
    // …
  } as const
  ```
  Arabic segments mirror French by default (open question — see `docs/ROUTING_STRATEGY.md`).
- `src/proxy.ts` rewrites localized public paths to internal folders and 308-redirects non-canonical forms (e.g. `/fr/catalog` → `/fr/catalogue`).
- Always build links with `localizedPath(locale, routeKey, params)`; never hand-write `/fr/...` strings.
- Language switcher maps the **current route key + entity** to the other locale's URL, including translated product/category slugs (look up translations; fall back to the target locale's catalog index if missing).

## Locale detection
1. Explicit URL prefix wins.
2. `NEXT_LOCALE` cookie (set when user uses the switcher).
3. `Accept-Language` (small parser in `src/i18n/negotiate.ts`; no `negotiator` dependency).
4. Default `fr`.
Bots get no redirect loops: only `/` and unprefixed paths redirect.

## Translation workflow
1. Add the key to `fr.json` first (source), then `ar.json` and `en.json` in the same change.
2. If the translation is not provided by MSLAB, mark it in a `TODO(translation)` list in the PR — never machine-translate legal text without review.
3. Avoid string concatenation; use whole sentences with named placeholders (`"Bonjour {name}"`) and a tiny `format(str, vars)` helper.
4. Plurals: `Intl.PluralRules` (Arabic has 6 plural forms).

## Quality requirements
- No hardcoded user-visible strings in components (lint check in review).
- Each page sets `alternates.languages` for fr/ar/en + `x-default` (→ fr).
- Arabic pages pass a visual RTL check (mirrored layout, correct punctuation, numbers in `<bdi>`).
- Missing DB translation never renders an empty page.

## Security
- The `lang` param and locale form fields are validated against the `locales` tuple before use (never interpolate raw into queries or paths).
- The `NEXT_LOCALE` cookie: `SameSite=Lax`, `Path=/`, 1 year, value validated on read.
