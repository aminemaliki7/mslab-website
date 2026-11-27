"use client";

import { useAdminT } from "@/components/admin/admin-i18n";
import { businessDict, type BusinessDict } from "@/features/business/dictionary";
import type { AdminLang } from "@/features/admin/dictionary";

/** Business-module strings in the admin's interface language (client components). */
export function useBusinessT(): { lang: AdminLang; b: BusinessDict } {
  const { lang } = useAdminT();
  return { lang, b: businessDict(lang) };
}
