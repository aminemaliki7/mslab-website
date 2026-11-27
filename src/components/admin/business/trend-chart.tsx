import { format } from "@/i18n/format";
import type { AdminLang } from "@/features/admin/dictionary";
import type { Analytics } from "@/features/business/analytics";
import { formatMoney } from "@/features/business/money";

/**
 * Single-series bar chart (revenue per period). One hue (brand teal), no legend (the title names
 * the series), bars anchored to the baseline with rounded data ends, 2px gaps, recessive axis,
 * one direct label (the peak). Each bar has a hover/focus tooltip; the full numbers are in the
 * table that follows the chart. Pure SVG, no dependency, RTL-safe (time runs start → end).
 */
export function TrendChart({ series, lang, label, peakLabel, bucketLabel }: { series: Analytics["series"]; lang: AdminLang; label: string; peakLabel: string; bucketLabel: (bucket: string) => string }) {
  const width = 720;
  const height = 200;
  const top = 24;
  const bottom = 24;
  const plot = height - top - bottom;
  const max = Math.max(...series.map((s) => s.revenue), 0);
  const n = Math.max(series.length, 1);
  const slot = width / n;
  const bar = Math.max(Math.min(slot - 2, 40), 2);
  const peakIndex = max > 0 ? series.findIndex((s) => s.revenue === max) : -1;
  const labelEvery = Math.ceil(n / 8);

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="h-auto w-full rtl:-scale-x-100" preserveAspectRatio="none">
        <line x1="0" x2={width} y1={top + plot} y2={top + plot} stroke="var(--color-line-strong)" strokeWidth="1" />
        {series.map((s, i) => {
          const h = max > 0 ? Math.max((s.revenue / max) * plot, s.revenue > 0 ? 2 : 0) : 0;
          const x = i * slot + (slot - bar) / 2;
          const y = top + plot - h;
          const r = Math.min(4, bar / 2, h);
          // Rounded top corners only (data end), square at the baseline.
          const d = h > 0 ? `M${x},${top + plot} V${y + r} Q${x},${y} ${x + r},${y} H${x + bar - r} Q${x + bar},${y} ${x + bar},${y + r} V${top + plot} Z` : "";
          return (
            <g key={s.bucket} tabIndex={0} className="focus:outline-none [&:focus>rect]:fill-[var(--color-surface-strong)] [&:hover>rect]:fill-[var(--color-surface-strong)]">
              <title>{`${bucketLabel(s.bucket)} — ${formatMoney(s.revenue, lang, { cents: true })} · ${s.sales}`}</title>
              {/* Hit target: the whole column, larger than the bar. */}
              <rect x={i * slot} y={top} width={slot} height={plot} fill="transparent" />
              {d ? <path d={d} fill="var(--color-primary)" /> : null}
              {i % labelEvery === 0 ? (
                <text x={i * slot + slot / 2} y={height - 6} textAnchor="middle" fontSize="11" fill="var(--color-fg-muted)" className="rtl:-scale-x-100" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
                  {bucketLabel(s.bucket)}
                </text>
              ) : null}
            </g>
          );
        })}
        {peakIndex >= 0 ? (
          <text x={peakIndex * slot + slot / 2} y={top - 8} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-fg)" className="rtl:-scale-x-100" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            {formatMoney(max, lang, { cents: true })}
          </text>
        ) : null}
      </svg>
      <figcaption className="text-fg-muted mt-1 text-xs">{max > 0 ? format(peakLabel, { amount: formatMoney(max, lang, { cents: true }) }) : null}</figcaption>
    </figure>
  );
}
