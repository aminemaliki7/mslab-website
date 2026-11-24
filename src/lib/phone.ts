/**
 * Display and dial forms of the phone number stored in site settings, so every page shows it
 * the same way. Moroccan numbers (+212 followed by 9 digits) are grouped "+212 6 70 36 70 05";
 * anything else is shown as entered (never altered beyond spacing).
 */
export function formatPhone(raw: string): string {
  const compact = raw.replace(/[\s.()-]/g, "");
  const local = compact.match(/^(?:\+212|00212|0)([5-8]\d{8})$/);
  if (!local) return raw.trim();
  const d = local[1];
  return `+212 ${d[0]} ${d.slice(1, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
}

/** `tel:` link target: digits and a leading "+" only. */
export function telHref(raw: string): string {
  return `tel:${raw.replace(/[^\d+]/g, "")}`;
}
