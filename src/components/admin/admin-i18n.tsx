"use client";

import { createContext, useContext, type ReactNode } from "react";
import { ADMIN_DICTIONARIES, ADMIN_LANG_NAMES, ADMIN_LANGS, DEFAULT_ADMIN_LANG, type AdminDict, type AdminLang } from "@/features/admin/dictionary";
import { setAdminLang } from "@/features/admin/lang-actions";
import { cn } from "@/lib/utils";

const AdminI18nContext = createContext<AdminLang>(DEFAULT_ADMIN_LANG);

/** Gives client admin components the interface language chosen by the admin. */
export function AdminI18nProvider({ lang, children }: { lang: AdminLang; children: ReactNode }) {
  return <AdminI18nContext.Provider value={lang}>{children}</AdminI18nContext.Provider>;
}

export function useAdminT(): { lang: AdminLang; t: AdminDict } {
  const lang = useContext(AdminI18nContext);
  return { lang, t: ADMIN_DICTIONARIES[lang] };
}

/** FR / EN / ع switch. Each button submits the language; the page re-renders translated. */
export function AdminLangSwitcher({ current, label, className }: { current: AdminLang; label: string; className?: string }) {
  return (
    <form action={setAdminLang} className={className}>
      <fieldset>
        <legend className="sr-only">{label}</legend>
        <div className="border-line inline-flex rounded-full border p-0.5" dir="ltr">
          {ADMIN_LANGS.map((lang) => (
            <button
              key={lang}
              type="submit"
              name="lang"
              value={lang}
              lang={lang}
              aria-pressed={lang === current}
              title={ADMIN_LANG_NAMES[lang].name}
              className={cn(
                "inline-flex h-9 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors",
                lang === current ? "bg-primary text-on-primary" : "text-fg-muted hover:bg-surface-strong hover:text-fg",
              )}
            >
              <span aria-hidden="true">{ADMIN_LANG_NAMES[lang].short}</span>
              <span className="sr-only">{ADMIN_LANG_NAMES[lang].name}</span>
            </button>
          ))}
        </div>
      </fieldset>
    </form>
  );
}
