import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, hasLocale } from "@/i18n/config";
import { negotiateLocale } from "@/i18n/negotiate";
import { entityFromPath, localizedPath, resolveLocalizedPath, splitLocale } from "@/i18n/routes";
import { checkEntitySlug } from "@/lib/entity-slug-index";
import { refreshAdminSession } from "@/lib/supabase/proxy-session";

/** Any path the route tree does not know: served by app/[lang]/(site)/[...rest] (404). */
const NOT_FOUND_SEGMENT = "__missing";

/**
 * Locale handling (docs/ROUTING_STRATEGY.md §4):
 * - unprefixed paths → 307 to the negotiated locale (cookie → Accept-Language → fr)
 * - localized segments → rewrite to internal route folders
 * - internal English segments under fr/ar → 308 to the canonical localized path
 * - entity slugs (category/product/service) → 308 when written in another language, real 404
 *   when unknown (lib/entity-slug-index.ts explains why this cannot wait for the page)
 * Authorization is NOT handled here; admin routes are excluded by the matcher.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Back office: only refresh the auth session; authorization happens in pages/actions.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return refreshAdminSession(request);
  }

  const { locale, rest } = splitLocale(pathname);

  if (!locale) {
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const target = hasLocale(cookieLocale)
      ? cookieLocale
      : negotiateLocale(request.headers.get("accept-language"));
    const url = request.nextUrl.clone();
    url.pathname = `/${target}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url, 307);
  }

  const resolved = resolveLocalizedPath(locale, rest);
  let response: NextResponse;
  if (resolved.kind === "redirect") {
    const url = request.nextUrl.clone();
    url.pathname = resolved.canonicalPath;
    // /fr/catalog/<english-slug>: fix the slug in the same hop (one redirect, never a chain).
    const target = entityFromPath(locale, splitLocale(resolved.canonicalPath).rest);
    if (target) {
      const verdict = await checkEntitySlug(target.route, locale, target.slug);
      if (verdict?.kind === "redirect") url.pathname = localizedPath(locale, { route: target.route, slug: verdict.slug });
    }
    return NextResponse.redirect(url, 308);
  }

  // Entity pages (category/product/service): real 404 / 308 before the streamed shell fixes a 200.
  const entity = entityFromPath(locale, rest);
  if (entity) {
    const verdict = await checkEntitySlug(entity.route, locale, entity.slug);
    if (verdict?.kind === "redirect") {
      const url = request.nextUrl.clone();
      url.pathname = localizedPath(locale, { route: entity.route, slug: verdict.slug });
      return NextResponse.redirect(url, 308);
    }
    if (verdict?.kind === "missing") {
      // The catch-all route calls notFound() before anything streams: HTTP 404 + localized 404 page.
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/${NOT_FOUND_SEGMENT}`;
      return NextResponse.rewrite(url);
    }
  }

  if (resolved.kind === "rewrite") {
    const url = request.nextUrl.clone();
    url.pathname = resolved.internalPath;
    response = NextResponse.rewrite(url);
  } else {
    response = NextResponse.next();
  }

  // Remember the visitor's explicit language choice for future unprefixed visits.
  if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: [
    // Skip Next internals, API routes and any file with an extension (admin is handled above).
    "/((?!_next|api|.*\\..*).*)",
  ],
};
