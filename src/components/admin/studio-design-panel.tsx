import { Dl, Panel, Table, Td } from "@/components/admin/ui";
import type { AdminDict } from "@/features/admin/dictionary";
import type { StoredDesign } from "@/features/print-on-demand/design";
import { isMockupKey } from "@/features/print-on-demand/mockup-keys";
import { STUDIO_FONTS, VIEW_KEYS, type ViewKey } from "@/features/print-on-demand/studio";
import { format } from "@/i18n/format";

/** custom_request_details.design comes from our own server action; still read it defensively. */
export function readStoredDesign(value: unknown): StoredDesign | null {
  if (!value || typeof value !== "object") return null;
  const d = value as Partial<StoredDesign>;
  return d.version === 1 && typeof d.product === "string" && Array.isArray(d.layers) && Array.isArray(d.views) ? (d as StoredDesign) : null;
}

/**
 * The customer's Studio design as MSLAB needs it for production: product and options, then
 * every element per side with its physical placement, rotation and resolution, plus the
 * generated mockups (presentation only — the original files are the production source).
 */
export function StudioDesignPanel({ design, mockups, t }: { design: StoredDesign; mockups: Array<{ name: string; url: string }>; t: AdminDict }) {
  const s = t.quotations.studio;
  const viewName = (v: ViewKey) => t.pod.studio.viewNames[v];
  const sides = design.views.filter((v) => (VIEW_KEYS as readonly string[]).includes(v.view));

  return (
    <Panel title={s.title}>
      {!design.configured ? <p className="bg-warning-soft text-warning mb-4 rounded-[var(--radius-control)] px-3 py-2 text-sm">{s.placeholder}</p> : null}
      <Dl
        items={[
          { label: s.product, value: isMockupKey(design.product) ? t.pod.mockups[design.product] : design.product },
          {
            label: s.color,
            value: design.color ? (
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="border-line-strong size-4 rounded-full border" style={{ backgroundColor: design.color.hex }} />
                {design.color.name ?? ""} <span dir="ltr" className="text-fg-muted text-xs">{design.color.hex}</span>
              </span>
            ) : (
              "—"
            ),
          },
          { label: s.size, value: design.size ?? "—" },
          { label: s.material, value: design.material ?? "—" },
          { label: s.technique, value: design.technique ?? "—" },
          { label: s.minDpi, value: design.minDpi ? `${design.minDpi} DPI` : "—" },
        ]}
      />

      {sides.map((side) => {
        const layers = design.layers.filter((l) => l.view === side.view);
        if (layers.length === 0) return null;
        return (
          <section key={side.view} className="mt-6">
            <h3 className="text-fg text-sm font-semibold">{format(s.side, { side: viewName(side.view) })}</h3>
            <p className="text-fg-muted text-xs">{side.printMm ? format(s.printArea, { w: side.printMm.w, h: side.printMm.h }) : s.printAreaUnknown}</p>
            <div className="mt-2">
              <Table head={[s.colElement, s.colContent, s.colPosition, s.colSize, s.colRotation, s.colResolution]}>
                {layers.map((l, i) => (
                  <tr key={l.id}>
                    <Td>
                      <span className="font-medium">
                        {i + 1}. {l.kind === "text" ? s.text : s.image}
                      </span>
                      {!l.insideArea ? <span className="text-danger block text-xs">{s.outside}</span> : null}
                    </Td>
                    <Td label={s.colContent}>
                      {l.kind === "text" ? (
                        <>
                          <bdi className="font-medium">{l.text}</bdi>
                          <span className="text-fg-muted block text-xs">
                            {format(s.font, { font: STUDIO_FONTS[l.font]?.label ?? l.font, color: l.color })}
                          </span>
                        </>
                      ) : (
                        <>
                          <bdi className="break-all">{l.file.name}</bdi>
                          <span className="text-fg-muted block text-xs" dir="ltr">
                            {l.file.type}
                            {l.file.width && l.file.height ? ` · ${format(s.pixels, { w: l.file.width, h: l.file.height })}` : ""}
                          </span>
                        </>
                      )}
                    </Td>
                    <Td label={s.colPosition} className="tabular-nums">
                      <span dir="ltr">{l.mm ? `${l.mm.centerX} × ${l.mm.centerY}` : `${Math.round(l.x * 100)}% × ${Math.round(l.y * 100)}%`}</span>
                    </Td>
                    <Td label={s.colSize} className="tabular-nums">
                      <span dir="ltr">{l.mm ? `${l.mm.width} × ${l.mm.height}` : `${Math.round(l.w * 100)}%`}</span>
                    </Td>
                    <Td label={s.colRotation} className="tabular-nums">
                      <span dir="ltr">{Math.round(l.rotation)}°</span>
                    </Td>
                    <Td label={s.colResolution} className="tabular-nums">
                      {l.dpi ? (
                        <span className={design.minDpi && l.dpi < design.minDpi ? "text-danger font-medium" : undefined}>
                          {l.dpi} DPI
                          {design.minDpi && l.dpi < design.minDpi ? <span className="block text-xs">{format(s.lowDpi, { min: design.minDpi })}</span> : null}
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>
                  </tr>
                ))}
              </Table>
            </div>
          </section>
        );
      })}

      {mockups.length > 0 ? (
        <section className="mt-6">
          <h3 className="text-fg text-sm font-semibold">{s.mockups}</h3>
          <p className="text-fg-muted text-xs">{s.mockupsNote}</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {mockups.map((m) => (
              <li key={m.url}>
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="border-line block overflow-hidden rounded-[var(--radius-control)] border">
                  {/* eslint-disable-next-line @next/next/no-img-element -- private signed URL, verified PNG */}
                  <img src={m.url} alt={m.name} className="bg-surface w-full" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Panel>
  );
}
