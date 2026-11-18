"use client";

import type { ReactNode } from "react";
import { openConsentPreferences } from "./consent-store";

/** Re-opens the cookie preferences dialog (footer link, Cookie Policy page). */
export function CookieSettingsButton({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={openConsentPreferences} className={className}>
      {children}
    </button>
  );
}
