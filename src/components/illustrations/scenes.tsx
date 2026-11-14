import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Explanatory scenes (docs/DESIGN_SYSTEM.md §11): a visitor should understand MSLAB's
 * activities from the pictures alone — printing, office supplies & stationery, books, and
 * supplying businesses. Recognizable everyday objects, no text inside (works in fr/ar/en),
 * nothing that claims an unconfirmed service (no delivery trucks, no people, no premises).
 */
export const C = {
  ink: "#0E1A2B",
  inkSoft: "#2A3A52",
  inkDeep: "#08111D",
  cyan: "#0B6E8A",
  cyanLight: "#5BA7BC",
  cyanSoft: "#E7F2F5",
  paper: "#F7F6F2",
  paperDeep: "#EFEDE6",
  line: "#D2CEC3",
  lineStrong: "#BDB9AE",
  white: "#FFFFFF",
  // Object colors that make things instantly recognizable.
  pencil: "#F2C14E",
  pencilDark: "#D9A21F",
  kraft: "#D9B382",
  kraftDark: "#BE915C",
};

export function Svg({ viewBox, className, children }: { viewBox: string; className?: string; children: ReactNode }) {
  return (
    <svg viewBox={viewBox} aria-hidden="true" focusable="false" className={cn("h-auto", className ?? "w-full")} fill="none">
      {children}
    </svg>
  );
}

function Pencil({ x, y, h, rotate = 0, color = C.pencil }: { x: number; y: number; h: number; rotate?: number; color?: string }) {
  return (
    <g transform={`rotate(${rotate} ${x + 5} ${y + h})`}>
      <rect x={x} y={y + 10} width="10" height={h - 10} fill={color} />
      <rect x={x + 3.5} y={y + 10} width="3" height={h - 10} fill={C.pencilDark} opacity="0.35" />
      <path d={`M${x} ${y + 10}L${x + 5} ${y}L${x + 10} ${y + 10}Z`} fill={C.paperDeep} />
      <path d={`M${x + 3} ${y + 4}L${x + 5} ${y}L${x + 7} ${y + 4}Z`} fill={C.ink} />
    </g>
  );
}

/**
 * Homepage hero: printer printing a flyer + business cards (printing), books (books),
 * pencil cup, ruler, sticky note (stationery & office supplies), supply carton with paper
 * reams (supplying businesses).
 */
export function HeroScene({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 520 400" className={className}>
      {/* backdrop */}
      <circle cx="270" cy="196" r="176" fill={C.paperDeep} />
      <ellipse cx="262" cy="364" rx="236" ry="12" fill={C.lineStrong} opacity="0.35" />

      {/* ── Books (left) ─────────────────────────────── */}
      <g>
        <rect x="58" y="164" width="24" height="104" rx="2" fill={C.ink} />
        <rect x="62" y="178" width="16" height="4" fill={C.pencil} />
        <rect x="84" y="180" width="20" height="88" rx="2" fill={C.cyan} />
        <rect x="88" y="192" width="12" height="3" fill={C.white} />
        <rect x="106" y="156" width="26" height="112" rx="2" fill={C.white} stroke={C.ink} strokeWidth="2" />
        <rect x="111" y="170" width="16" height="4" fill={C.ink} />
        <rect x="111" y="178" width="16" height="2.5" fill={C.line} />
        <g transform="rotate(14 144 268)">
          <rect x="134" y="176" width="20" height="92" rx="2" fill={C.inkSoft} />
          <rect x="138" y="190" width="12" height="3" fill={C.cyanLight} />
        </g>
        {/* lying stack */}
        <rect x="44" y="268" width="134" height="24" rx="3" fill={C.white} stroke={C.ink} strokeWidth="2" />
        <path d="M54 276H168M54 284H168" stroke={C.line} strokeWidth="2" />
        <rect x="160" y="268" width="18" height="24" rx="2" fill={C.ink} />
        <rect x="50" y="292" width="126" height="26" rx="3" fill={C.cyan} />
        <rect x="58" y="302" width="40" height="5" rx="2.5" fill={C.white} opacity="0.8" />
        <rect x="38" y="318" width="146" height="28" rx="3" fill={C.ink} />
        <rect x="48" y="329" width="52" height="5" rx="2.5" fill={C.pencil} />
        {/* open book floating above the shelf */}
        <g className="anim-float">
          <path d="M112 118C102 112 86 111 74 115V139C86 135 102 136 112 142Z" fill={C.white} stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M112 118C122 112 138 111 150 115V139C138 135 122 136 112 142Z" fill={C.white} stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M81 122C88 120 96 120 104 123M81 129C88 127 96 127 104 130M120 123C127 120 135 120 143 122M120 130C127 127 135 127 143 129" stroke={C.lineStrong} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </g>

      {/* ── Printer (center) ─────────────────────────── */}
      <g>
        {/* paper loaded on top */}
        <rect x="232" y="92" width="112" height="40" rx="2" fill={C.white} stroke={C.lineStrong} strokeWidth="1.5" />
        <rect x="238" y="86" width="100" height="10" rx="2" fill={C.white} stroke={C.lineStrong} strokeWidth="1.2" />
        {/* printed flyer coming out (drawn before the body so it slides out of the slot) */}
        <g className="anim-print">
          <rect x="226" y="198" width="124" height="104" rx="3" fill={C.white} stroke={C.lineStrong} strokeWidth="1.5" />
          <rect x="226" y="198" width="124" height="26" rx="3" fill={C.cyan} />
          <rect x="236" y="207" width="54" height="8" rx="4" fill={C.white} />
          <rect x="236" y="232" width="56" height="44" rx="3" fill={C.cyanSoft} />
          <path d="M240 270L256 252L266 262L274 256L288 270Z" fill={C.cyan} />
          <circle cx="280" cy="243" r="5" fill={C.pencil} />
          <rect x="300" y="234" width="40" height="5" rx="2.5" fill={C.ink} />
          <rect x="300" y="244" width="40" height="4" rx="2" fill={C.line} />
          <rect x="300" y="252" width="34" height="4" rx="2" fill={C.line} />
          <rect x="300" y="260" width="38" height="4" rx="2" fill={C.line} />
          <rect x="236" y="284" width="104" height="8" rx="4" fill={C.ink} />
        </g>
        {/* body */}
        <rect x="200" y="124" width="176" height="18" rx="7" fill={C.inkSoft} />
        <rect x="190" y="134" width="196" height="84" rx="14" fill={C.ink} />
        <rect x="334" y="150" width="38" height="22" rx="4" fill={C.inkSoft} />
        <rect x="339" y="155" width="18" height="12" rx="2" fill={C.cyanLight} />
        <circle cx="364" cy="158" r="2.6" fill={C.pencil} />
        <circle cx="364" cy="166" r="2.6" fill={C.white} opacity="0.7" />
        <rect x="204" y="152" width="44" height="5" rx="2.5" fill={C.inkSoft} />
        <rect x="212" y="194" width="152" height="9" rx="4.5" fill={C.inkDeep} />
        {/* output tray */}
        <path d="M206 302H370L360 314H216Z" fill={C.inkSoft} />
        {/* business cards fanned in front */}
        <g className="anim-float anim-float-slow">
          <g transform="rotate(-12 262 340)">
            <rect x="222" y="318" width="80" height="46" rx="4" fill={C.ink} />
            <rect x="232" y="328" width="12" height="12" rx="2" fill={C.cyanLight} />
            <rect x="232" y="348" width="44" height="4" rx="2" fill={C.white} opacity="0.7" />
          </g>
          <g transform="rotate(6 300 344)">
            <rect x="258" y="320" width="80" height="46" rx="4" fill={C.white} stroke={C.lineStrong} strokeWidth="1.5" />
            <rect x="268" y="330" width="12" height="12" rx="2" fill={C.cyan} />
            <rect x="268" y="350" width="40" height="4" rx="2" fill={C.ink} />
            <rect x="268" y="357" width="28" height="3" rx="1.5" fill={C.line} />
          </g>
        </g>
      </g>

      {/* ── Office supplies on a supply carton (right) ── */}
      <g>
        {/* carton = supplying businesses */}
        <rect x="390" y="272" width="112" height="74" rx="3" fill={C.kraft} />
        <path d="M390 272H502V284H390Z" fill={C.kraftDark} />
        <rect x="438" y="272" width="16" height="74" fill={C.kraftDark} opacity="0.55" />
        <rect x="402" y="300" width="28" height="18" rx="2" fill={C.white} />
        <path d="M406 306H426M406 312H420" stroke={C.line} strokeWidth="2" />
        {/* paper reams peeking out of the carton */}
        <rect x="462" y="250" width="34" height="22" rx="2" fill={C.white} stroke={C.lineStrong} strokeWidth="1.5" />
        <rect x="462" y="258" width="34" height="7" fill={C.cyan} />
        <rect x="466" y="236" width="34" height="14" rx="2" fill={C.white} stroke={C.lineStrong} strokeWidth="1.5" />
        <rect x="466" y="240" width="34" height="5" fill={C.pencil} />
        {/* pencil cup */}
        <Pencil x={404} y={168} h={86} rotate={-10} />
        <g transform="rotate(6 430 260)">
          <rect x="426" y="150" width="9" height="110" rx="4" fill={C.ink} />
          <rect x="426" y="150" width="9" height="16" rx="4" fill={C.cyan} />
          <rect x="434" y="158" width="3" height="28" rx="1.5" fill={C.inkSoft} />
        </g>
        <g transform="rotate(14 446 262)">
          <rect x="440" y="168" width="14" height="94" rx="2" fill={C.white} stroke={C.ink} strokeWidth="1.8" />
          <path d="M440 180h6M440 190h4M440 200h6M440 210h4M440 220h6M440 230h4M440 240h6" stroke={C.ink} strokeWidth="1.4" />
        </g>
        <path d="M398 212H458L452 272H404Z" fill={C.cyan} />
        <rect x="396" y="208" width="64" height="8" rx="3" fill={C.inkSoft} />
        <path d="M410 232H446" stroke={C.white} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        {/* sticky note */}
        <g className="anim-float" style={{ animationDelay: "1.4s" }}>
          <g transform="rotate(8 470 130)">
            <rect x="446" y="106" width="50" height="50" rx="2" fill={C.pencil} />
            <path d="M446 106H496V114H446Z" fill={C.pencilDark} opacity="0.5" />
            <path d="M454 126H486M454 136H480M454 146H470" stroke={C.ink} strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
          </g>
        </g>
      </g>
    </Svg>
  );
}

/** Printing & printing services: printer with printed flyers and business cards. */
export function PrintShopIllustration({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 200 150" className={className}>
      <rect x="54" y="18" width="80" height="30" rx="2" fill={C.white} stroke={C.lineStrong} strokeWidth="1.5" />
      <g className="anim-print">
        <rect x="58" y="78" width="72" height="56" rx="2" fill={C.white} stroke={C.lineStrong} strokeWidth="1.5" />
        <rect x="58" y="78" width="72" height="14" rx="2" fill={C.cyan} />
        <rect x="64" y="98" width="28" height="22" rx="2" fill={C.cyanSoft} />
        <path d="M66 117L74 108L80 113L90 117Z" fill={C.cyan} />
        <rect x="98" y="100" width="26" height="4" rx="2" fill={C.ink} />
        <rect x="98" y="108" width="22" height="3" rx="1.5" fill={C.line} />
        <rect x="98" y="114" width="24" height="3" rx="1.5" fill={C.line} />
      </g>
      <rect x="40" y="42" width="108" height="12" rx="5" fill={C.inkSoft} />
      <rect x="32" y="50" width="124" height="46" rx="10" fill={C.ink} />
      <rect x="126" y="60" width="22" height="12" rx="2" fill={C.inkSoft} />
      <rect x="129" y="63" width="10" height="6" rx="1" fill={C.cyanLight} />
      <rect x="48" y="84" width="92" height="6" rx="3" fill={C.inkDeep} />
      {/* stack of printed flyers + cards */}
      <g transform="rotate(-8 168 118)">
        <rect x="146" y="98" width="44" height="30" rx="3" fill={C.ink} />
        <rect x="152" y="104" width="8" height="8" rx="1.5" fill={C.cyanLight} />
        <rect x="152" y="117" width="24" height="3" rx="1.5" fill={C.white} opacity="0.7" />
      </g>
      <g transform="rotate(5 172 126)">
        <rect x="150" y="112" width="44" height="28" rx="3" fill={C.white} stroke={C.lineStrong} strokeWidth="1.5" />
        <rect x="156" y="118" width="8" height="8" rx="1.5" fill={C.cyan} />
        <rect x="156" y="130" width="24" height="3" rx="1.5" fill={C.ink} />
      </g>
      <g transform="rotate(-6 26 120)">
        <rect x="6" y="96" width="40" height="52" rx="2" fill={C.white} stroke={C.lineStrong} strokeWidth="1.5" />
        <rect x="6" y="96" width="40" height="12" rx="2" fill={C.pencil} />
        <rect x="12" y="114" width="28" height="3" rx="1.5" fill={C.ink} />
        <rect x="12" y="121" width="22" height="3" rx="1.5" fill={C.line} />
        <rect x="12" y="128" width="26" height="3" rx="1.5" fill={C.line} />
      </g>
    </Svg>
  );
}

/** Office supplies & stationery: pencil cup, ruler, notebook, sticky note, stapler. */
export function StationeryIllustration({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 200 150" className={className}>
      {/* notebook */}
      <rect x="18" y="40" width="64" height="88" rx="5" fill={C.white} stroke={C.ink} strokeWidth="2.2" />
      {[52, 66, 80, 94, 108].map((y) => (
        <circle key={y} cx="18" cy={y} r="3.5" fill={C.paper} stroke={C.ink} strokeWidth="1.8" />
      ))}
      <path d="M30 60H72M30 72H72M30 84H62" stroke={C.line} strokeWidth="2.5" strokeLinecap="round" />
      <path className="anim-draw-loop" strokeDasharray="60" style={{ ["--dash" as string]: 60 }} d="M30 104Q37 96 44 104T58 104T72 104" stroke={C.cyan} strokeWidth="2.6" strokeLinecap="round" />
      {/* pencil cup */}
      <Pencil x={98} y={30} h={78} rotate={-12} />
      <g transform="rotate(4 120 110)">
        <rect x="116" y="22" width="8" height="90" rx="4" fill={C.ink} />
        <rect x="116" y="22" width="8" height="14" rx="4" fill={C.cyan} />
      </g>
      <g transform="rotate(14 136 112)">
        <rect x="130" y="34" width="12" height="80" rx="2" fill={C.white} stroke={C.ink} strokeWidth="1.6" />
        <path d="M130 46h5M130 54h3M130 62h5M130 70h3M130 78h5M130 86h3M130 94h5" stroke={C.ink} strokeWidth="1.2" />
      </g>
      <path d="M94 76H148L142 132H100Z" fill={C.cyan} />
      <rect x="92" y="72" width="58" height="7" rx="3" fill={C.inkSoft} />
      {/* sticky note */}
      <g transform="rotate(8 176 50)">
        <g className="anim-float">
          <rect x="156" y="28" width="40" height="40" rx="2" fill={C.pencil} />
          <path d="M163 44H189M163 52H184M163 60H175" stroke={C.ink} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </g>
      </g>
      {/* stapler */}
      <path d="M152 118H198V128H152Z" fill={C.inkSoft} />
      <path d="M150 106C150 100 156 98 164 98H194C197 98 198 100 198 104V112H150Z" fill={C.ink} />
      <rect x="156" y="102" width="20" height="3" rx="1.5" fill={C.cyanLight} />
    </Svg>
  );
}

/** Books: bookshelf row + lying stack + open book. */
export function LibraryIllustration({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 200 150" className={className}>
      <rect x="22" y="30" width="20" height="78" rx="2" fill={C.ink} />
      <rect x="26" y="42" width="12" height="3" fill={C.pencil} />
      <rect x="44" y="40" width="16" height="68" rx="2" fill={C.cyan} />
      <rect x="47" y="50" width="10" height="3" fill={C.white} />
      <rect x="62" y="24" width="22" height="84" rx="2" fill={C.white} stroke={C.ink} strokeWidth="2" />
      <rect x="66" y="36" width="14" height="3" fill={C.ink} />
      <g transform="rotate(14 96 108)">
        <rect x="86" y="36" width="18" height="72" rx="2" fill={C.inkSoft} />
        <rect x="90" y="48" width="10" height="3" fill={C.cyanLight} />
      </g>
      <rect x="14" y="108" width="112" height="16" rx="3" fill={C.white} stroke={C.ink} strokeWidth="2" />
      <rect x="110" y="108" width="16" height="16" rx="2" fill={C.ink} />
      <rect x="20" y="124" width="104" height="18" rx="3" fill={C.cyan} />
      <rect x="28" y="130" width="30" height="5" rx="2.5" fill={C.white} opacity="0.8" />
      <g className="anim-float">
        <path d="M156 64C146 58 130 57 118 61V93C130 89 146 90 156 96Z" fill={C.white} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M156 64C166 58 182 57 194 61V93C182 89 166 90 156 96Z" fill={C.white} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M125 70C132 68 140 68 148 71M125 78C132 76 140 76 148 79M125 86C132 84 140 84 148 87M164 71C171 68 179 68 187 70M164 79C171 76 179 76 187 78" stroke={C.lineStrong} strokeWidth="1.8" strokeLinecap="round" />
      </g>
      <ellipse cx="156" cy="136" rx="30" ry="4" fill={C.lineStrong} opacity="0.4" />
    </Svg>
  );
}

/**
 * Business services: a supply carton with paper reams and folders, next to a purchase order
 * being checked — "we supply companies", without claiming delivery or other unconfirmed services.
 */
export function BusinessSupplyIllustration({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 200 150" className={className}>
      {/* carton */}
      <path d="M20 70L44 56H124L100 70Z" fill={C.kraftDark} />
      <rect x="20" y="70" width="104" height="66" rx="3" fill={C.kraft} />
      <rect x="62" y="70" width="18" height="66" fill={C.kraftDark} opacity="0.5" />
      <rect x="30" y="98" width="26" height="16" rx="2" fill={C.white} />
      <path d="M34 104H52M34 109H46" stroke={C.line} strokeWidth="2" />
      {/* reams and folders sticking out */}
      <rect x="30" y="44" width="40" height="26" rx="2" fill={C.white} stroke={C.lineStrong} strokeWidth="1.5" />
      <rect x="30" y="53" width="40" height="8" fill={C.cyan} />
      <rect x="74" y="36" width="16" height="34" rx="2" fill={C.ink} />
      <rect x="92" y="40" width="16" height="30" rx="2" fill={C.pencil} />
      <rect x="77" y="42" width="10" height="3" fill={C.white} />
      {/* purchase order on a clipboard */}
      <g transform="rotate(6 160 88)">
        <rect x="130" y="34" width="60" height="96" rx="6" fill={C.white} stroke={C.ink} strokeWidth="2.2" />
        <rect x="148" y="28" width="24" height="12" rx="4" fill={C.ink} />
        {[54, 72, 90].map((y, i) => (
          <g key={y}>
            <rect x="140" y={y} width="11" height="11" rx="2" stroke={C.ink} strokeWidth="1.8" fill={C.white} />
            <path className="anim-draw" style={{ ["--dash" as string]: 18, animationDelay: `${400 + i * 350}ms` }} d={`M142.5 ${y + 6}L145.5 ${y + 9}L149.5 ${y + 3}`} stroke={C.cyan} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="156" y={y + 3} width={i === 2 ? 16 : 24} height="5" rx="2.5" fill={C.line} />
          </g>
        ))}
        <rect x="140" y="110" width="40" height="8" rx="4" fill={C.cyan} />
      </g>
    </Svg>
  );
}
