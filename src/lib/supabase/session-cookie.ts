/**
 * Flags forced on the Supabase auth cookies (admin session). Nothing in the browser reads the
 * session (all admin data access is server-side), so the cookies are httpOnly: a script injected
 * into a page cannot steal an admin session. docs/SECURITY_STRATEGY.md §2.
 */
export const SESSION_COOKIE_FLAGS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
} as const;
