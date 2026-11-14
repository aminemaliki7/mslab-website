import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, hasLocale } from "@/i18n/config";
import { negotiateLocale } from "@/i18n/negotiate";
import { resolveLocalizedPath, splitLocale } from "@/i18n/routes";
import { refreshAdminSession } from "@/lib/supabase/proxy-session";

/**
 * Locale handling (docs/ROUTING_STRATEGY.md §4):
 * - unprefixed paths → 307 to the negotiated locale (cookie → Accept-Language → fr)
 * - localized segments → rewrite to internal route folders
 * - internal English segments under fr/ar → 308 to the canonical localized path
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
    return NextResponse.redirect(url, 308);
  } else if (resolved.kind === "rewrite") {
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
