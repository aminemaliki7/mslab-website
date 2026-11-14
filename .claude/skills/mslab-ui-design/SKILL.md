---
name: mslab-ui-design
description: MSLAB design system and UI implementation rules (Tailwind CSS 4, RTL-safe layout, accessibility, responsive, component structure). Use when building or modifying any page layout, component, form UI, navigation, styling, theme tokens, fonts, or when reviewing UI quality.
---

# MSLAB UI Design

## Objective
A professional, trustworthy, fast B2B interface that works identically in French, English and **right-to-left Arabic**, on mobile first, and meets WCAG 2.2 AA.

## When to use
Creating/editing anything under `src/components/**`, `src/app/**/page.tsx|layout.tsx`, `src/app/globals.css`, fonts, icons, or images.

## Technical guidelines

### Tailwind CSS 4 (CSS-first)
- No `tailwind.config.*`. Tokens live in `src/app/globals.css` (or a dedicated `src/styles/theme.css` imported there) under `@theme`.
- Define **semantic tokens**, not raw colors in components:
  `--color-brand`, `--color-brand-foreground`, `--color-surface`, `--color-surface-muted`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-success`, `--color-danger`, `--color-focus`.
- Brand colors are **unknown** (no logo yet) — use a neutral provisional palette and mark it `TODO(brand)`.
- Dark mode: not a launch requirement; don't hardcode `dark:` variants until decided.
- Compose class names with a tiny local `cn()` helper (`src/lib/utils.ts`); do not add `clsx`/`tailwind-merge` unless conflicts become a real problem.

### RTL (mandatory)
- `<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>` is set in `app/[lang]/layout.tsx`.
- Use logical utilities only: `ms-/me-/ps-/pe-/start-/end-/text-start/text-end/border-s/border-e/rounded-s/rounded-e`. Forbidden for directional layout: `ml- mr- pl- pr- left- right- text-left text-right`.
- Directional icons (arrows, chevrons, "next") get `rtl:-scale-x-100`.
- Never build sentences by concatenating translated fragments — layout order changes in RTL.
- Numbers, phone numbers, emails, SKUs inside Arabic text: wrap in `<bdi>` or `dir="ltr"` spans.

### Fonts
- `next/font/google`, self-hosted at build. One Latin family + one Arabic family (e.g. a family with an `arabic` subset). Final choice is `TODO(brand)`. Expose as CSS variables and switch `font-family` with `:lang(ar)`.
- The current Geist fonts from the template are placeholders.

### Components
- `components/ui/*`: stateless primitives (Button, LinkButton, Input, Textarea, Select, Checkbox, Field (label+hint+error), Card, Badge, Container, Section, Skeleton, Breadcrumbs). No data fetching, no dictionaries — receive text via props.
- `components/layout/*`: Header (logo, nav, LanguageSwitcher, CTA), Footer, MobileNav, WhatsAppButton.
- `components/catalog/*`: ProductCard, ProductGrid, CategoryCard, AvailabilityBadge, ProductGallery, CatalogFilters.
- Server Components by default; client only for: MobileNav toggle, LanguageSwitcher (if interactive), forms with `useActionState`, gallery, filter controls that push to URL.
- Props are typed; no default-exported anonymous components; one component per file for anything reused.

### Images
- Always `next/image` with `sizes`. Product images come from Supabase Storage (configure `images.remotePatterns` for the project host only).
- Provide `alt` from localized data; decorative images use `alt=""`.

## Implementation workflow
1. Check whether a primitive already exists in `components/ui` — extend before creating.
2. Build mobile layout first; add `md:`/`lg:` enhancements.
3. Render in `fr`, `ar`, `en`; verify RTL mirroring and long-text wrapping (French and Arabic strings are often longer).
4. Add loading skeleton / empty state / error state for any data-driven block.
5. Run lint + type check; take screenshots at 360px and 1280px in `fr` and `ar` for the PR.

## Quality requirements
- WCAG 2.2 AA: contrast ≥ 4.5:1 body, ≥ 3:1 large text/UI; visible `:focus-visible` ring using `--color-focus`; target size ≥ 24×24px; skip-to-content link; `aria-current="page"` in nav; forms announce errors (`aria-describedby`, `aria-invalid`, live region for form-level errors).
- No layout shift: reserve image aspect ratios; skeletons match final size.
- Respect `prefers-reduced-motion`.
- No horizontal scroll at 360px.

## Security considerations
- Never render HTML from the database with `dangerouslySetInnerHTML`. Product descriptions are plain text (or a constrained, sanitized format if rich text is approved later).
- External links: `rel="noopener noreferrer"`.
