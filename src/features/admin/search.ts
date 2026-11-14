/**
 * Sanitize free text for PostgREST `or()` filters: strip characters that have meaning in the
 * filter syntax (, ( ) : *) or in LIKE patterns (% _ \). Keeps letters (incl. Arabic), digits,
 * spaces, @, . and - (so emails and references remain searchable).
 */
export function safeSearchTerm(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[,():*%_\\"']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}
