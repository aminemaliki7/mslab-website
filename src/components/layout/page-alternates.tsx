"use client";

import { useMemo, useSyncExternalStore } from "react";
import { hasLocale, type Locale } from "@/i18n/config";

/**
 * Per-locale URLs of the current page, read from the <link rel="alternate" hreflang> tags that
 * every page emits through generateMetadata (lib/seo.ts). Single source of truth: the language
 * switcher links exactly where search engines are told the translations live — including
 * entity pages whose slugs differ per locale.
 */
type Alternates = Partial<Record<Locale, string>> | null;

const SELECTOR = 'link[rel="alternate"][hreflang]';

function readSnapshot(): string {
  return Array.from(document.head.querySelectorAll<HTMLLinkElement>(SELECTOR))
    .map((link) => `${link.hreflang}|${link.href}`)
    .join("\n");
}

function subscribe(onChange: () => void) {
  // Metadata can be streamed or replaced on client navigation: watch <head>.
  const observer = new MutationObserver(onChange);
  observer.observe(document.head, { childList: true, subtree: true, attributes: true });
  return () => observer.disconnect();
}

function parse(snapshot: string): Alternates {
  if (!snapshot) return null;
  const result: Partial<Record<Locale, string>> = {};
  for (const line of snapshot.split("\n")) {
    const [lang, href] = line.split("|");
    if (!hasLocale(lang) || !href) continue;
    try {
      const url = new URL(href);
      result[lang] = `${url.pathname}${url.search}`;
    } catch {
      // ignore malformed hrefs
    }
  }
  return Object.keys(result).length ? result : null;
}

export function usePageAlternates(): Alternates {
  // The snapshot is a plain string, so React's equality check keeps re-renders minimal.
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, () => "");
  return useMemo(() => parse(snapshot), [snapshot]);
}
