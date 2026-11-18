import type { LegalBlock, LegalSection } from "@/content/legal/types";
import { LegalInline, type InlineContext } from "./legal-inline";

function Block({ block, ctx, label }: { block: LegalBlock; ctx: InlineContext; label: string }) {
  switch (block.type) {
    case "p":
      return (
        <p className="text-fg-muted leading-relaxed text-pretty">
          <LegalInline text={block.text} ctx={ctx} />
        </p>
      );
    case "ul":
      return (
        <ul className="text-fg-muted marker:text-accent list-disc space-y-2 ps-5 leading-relaxed">
          {block.items.map((item, i) => (
            <li key={i} className="ps-1">
              <LegalInline text={item} ctx={ctx} />
            </li>
          ))}
        </ul>
      );
    case "note":
      return (
        <p className="border-accent bg-accent-soft text-fg rounded-e-[var(--radius-control)] border-s-4 px-4 py-3 text-[0.9375rem] leading-relaxed">
          <LegalInline text={block.text} ctx={ctx} />
        </p>
      );
    case "dl":
      return (
        <dl className="border-line divide-line divide-y rounded-[var(--radius-card)] border text-[0.9375rem]">
          {block.items.map(([term, value]) => (
            <div key={term} className="grid gap-1 px-4 py-3 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-4">
              <dt className="text-fg font-medium">{term}</dt>
              <dd className="text-fg-muted min-w-0 break-words">
                <LegalInline text={value} ctx={ctx} />
              </dd>
            </div>
          ))}
        </dl>
      );
    case "table":
      return (
        // Focusable so keyboard users can scroll wide tables on phones.
        <div tabIndex={0} role="region" aria-label={label} className="border-line overflow-x-auto rounded-[var(--radius-card)] border focus-visible:outline-2">
          <table className="w-full min-w-[32rem] border-collapse text-start text-sm">
            <thead className="bg-surface">
              <tr>
                {block.head.map((cell) => (
                  <th key={cell} scope="col" className="text-fg px-4 py-3 text-start font-semibold">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-line border-t">
                  {row.map((cell, c) => (
                    <td key={c} className={c === 0 ? "text-fg px-4 py-3 align-top font-medium" : "text-fg-muted px-4 py-3 align-top"}>
                      <LegalInline text={cell} ctx={ctx} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

/** One numbered section with a stable anchor (#id identical in every language). */
export function LegalSectionView({ section, index, ctx }: { section: LegalSection; index: number; ctx: InlineContext }) {
  const headingId = section.id;
  return (
    <section aria-labelledby={headingId} className="border-line border-t pt-8 first:border-t-0 first:pt-0">
      <h2 id={headingId} className="text-fg flex gap-3 text-xl leading-snug font-semibold sm:text-[1.375rem]">
        <span className="text-accent shrink-0 tabular-nums" aria-hidden="true">
          {index + 1}.
        </span>
        <span>{section.title}</span>
      </h2>
      <div className="mt-4 space-y-4">
        {section.blocks.map((block, i) => (
          <Block key={i} block={block} ctx={ctx} label={section.title} />
        ))}
      </div>
    </section>
  );
}
