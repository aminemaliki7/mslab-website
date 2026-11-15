import { WhatsAppIcon } from "@/components/ui/icons";
import { getSiteSettings } from "@/features/settings/queries";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

/** wa.me deep link with a localized prefilled message. */
export function whatsappHref(number: string, message: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

/**
 * Floating WhatsApp button (bottom, inline-end). Renders nothing until a verified
 * WhatsApp number exists in site settings — never a placeholder number.
 */
export async function WhatsAppButton() {
  const settings = await getSiteSettings();
  if (!settings.whatsappNumber) return null;
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <a
      href={whatsappHref(settings.whatsappNumber, dict.whatsapp.prefill)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={dict.whatsapp.label}
      className="fixed end-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 inline-flex size-14 items-center justify-center rounded-full bg-[#1f8f4e] text-white shadow-[0_6px_20px_-6px_rgb(14_26_43/0.45)] transition-transform hover:scale-105 sm:end-6 sm:bottom-6"
    >
      <WhatsAppIcon width={28} height={28} />
    </a>
  );
}
