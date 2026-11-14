import type { ComponentType } from "react";
import { C, Svg } from "./scenes";

/**
 * Picture for a product that has no uploaded photo yet: a drawing of the kind of object it is,
 * picked from its French slug (docs/DESIGN_SYSTEM.md §11). An uploaded photo always
 * wins. Drawings are generic objects — never a brand, a price or a claim about the product.
 */
type Art = ComponentType<{ className?: string }>;

const VIEW = "0 0 160 120";

function Floor() {
  return <ellipse cx="80" cy="106" rx="54" ry="5" fill={C.paperDeep} />;
}

export function NotebookArt({ className }: { className?: string }) {
  return (
    <Svg viewBox={VIEW} className={className}>
      <Floor />
      {/* Pages peeking out, then the cover. */}
      <rect x="56" y="16" width="58" height="86" rx="3" fill={C.white} stroke={C.lineStrong} strokeWidth="1.5" />
      <rect x="50" y="14" width="60" height="88" rx="4" fill={C.cyan} />
      <rect x="62" y="30" width="36" height="16" rx="2" fill={C.white} />
      <rect x="66" y="35" width="24" height="2.5" rx="1.25" fill={C.line} />
      <rect x="66" y="40" width="16" height="2.5" rx="1.25" fill={C.line} />
      <rect x="102" y="14" width="3" height="88" fill={C.inkSoft} opacity="0.35" />
      {[22, 34, 46, 58, 70, 82, 94].map((y) => (
        <g key={y}>
          <circle cx="50" cy={y} r="4" fill="none" stroke={C.inkSoft} strokeWidth="2" />
          <circle cx="54" cy={y} r="1.5" fill={C.cyanLight} />
        </g>
      ))}
    </Svg>
  );
}

export function PenArt({ className }: { className?: string }) {
  return (
    <Svg viewBox={VIEW} className={className}>
      <Floor />
      {/* Ballpoint pen. */}
      <g transform="rotate(-35 80 60)">
        <rect x="30" y="54" width="86" height="12" rx="6" fill={C.cyan} />
        <rect x="30" y="54" width="30" height="12" rx="6" fill={C.ink} />
        <rect x="38" y="50" width="24" height="4" rx="2" fill={C.inkSoft} />
        <path d="M116 55L130 60L116 65Z" fill={C.lineStrong} />
        <circle cx="131" cy="60" r="1.5" fill={C.ink} />
      </g>
      {/* Pencil. */}
      <g transform="rotate(-15 80 86)">
        <rect x="34" y="80" width="80" height="11" fill={C.pencil} />
        <rect x="34" y="80" width="80" height="3.5" fill={C.pencilDark} />
        <rect x="26" y="80" width="10" height="11" rx="2" fill="#E89A9A" />
        <rect x="34" y="80" width="5" height="11" fill={C.lineStrong} />
        <path d="M114 80L128 85.5L114 91Z" fill={C.kraft} />
        <path d="M123 83.6L128 85.5L123 87.4Z" fill={C.ink} />
      </g>
    </Svg>
  );
}

export function BookArt({ className }: { className?: string }) {
  return (
    <Svg viewBox={VIEW} className={className}>
      <Floor />
      {/* Stack of three books lying flat. */}
      {[
        { y: 82, x: 36, w: 88, cover: C.ink },
        { y: 64, x: 44, w: 76, cover: C.cyan },
        { y: 46, x: 38, w: 82, cover: C.kraftDark },
      ].map((b) => (
        <g key={b.y}>
          <rect x={b.x} y={b.y} width={b.w} height="18" rx="2" fill={b.cover} />
          <rect x={b.x + 6} y={b.y + 3} width={b.w - 12} height="12" fill={C.white} />
          <path d={`M${b.x + 8} ${b.y + 7}H${b.x + b.w - 8}M${b.x + 8} ${b.y + 11}H${b.x + b.w - 8}`} stroke={C.line} strokeWidth="1" />
          <rect x={b.x} y={b.y} width="6" height="18" rx="2" fill={b.cover} />
        </g>
      ))}
      {/* Open book on top. */}
      <path d="M80 44C68 36 56 34 46 36V24C56 22 68 24 80 32Z" fill={C.white} stroke={C.lineStrong} strokeWidth="1.5" />
      <path d="M80 44C92 36 104 34 114 36V24C104 22 92 24 80 32Z" fill={C.white} stroke={C.lineStrong} strokeWidth="1.5" />
      <path d="M52 30C60 29 68 30 74 33M86 33C92 30 100 29 108 30" stroke={C.line} strokeWidth="1.2" />
    </Svg>
  );
}

export function BinderArt({ className }: { className?: string }) {
  return (
    <Svg viewBox={VIEW} className={className}>
      <Floor />
      {/* Two lever-arch binders standing side by side. */}
      {[
        { x: 46, color: C.ink },
        { x: 82, color: C.cyan },
      ].map((b) => (
        <g key={b.x}>
          <rect x={b.x} y="14" width="32" height="90" rx="3" fill={b.color} />
          <rect x={b.x + 6} y="24" width="20" height="30" rx="1.5" fill={C.white} />
          <path d={`M${b.x + 9} 32H${b.x + 23}M${b.x + 9} 38H${b.x + 20}M${b.x + 9} 44H${b.x + 22}`} stroke={C.line} strokeWidth="2" strokeLinecap="round" />
          <circle cx={b.x + 16} cy="80" r="6" fill="none" stroke={C.white} strokeWidth="2.5" opacity="0.85" />
        </g>
      ))}
      {/* Paper sticking out at the back. */}
      <rect x="114" y="34" width="10" height="70" rx="1" fill={C.white} stroke={C.lineStrong} strokeWidth="1.2" />
    </Svg>
  );
}

export function StaplerArt({ className }: { className?: string }) {
  return (
    <Svg viewBox={VIEW} className={className}>
      <Floor />
      {/* Base. */}
      <rect x="28" y="88" width="106" height="12" rx="6" fill={C.inkSoft} />
      <rect x="112" y="86" width="16" height="4" rx="1" fill={C.lineStrong} />
      {/* Top arm, slightly open. */}
      <path d="M34 82C34 72 40 66 50 64L126 56C132 55.5 136 60 134 66L131 74C130 77 127 78 124 78L42 88C37 88 34 86 34 82Z" fill={C.cyan} />
      <path d="M50 70L122 62" stroke={C.cyanLight} strokeWidth="3" strokeLinecap="round" />
      <circle cx="40" cy="86" r="5" fill={C.ink} />
      {/* A few stapled sheets beside it. */}
      <path d="M20 100H60" stroke={C.lineStrong} strokeWidth="1" />
    </Svg>
  );
}

export function PaperArt({ className }: { className?: string }) {
  return (
    <Svg viewBox={VIEW} className={className}>
      <Floor />
      {/* Ream of paper with its wrapper. */}
      <path d="M34 66L80 50L126 66L80 82Z" fill={C.white} stroke={C.lineStrong} strokeWidth="1.5" />
      <path d="M34 66V86L80 102V82Z" fill={C.paperDeep} stroke={C.lineStrong} strokeWidth="1.5" />
      <path d="M126 66V86L80 102V82Z" fill={C.white} stroke={C.lineStrong} strokeWidth="1.5" />
      <path d="M58 74V94L104 78V58Z" fill={C.cyan} opacity="0.9" />
      <path d="M58 74L104 58" stroke={C.cyanLight} strokeWidth="1.5" />
      {/* Loose sheets lifting off the top. */}
      <g className="anim-float">
        <path d="M50 46L92 30L120 42L78 58Z" fill={C.white} stroke={C.lineStrong} strokeWidth="1.2" />
        <path d="M64 46L92 36M70 49L98 39" stroke={C.line} strokeWidth="1.2" />
      </g>
    </Svg>
  );
}

export function PrintArt({ className }: { className?: string }) {
  return (
    <Svg viewBox={VIEW} className={className}>
      <Floor />
      {/* Fanned printed flyers. */}
      {[
        { r: -12, color: C.kraft },
        { r: 0, color: C.cyanLight },
        { r: 12, color: C.cyan },
      ].map((s) => (
        <g key={s.r} transform={`rotate(${s.r} 80 104)`}>
          <rect x="54" y="18" width="52" height="74" rx="2" fill={C.white} stroke={C.lineStrong} strokeWidth="1.2" />
          <rect x="60" y="24" width="40" height="26" rx="1.5" fill={s.color} />
          <path d="M60 58H100M60 64H94M60 70H98M60 76H86" stroke={C.line} strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
    </Svg>
  );
}

export function SuppliesArt({ className }: { className?: string }) {
  return (
    <Svg viewBox={VIEW} className={className}>
      <Floor />
      {/* Pencil cup with pens, pencils and a ruler. */}
      <rect x="74" y="20" width="9" height="62" fill={C.pencil} transform="rotate(-10 78 82)" />
      <path d="M74 20L78.5 10L83 20Z" fill={C.kraft} transform="rotate(-10 78 82)" />
      <rect x="86" y="16" width="8" height="66" rx="4" fill={C.cyan} transform="rotate(8 90 82)" />
      <rect x="62" y="26" width="10" height="56" fill={C.kraft} transform="rotate(-18 66 82)" />
      <rect x="96" y="28" width="8" height="54" rx="4" fill={C.ink} transform="rotate(18 100 82)" />
      <path d="M58 58H106L100 104H64Z" fill={C.inkSoft} />
      <path d="M60 66H104" stroke={C.ink} strokeWidth="2" />
      {/* Sticky notes. */}
      <rect x="112" y="84" width="20" height="18" rx="1" fill={C.pencil} transform="rotate(6 122 93)" />
      <rect x="28" y="88" width="26" height="14" rx="1" fill={C.cyanSoft} stroke={C.cyanLight} strokeWidth="1" />
    </Svg>
  );
}

const ART = {
  notebook: NotebookArt,
  pen: PenArt,
  book: BookArt,
  binder: BinderArt,
  stapler: StaplerArt,
  paper: PaperArt,
  print: PrintArt,
  supplies: SuppliesArt,
} satisfies Record<string, Art>;

export type ProductArtKind = keyof typeof ART;

/** Keyword → drawing. Checked in order on the accent-free French slug. */
const RULES: [RegExp, ProductArtKind][] = [
  [/cahier|carnet|bloc|agenda|repertoire|notebook/, "notebook"],
  [/stylo|crayon|feutre|marqueur|surligneur|porte-mine|\bpens?\b|pencil|marker/, "pen"],
  [/livre|ouvrage|manuel|roman|dictionnaire|encyclopedie|book/, "book"],
  [/classeur|chemise|dossier|pochette|trieur|archive|binder|folder/, "binder"],
  [/agrafeuse|agrafe|perforatrice|stapler|punch/, "stapler"],
  [/ramette|\brames?\b|papier|feuille|enveloppe|paper|ream/, "paper"],
  [/impression|imprime|flyer|depliant|affiche|brochure|carte|kakemono|print/, "print"],
];

/** Kind of drawing for a product with no photo (generic office supplies when nothing matches). */
export function productArtKind(slugFr: string): ProductArtKind {
  const text = slugFr
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return RULES.find(([pattern]) => pattern.test(text))?.[1] ?? "supplies";
}

export function ProductArt({ slugFr, className }: { slugFr: string; className?: string }) {
  const Drawing = ART[productArtKind(slugFr)];
  return <Drawing className={className} />;
}
