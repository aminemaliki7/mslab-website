import { Archivo, Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";

/**
 * Geist is the primary UI font and is preloaded. The Arabic and mono fonts are NOT preloaded:
 * their @font-face unicode-range makes the browser fetch them only on pages that actually use
 * those glyphs (Arabic pages / SKU and number labels), saving ~100 KB on French/English pages.
 */
/**
 * Archivo (variable weight + width) is the site typeface: normal width for text, expanded
 * width for display headings (docs/ART_DIRECTION.md). Preloaded.
 */
export const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

/** Geist is kept for the approved MSLAB wordmark and the mockup studio text only. */
export const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  preload: false,
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic"],
  // 400 body, 500 medium labels, 600 headings (no bold-700 usage in Arabic UI).
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});

export const fontVariables = `${archivo.variable} ${geist.variable} ${geistMono.variable} ${plexArabic.variable}`;
