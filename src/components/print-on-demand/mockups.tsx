"use client";

import { useId, type ReactNode } from "react";
import type { MockupKey } from "@/features/print-on-demand/mockup-keys";

/**
 * Product mockups for the print-on-demand studio (original drawings, docs/DESIGN_SYSTEM.md §11).
 * Each product has a print area; the visitor's design (image or text) is placed inside it,
 * scaled and offset, and clipped to the printable zone. Everything is SVG: instant, no upload.
 */

export type { MockupKey } from "@/features/print-on-demand/mockup-keys";

export type Design = {
  /** Object URL of the visitor's image (never uploaded for the preview). */
  imageUrl: string | null;
  text: string;
  /** 0.2 – 1: share of the print area the design may fill. */
  scale: number;
  /** -0.5 – 0.5: offset as a share of the print area. */
  dx: number;
  dy: number;
};

type MockupProps = { design: Design; color: string; label: string; className?: string };

const INK = "#0E1A2B";
const LINE = "#D2CEC3";
const PAPER = "#FFFFFF";
const SHADOW = "#EFEDE6";

/** Light colors get dark text and vice versa (simple luminance test). */
function textOn(hex: string): string {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? INK : PAPER;
}

function Frame({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    // An empty label = decorative copy (thumbnails inside a labelled button).
    <svg viewBox="0 0 240 240" {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })} className={className} fill="none">
      {children}
    </svg>
  );
}

/** The design, placed in a rectangular print area (optionally clipped to a custom shape). */
function PrintArea({
  x,
  y,
  w,
  h,
  design,
  background,
  clip,
  transform,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  design: Design;
  /** Color the design sits on (for text contrast and placeholder tint). */
  background: string;
  clip?: ReactNode;
  transform?: string;
}) {
  const id = useId().replace(/:/g, "");
  const dw = w * design.scale;
  const dh = h * design.scale;
  const cx = x + w / 2 + design.dx * w;
  const cy = y + h / 2 + design.dy * h;
  const fg = textOn(background);
  const text = design.text.trim();

  return (
    <g transform={transform}>
      <defs>
        <clipPath id={`clip-${id}`}>{clip ?? <rect x={x} y={y} width={w} height={h} />}</clipPath>
      </defs>
      <g clipPath={`url(#clip-${id})`}>
        {design.imageUrl ? (
          <image href={design.imageUrl} x={cx - dw / 2} y={cy - dh / 2} width={dw} height={dh} preserveAspectRatio="xMidYMid meet" />
        ) : text ? (
          <text
            x={cx}
            y={cy}
            fill={fg}
            fontSize={Math.max(6, Math.min(dh * 0.42, (dw / Math.max(text.length, 1)) * 1.7))}
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--font-geist), system-ui, sans-serif"
          >
            {text}
          </text>
        ) : (
          // Placeholder "logo" until the visitor adds a design.
          <path
            d={starPath(cx, cy, Math.min(dw, dh) * 0.42)}
            fill="none"
            stroke={fg}
            strokeOpacity="0.55"
            strokeWidth={Math.max(1.2, Math.min(dw, dh) * 0.04)}
            strokeDasharray="4 3"
            strokeLinejoin="round"
          />
        )}
      </g>
    </g>
  );
}

function starPath(cx: number, cy: number, r: number): string {
  const points = Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    return `${(cx + radius * Math.cos(angle)).toFixed(1)} ${(cy + radius * Math.sin(angle)).toFixed(1)}`;
  });
  return `M${points.join("L")}Z`;
}

function Floor({ rx = 80 }: { rx?: number }) {
  return <ellipse cx="120" cy="222" rx={rx} ry="7" fill={SHADOW} />;
}

/** Soft vertical shading that makes flat colors read as volume. */
function Shade({ id, d, horizontal = false }: { id: string; d: string; horizontal?: boolean }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2={horizontal ? "1" : "0"} y2={horizontal ? "0" : "1"}>
          <stop offset="0" stopColor="#000" stopOpacity={horizontal ? "0.16" : "0"} />
          <stop offset={horizontal ? "0.35" : "0.6"} stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000" stopOpacity={horizontal ? "0.2" : "0.12"} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
    </>
  );
}

// ─── Products ───────────────────────────────────────────────────────────────

function TShirt({ design, color, label, className }: MockupProps) {
  const id = useId().replace(/:/g, "");
  const body = "M84 38L102 30C108 42 132 42 138 30L156 38L198 62L184 98L164 90V212H76V90L56 98L42 62Z";
  return (
    <Frame label={label} className={className}>
      <Floor rx={70} />
      <path d={body} fill={color} stroke="#000" strokeOpacity="0.12" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M102 30C108 42 132 42 138 30" stroke="#000" strokeOpacity="0.18" strokeWidth="3" fill="none" />
      <path d="M76 90V212M164 90V212" stroke="#000" strokeOpacity="0.08" strokeWidth="1.5" />
      <PrintArea x={92} y={64} w={56} h={72} design={design} background={color} />
      <Shade id={`s-${id}`} d={body} />
    </Frame>
  );
}

function Hoodie({ design, color, label, className }: MockupProps) {
  const id = useId().replace(/:/g, "");
  const body = "M88 46L62 58L36 152L58 158L76 104V212H164V104L182 158L204 152L178 58L152 46Z";
  return (
    <Frame label={label} className={className}>
      <Floor rx={74} />
      {/* hood behind the neck */}
      <path d="M90 52C86 18 154 18 150 52C140 66 100 66 90 52Z" fill={color} />
      <path d="M90 52C86 18 154 18 150 52C140 66 100 66 90 52Z" fill="#000" fillOpacity="0.22" />
      <path d={body} fill={color} stroke="#000" strokeOpacity="0.12" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M98 48C102 70 138 70 142 48" stroke="#000" strokeOpacity="0.25" strokeWidth="3" fill="none" />
      <path d="M112 66L110 96M128 66L130 96" stroke="#000" strokeOpacity="0.28" strokeWidth="2" strokeLinecap="round" />
      {/* kangaroo pocket and cuffs */}
      <path d="M90 168H150L158 198H82Z" fill="#000" fillOpacity="0.1" />
      <path d="M36 152L58 158M182 158L204 152M76 204H164" stroke="#000" strokeOpacity="0.18" strokeWidth="5" />
      <PrintArea x={94} y={96} w={52} h={58} design={design} background={color} />
      <Shade id={`s-${id}`} d={body} />
    </Frame>
  );
}

function Tote({ design, color, label, className }: MockupProps) {
  const id = useId().replace(/:/g, "");
  const bag = "M58 84H182L188 212H52Z";
  return (
    <Frame label={label} className={className}>
      <Floor rx={74} />
      <path d="M88 86C88 40 152 40 152 86" stroke={color} strokeWidth="9" fill="none" />
      <path d="M88 86C88 40 152 40 152 86" stroke="#000" strokeOpacity="0.18" strokeWidth="9" fill="none" />
      <path d={bag} fill={color} stroke="#000" strokeOpacity="0.12" strokeWidth="1.2" strokeLinejoin="round" />
      <PrintArea x={78} y={108} w={84} h={82} design={design} background={color} />
      <Shade id={`s-${id}`} d={bag} />
    </Frame>
  );
}

function Mug({ design, color, label, className }: MockupProps) {
  const id = useId().replace(/:/g, "");
  const body = "M56 64H164V196C164 204 158 210 150 210H70C62 210 56 204 56 196Z";
  return (
    <Frame label={label} className={className}>
      <Floor rx={66} />
      <path d="M164 92C196 92 200 168 164 168" stroke={color} strokeWidth="12" fill="none" />
      <path d="M164 92C196 92 200 168 164 168" stroke="#000" strokeOpacity="0.16" strokeWidth="12" fill="none" />
      <path d={body} fill={color} stroke="#000" strokeOpacity="0.12" strokeWidth="1.2" />
      <ellipse cx="110" cy="64" rx="54" ry="9" fill="#000" fillOpacity="0.22" />
      <ellipse cx="110" cy="64" rx="54" ry="9" fill="none" stroke={color} strokeWidth="3" />
      <PrintArea x={70} y={88} w={80} h={96} design={design} background={color} />
      <Shade id={`s-${id}`} d={body} horizontal />
    </Frame>
  );
}

function Box({ design, color, label, className }: MockupProps) {
  const front = "M46 104H156V200H46Z";
  return (
    <Frame label={label} className={className}>
      <Floor rx={86} />
      <path d="M46 104L86 80H196L156 104Z" fill={color} />
      <path d="M46 104L86 80H196L156 104Z" fill="#fff" fillOpacity="0.18" />
      <path d="M156 104L196 80V176L156 200Z" fill={color} />
      <path d="M156 104L196 80V176L156 200Z" fill="#000" fillOpacity="0.2" />
      <path d={front} fill={color} />
      <path d="M46 104H156M156 104V200" stroke="#000" strokeOpacity="0.15" strokeWidth="1.2" />
      <PrintArea x={58} y={116} w={86} h={72} design={design} background={color} />
    </Frame>
  );
}

function Notebook({ design, color, label, className }: MockupProps) {
  const id = useId().replace(/:/g, "");
  const cover = "M64 34H170A6 6 0 0 1 176 40V200A6 6 0 0 1 170 206H64Z";
  return (
    <Frame label={label} className={className}>
      <Floor rx={66} />
      <rect x="70" y="38" width="110" height="170" rx="5" fill={PAPER} stroke={LINE} strokeWidth="1.5" />
      <path d={cover} fill={color} />
      <rect x="64" y="34" width="10" height="172" fill="#000" fillOpacity="0.18" />
      <rect x="160" y="34" width="6" height="172" fill="#000" fillOpacity="0.28" />
      <PrintArea x={84} y={64} w={70} h={80} design={design} background={color} />
      <Shade id={`s-${id}`} d={cover} horizontal />
    </Frame>
  );
}

function Sticker({ design, color, label, className }: MockupProps) {
  return (
    <Frame label={label} className={className}>
      <Floor rx={58} />
      <circle cx="120" cy="114" r="80" fill="#000" fillOpacity="0.08" transform="translate(3 4)" />
      <circle cx="120" cy="114" r="80" fill={PAPER} stroke={LINE} strokeWidth="1.2" />
      <circle cx="120" cy="114" r="72" fill={color} />
      <PrintArea x={58} y={52} w={124} h={124} design={design} background={color} clip={<circle cx="120" cy="114" r="72" />} />
      {/* peeling corner */}
      <path d="M176 164C186 156 192 146 196 134L184 172Z" fill={SHADOW} stroke={LINE} strokeWidth="1" />
    </Frame>
  );
}

function BusinessCard({ design, color, label, className }: MockupProps) {
  return (
    <Frame label={label} className={className}>
      <Floor rx={86} />
      <g transform="rotate(10 128 132)">
        <rect x="56" y="96" width="146" height="86" rx="4" fill={INK} />
        <path d="M74 156H130M74 164H112" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g transform="rotate(-7 112 116)">
        <rect x="40" y="72" width="146" height="86" rx="4" fill="#000" fillOpacity="0.1" transform="translate(2 3)" />
        <rect x="40" y="72" width="146" height="86" rx="4" fill={color} stroke={LINE} strokeWidth="1" />
      </g>
      <PrintArea x={52} y={82} w={122} h={66} design={design} background={color} transform="rotate(-7 112 116)" />
    </Frame>
  );
}

function Flyer({ design, color, label, className }: MockupProps) {
  return (
    <Frame label={label} className={className}>
      <Floor rx={70} />
      <rect x="66" y="22" width="116" height="168" rx="2" fill="#000" fillOpacity="0.08" transform="translate(4 5)" />
      <rect x="66" y="22" width="116" height="168" rx="2" fill={PAPER} stroke={LINE} strokeWidth="1" />
      <rect x="74" y="30" width="100" height="104" fill={color} />
      <PrintArea x={74} y={30} w={100} h={104} design={design} background={color} />
      <path d="M80 148H168M80 158H160M80 168H146" stroke={LINE} strokeWidth="4" strokeLinecap="round" />
    </Frame>
  );
}

function Poster({ design, color, label, className }: MockupProps) {
  return (
    <Frame label={label} className={className}>
      {/* wall, hanging cord, poster with wooden hangers */}
      <rect x="20" y="10" width="200" height="214" rx="6" fill="#F7F6F2" />
      <path d="M90 22L120 8L150 22" stroke="#8A8F98" strokeWidth="1.5" fill="none" />
      <rect x="58" y="26" width="124" height="184" fill="#000" fillOpacity="0.08" transform="translate(4 5)" />
      <rect x="58" y="26" width="124" height="184" fill={color} />
      <PrintArea x={66} y={36} w={108} h={150} design={design} background={color} />
      <path d="M72 196H140" stroke={textOn(color)} strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
      <rect x="52" y="20" width="136" height="8" rx="2" fill="#BE915C" />
      <rect x="52" y="206" width="136" height="8" rx="2" fill="#BE915C" />
    </Frame>
  );
}

function Letterhead({ design, color, label, className }: MockupProps) {
  return (
    <Frame label={label} className={className}>
      <Floor rx={70} />
      <rect x="62" y="20" width="120" height="170" rx="2" fill="#000" fillOpacity="0.08" transform="translate(4 5)" />
      <rect x="62" y="20" width="120" height="170" rx="2" fill={PAPER} stroke={LINE} strokeWidth="1" />
      <PrintArea x={72} y={30} w={44} h={30} design={design} background={PAPER} />
      <path d="M140 36H172M148 44H172M154 52H172" stroke={LINE} strokeWidth="2.5" strokeLinecap="round" />
      {[78, 88, 98, 108, 118, 128, 138].map((y, i) => (
        <path key={y} d={`M74 ${y}H${i === 6 ? 140 : 170}`} stroke={SHADOW} strokeWidth="3" strokeLinecap="round" />
      ))}
      <rect x="62" y="182" width="120" height="8" fill={color} />
    </Frame>
  );
}

export const MOCKUPS: Record<MockupKey, (props: MockupProps) => ReactNode> = {
  tshirt: TShirt,
  hoodie: Hoodie,
  tote: Tote,
  mug: Mug,
  box: Box,
  notebook: Notebook,
  sticker: Sticker,
  "business-card": BusinessCard,
  flyer: Flyer,
  poster: Poster,
  letterhead: Letterhead,
};

/** Products whose material color the visitor can change (paper products: printed background). */
export const DEFAULT_COLORS: Record<MockupKey, string> = {
  tshirt: "#FFFFFF",
  hoodie: "#0E1A2B",
  tote: "#E9DDC7",
  mug: "#FFFFFF",
  box: "#D9B382",
  notebook: "#0E1A2B",
  sticker: "#FFFFFF",
  "business-card": "#FFFFFF",
  flyer: "#0B6E8A",
  poster: "#F2C14E",
  letterhead: "#0B6E8A",
};
