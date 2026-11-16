"use server";

import { cookies } from "next/headers";
import { ADMIN_LANG_COOKIE, isAdminLang } from "./dictionary";

/**
 * Change the back-office interface language. Not sensitive (no data access), so it works on
 * the login page too; the current page re-renders in the new language.
 */
export async function setAdminLang(formData: FormData) {
  const lang = formData.get("lang");
  if (!isAdminLang(lang)) return;
  (await cookies()).set(ADMIN_LANG_COOKIE, lang, {
    path: "/admin",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}
