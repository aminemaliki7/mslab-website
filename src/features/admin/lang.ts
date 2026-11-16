import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { ADMIN_DICTIONARIES, ADMIN_LANG_COOKIE, DEFAULT_ADMIN_LANG, adminDir, isAdminLang, type AdminDict, type AdminLang } from "./dictionary";

/** The admin's interface language (cookie set from the sidebar or login page; French by default). */
export const getAdminLang = cache(async (): Promise<AdminLang> => {
  const value = (await cookies()).get(ADMIN_LANG_COOKIE)?.value;
  return isAdminLang(value) ? value : DEFAULT_ADMIN_LANG;
});

export async function getAdminT(): Promise<{ lang: AdminLang; dir: "ltr" | "rtl"; t: AdminDict }> {
  const lang = await getAdminLang();
  return { lang, dir: adminDir(lang), t: ADMIN_DICTIONARIES[lang] };
}

/** Browser-tab title in the admin's language: `export const generateMetadata = adminTitle((t) => t.products.title)`. */
export function adminTitle(pick: (t: AdminDict) => string) {
  return async (): Promise<{ title: string }> => {
    const { t } = await getAdminT();
    return { title: pick(t) };
  };
}
