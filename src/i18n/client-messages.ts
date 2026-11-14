import type { Locale } from "./config";

/**
 * The few strings needed by client-only boundaries (error.tsx) that cannot load server
 * dictionaries. Keep this file tiny — everything else comes from dictionaries via props.
 */
export const errorMessages: Record<Locale, { title: string; body: string; retry: string }> = {
  fr: {
    title: "Une erreur est survenue",
    body: "Le contenu n'a pas pu être chargé. Veuillez réessayer.",
    retry: "Réessayer",
  },
  ar: {
    title: "حدث خطأ",
    body: "تعذّر تحميل المحتوى. يرجى المحاولة مرة أخرى.",
    retry: "إعادة المحاولة",
  },
  en: {
    title: "Something went wrong",
    body: "The content could not be loaded. Try again.",
    retry: "Try again",
  },
};
