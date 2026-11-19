import { Anton, Archivo, Geist, Geist_Mono, IBM_Plex_Sans_Arabic, Jost } from "next/font/google";

/**
 * Geist is the primary UI font and is preloaded. The Arabic and mono fonts are NOT preloaded:
 * their @font-face unicode-range makes the browser fetch them only on pages that actually use
 * those glyphs (Arabic pages / SKU and number labels), saving ~100 KB on French/English pages.
 */
/**
 * Jost (variable weight, Futura lineage) is the site typeface: light spaced capitals for
 * titles, regular weight for text — simple, classic, calm (docs/DESIGN_SYSTEM.md §0). Preloaded.
 */
export const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Anton — the typeface of "Lab" in the MSLAB logo. Used sparingly for brand moments (page
 * titles, step numerals) so the site speaks with the logo's voice. Latin only; preloaded.
 */
export const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

/** Archivo stays available as a design font in the mockup studio only (not preloaded). */
export const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
  preload: false,
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

export const fontVariables = `${jost.variable} ${anton.variable} ${archivo.variable} ${geist.variable} ${geistMono.variable} ${plexArabic.variable}`;
