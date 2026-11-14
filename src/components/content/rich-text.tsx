import { cn } from "@/lib/utils";

/**
 * Renders admin-entered PLAIN text safely (no HTML): blank lines separate blocks,
 * a block whose lines all start with "- " becomes a bullet list, single newlines are kept.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className={cn("text-fg-muted space-y-4 text-base leading-relaxed", className)}>
      {blocks.map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim());
        if (lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={index} className="list-disc space-y-1.5 ps-5 marker:text-accent">
              {lines.map((line, i) => (
                <li key={i}>{line.slice(2)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="whitespace-pre-line">
            {block}
          </p>
        );
      })}
    </div>
  );
}

/** Split a newline-separated list (e.g. settings highlights) into trimmed items. */
export function toLines(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}
