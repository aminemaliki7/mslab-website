"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import { clampCenter, insideArea, layerBoxPx } from "@/features/print-on-demand/design-geometry";
import { STUDIO_FONTS } from "@/features/print-on-demand/studio";
import { garmentImages } from "../garment/garment-template";
import { DRAWINGS } from "../mockups";
import type { EditorLayer } from "./editor-state";
import { areaTransform, viewFrame, type EditorView } from "./views";

export type Asset = { url: string; type: string; file: File };

type Gesture =
  | { kind: "move"; id: string; startX: number; startY: number; x0: number; y0: number }
  | { kind: "scale"; id: string; cx: number; cy: number; d0: number; w0: number }
  | { kind: "rotate"; id: string; cx: number; cy: number };

const ACCENT = "#0B6E8A";
const DANGER = "#C8443A";

/** Light product colours get the "multiply" ink look; dark ones show the artwork as is. */
export function isLight(hex: string): boolean {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
}

/** One layer drawn in print-area coordinates (centre-based, rotated). */
export function LayerShape({ layer, area, asset }: { layer: EditorLayer; area: { w: number; h: number }; asset: Asset | undefined }) {
  const box = layerBoxPx(layer, area);
  const half = { w: box.w / 2, h: box.h / 2 };
  let content;
  if (layer.kind === "text") {
    const font = STUDIO_FONTS[layer.font];
    content = (
      <text
        x={0}
        y={0}
        fill={layer.color}
        fontSize={box.h / 1.15}
        fontFamily={font.css}
        fontWeight={font.weight}
        textAnchor="middle"
        dominantBaseline="central"
        textLength={box.w}
        lengthAdjust="spacingAndGlyphs"
        style={{ whiteSpace: "pre" }}
      >
        {layer.text}
      </text>
    );
  } else if (asset && layer.file.type !== "application/pdf") {
    content = <image href={asset.url} x={-half.w} y={-half.h} width={box.w} height={box.h} preserveAspectRatio="none" />;
  } else {
    // PDF (decision C1): a frame showing where the file will be placed.
    content = (
      <g>
        <rect x={-half.w} y={-half.h} width={box.w} height={box.h} fill="#F3F1EC" stroke="#8A8F98" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
        <text x={0} y={0} fontSize={Math.min(box.w, box.h) * 0.22} fill="#5B6270" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-geist-mono), monospace">
          PDF
        </text>
      </g>
    );
  }
  return <g transform={`translate(${box.x} ${box.y}) rotate(${box.rotation})`}>{content}</g>;
}

/**
 * The product with its printable area and the layers of one side. Interactive mode adds the
 * selection frame and handles (marked data-ui so the mockup export leaves them out).
 */
export function Stage({
  view,
  layers,
  assets,
  tint,
  drawingColor,
  selectedId,
  interactive,
  label,
  svgRef,
  onSelect,
  onChange,
  onCheckpoint,
  onRemove,
  onUndoRedo,
  className,
}: {
  view: EditorView;
  layers: EditorLayer[];
  assets: Map<string, Asset>;
  /** Product colour applied through the configured mask (multiply). */
  tint: string | null;
  /** Colour of drawn placeholder products. */
  drawingColor: string;
  selectedId: string | null;
  interactive: boolean;
  label: string;
  svgRef?: RefObject<SVGSVGElement | null>;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string, patch: Partial<EditorLayer>, mode: "commit" | "preview") => void;
  onCheckpoint?: () => void;
  onRemove?: (id: string) => void;
  onUndoRedo?: (action: "undo" | "redo") => void;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const areaRef = useRef<SVGGElement>(null);
  const ownSvg = useRef<SVGSVGElement>(null);
  const ref = svgRef ?? ownSvg;
  const gesture = useRef<Gesture | null>(null);
  const frame = viewFrame(view);
  // Area units per screen pixel, so handles keep a constant on-screen size.
  const [unit, setUnit] = useState(frame.w / 600);

  useEffect(() => {
    const svg = ref.current;
    if (!svg || !interactive) return;
    const observer = new ResizeObserver(() => {
      const width = svg.getBoundingClientRect().width;
      if (width > 0) setUnit(frame.w / width);
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, [ref, frame.w, interactive]);

  const area = view.area;
  const selected = layers.find((l) => l.id === selectedId) ?? null;

  function toArea(event: PointerEvent): { x: number; y: number } | null {
    const matrix = areaRef.current?.getScreenCTM();
    if (!matrix) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: p.x, y: p.y };
  }

  function start(event: PointerEvent, next: Gesture) {
    event.stopPropagation();
    event.preventDefault();
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    gesture.current = next;
    onCheckpoint?.();
  }

  function onLayerDown(event: PointerEvent, layer: EditorLayer) {
    if (!interactive) return;
    onSelect?.(layer.id);
    const p = toArea(event);
    if (!p) return;
    start(event, { kind: "move", id: layer.id, startX: p.x, startY: p.y, x0: layer.x, y0: layer.y });
  }

  function onHandleDown(event: PointerEvent, kind: "scale" | "rotate") {
    if (!selected) return;
    const p = toArea(event);
    if (!p) return;
    const box = layerBoxPx(selected, area);
    if (kind === "scale") start(event, { kind, id: selected.id, cx: box.x, cy: box.y, d0: Math.max(1, Math.hypot(p.x - box.x, p.y - box.y)), w0: selected.w });
    else start(event, { kind, id: selected.id, cx: box.x, cy: box.y });
  }

  function onMove(event: PointerEvent) {
    const g = gesture.current;
    if (!g) return;
    const p = toArea(event);
    if (!p) return;
    if (g.kind === "move") {
      onChange?.(g.id, { x: clampCenter(g.x0 + (p.x - g.startX) / area.w), y: clampCenter(g.y0 + (p.y - g.startY) / area.h) }, "preview");
    } else if (g.kind === "scale") {
      const d = Math.hypot(p.x - g.cx, p.y - g.cy);
      onChange?.(g.id, { w: Math.min(4, Math.max(0.03, (g.w0 * d) / g.d0)) }, "preview");
    } else {
      let angle = (Math.atan2(p.y - g.cy, p.x - g.cx) * 180) / Math.PI + 90;
      if (angle > 180) angle -= 360;
      // Snap to the nearest 45° when close (straight text is the common case).
      const snapped = Math.round(angle / 45) * 45;
      if (Math.abs(angle - snapped) < 4) angle = snapped;
      onChange?.(g.id, { rotation: Math.round(angle) }, "preview");
    }
  }

  function onUp() {
    gesture.current = null;
  }

  function onKeyDown(event: KeyboardEvent) {
    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key.toLowerCase() === "z") {
      event.preventDefault();
      onUndoRedo?.(event.shiftKey ? "redo" : "undo");
      return;
    }
    if (mod && event.key.toLowerCase() === "y") {
      event.preventDefault();
      onUndoRedo?.("redo");
      return;
    }
    if (!selected) return;
    const step = event.shiftKey ? 0.05 : 0.01;
    const moves: Record<string, Partial<EditorLayer>> = {
      ArrowLeft: { x: clampCenter(selected.x - step) },
      ArrowRight: { x: clampCenter(selected.x + step) },
      ArrowUp: { y: clampCenter(selected.y - step) },
      ArrowDown: { y: clampCenter(selected.y + step) },
    };
    if (moves[event.key]) {
      event.preventDefault();
      onChange?.(selected.id, moves[event.key]!, "commit");
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onRemove?.(selected.id);
    } else if (event.key === "Escape") {
      onSelect?.(null);
    }
  }

  const Drawing = view.base.kind === "drawing" ? DRAWINGS[view.base.product] : null;
  const garment = view.base.kind === "template" ? garmentImages(view.base.template, view.base.scene, drawingColor) : null;
  const light = tint ? isLight(tint) : view.base.kind !== "photo" ? isLight(drawingColor) : true;
  const extra = areaTransform(view);
  const placeArea = `${extra ? extra + " " : ""}translate(${area.x} ${area.y})`;
  const selectedBox = selected ? layerBoxPx(selected, area) : null;
  const outside = selectedBox ? !insideArea(selectedBox, area) : false;
  const r = 8 * unit;

  return (
    <svg
      ref={ref}
      viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`}
      className={className}
      {...(interactive ? { role: "application", "aria-label": label, tabIndex: 0, onKeyDown } : label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      onPointerMove={interactive ? onMove : undefined}
      onPointerUp={interactive ? onUp : undefined}
      onPointerCancel={interactive ? onUp : undefined}
      onPointerDown={interactive ? () => onSelect?.(null) : undefined}
      style={{ touchAction: interactive ? "none" : undefined }}
    >
      <defs>
        <clipPath id={`clip-${uid}`}>
          {view.base.kind === "drawing" && view.base.circle ? (
            <circle cx={view.base.circle.cx - area.x} cy={view.base.circle.cy - area.y} r={view.base.circle.r} />
          ) : (
            <rect x={0} y={0} width={area.w} height={area.h} />
          )}
        </clipPath>
        {view.mask && tint ? (
          <mask id={`mask-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width={view.base.w} height={view.base.h}>
            <image href={view.mask} width={view.base.w} height={view.base.h} preserveAspectRatio="none" />
          </mask>
        ) : null}
        {view.displacement ? (
          <filter id={`relief-${uid}`} filterUnits="userSpaceOnUse" x={0} y={0} width={area.w} height={area.h} colorInterpolationFilters="sRGB">
            <feImage href={view.displacement} x={-area.x} y={-area.y} width={view.base.w} height={view.base.h} preserveAspectRatio="none" result="relief" />
            <feDisplacementMap in="SourceGraphic" in2="relief" scale={view.base.w * 0.012} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ) : null}
      </defs>

      <g data-base="">
        {view.base.kind === "photo" ? (
          <image href={view.base.src} width={view.base.w} height={view.base.h} preserveAspectRatio="none" />
        ) : garment ? (
          <image href={garment.under} width={view.base.w} height={view.base.h} />
        ) : Drawing ? (
          <Drawing design={{ imageUrl: null, text: "", scale: 1, dx: 0, dy: 0, bare: true }} color={drawingColor} label="" />
        ) : null}
      </g>
      {view.mask && tint ? <rect data-tint="" width={view.base.w} height={view.base.h} fill={tint} mask={`url(#mask-${uid})`} style={{ mixBlendMode: "multiply" }} /> : null}

      <g ref={areaRef} transform={placeArea}>
        <g data-layers="" clipPath={`url(#clip-${uid})`} style={{ mixBlendMode: light && view.base.kind === "photo" ? "multiply" : "normal" }}>
          <g filter={view.displacement ? `url(#relief-${uid})` : undefined} opacity={view.base.kind === "photo" ? 0.95 : 1}>
            {layers.map((layer) => (
              <g key={layer.id} onPointerDown={interactive ? (e) => onLayerDown(e, layer) : undefined} style={interactive ? { cursor: "move" } : undefined}>
                <LayerShape layer={layer} area={area} asset={layer.asset ? assets.get(layer.asset) : undefined} />
              </g>
            ))}
          </g>
        </g>
      </g>

      {/* Garment template: lighting, folds and texture fall on the print. */}
      {garment ? <image data-over="" href={garment.over} width={view.base.w} height={view.base.h} pointerEvents="none" /> : null}

      <g transform={placeArea}>
        {interactive ? (
          <g data-ui="" pointerEvents="none">
            <rect x={0} y={0} width={area.w} height={area.h} fill="none" stroke={ACCENT} strokeOpacity="0.55" strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
          </g>
        ) : null}

        {interactive && selected && selectedBox ? (
          <g data-ui="" transform={`translate(${selectedBox.x} ${selectedBox.y}) rotate(${selectedBox.rotation})`}>
            <rect
              x={-selectedBox.w / 2}
              y={-selectedBox.h / 2}
              width={selectedBox.w}
              height={selectedBox.h}
              fill="none"
              stroke={outside ? DANGER : ACCENT}
              strokeWidth={1.5}
              strokeDasharray={outside ? "5 4" : undefined}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
            <line x1={0} y1={-selectedBox.h / 2} x2={0} y2={-selectedBox.h / 2 - 28 * unit} stroke={ACCENT} vectorEffect="non-scaling-stroke" pointerEvents="none" />
            {/* Visible 16 px handles inside 44 px invisible hit areas (touch-friendly). */}
            <g data-handle="rotate" style={{ cursor: "grab" }} onPointerDown={(e) => onHandleDown(e, "rotate")}>
              <circle cx={0} cy={-selectedBox.h / 2 - 28 * unit} r={22 * unit} fill="transparent" />
              <circle cx={0} cy={-selectedBox.h / 2 - 28 * unit} r={r} fill="#fff" stroke={ACCENT} strokeWidth={2} vectorEffect="non-scaling-stroke" />
            </g>
            <g data-handle="scale" style={{ cursor: "nwse-resize" }} onPointerDown={(e) => onHandleDown(e, "scale")}>
              <circle cx={selectedBox.w / 2} cy={selectedBox.h / 2} r={22 * unit} fill="transparent" />
              <circle cx={selectedBox.w / 2} cy={selectedBox.h / 2} r={r} fill={ACCENT} stroke="#fff" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            </g>
          </g>
        ) : null}
      </g>
    </svg>
  );
}
