import type { MockupKey } from "@/features/print-on-demand/mockup-keys";
import { PLACEHOLDERS, type TemplateKey } from "@/features/print-on-demand/placeholder-views";
import { isStudioProduct, type StudioProductConfig, type ViewKey } from "@/features/print-on-demand/studio";

/** A printable side as the editor draws it: MSLAB's configured photo, or the placeholder. */
export type EditorView = {
  key: ViewKey;
  /** true = photo and print area entered by MSLAB in the admin. */
  configured: boolean;
  base:
    | { kind: "photo"; src: string; w: number; h: number; transform?: string; clip?: string; dark?: boolean }
    | { kind: "drawing"; product: MockupKey; w: number; h: number; transform?: string; circle?: { cx: number; cy: number; r: number } }
    | {
        kind: "template";
        template: TemplateKey;
        scene: "front" | "back";
        w: number;
        h: number;
        /** Rotation of the print area (sleeves), around its top-left corner. */
        transform?: string;
        /** Part of the template shown for this side. */
        crop: { x: number; y: number; w: number; h: number };
      };
  area: { x: number; y: number; w: number; h: number };
  mask: string | null;
  displacement: string | null;
  printMm: { w: number; h: number } | null;
};

export function editorViews(product: MockupKey, config: Partial<Record<string, StudioProductConfig>>): EditorView[] {
  const configured = isStudioProduct(product) ? config[product] : undefined;
  if (configured && configured.views.length > 0) {
    return configured.views.map((v) => ({
      key: v.key,
      configured: true,
      base: { kind: "photo", src: v.src, w: v.width, h: v.height },
      area: v.area,
      mask: v.mask,
      displacement: v.displacement,
      printMm: v.printMm,
    }));
  }
  const p = PLACEHOLDERS[product];
  if (p.kind === "template") {
    return p.sides.map((side) => ({
      key: side.key,
      configured: false,
      base: { kind: "template", template: p.template, scene: side.scene, w: p.w, h: p.h, transform: side.transform, crop: side.crop },
      area: side.area,
      mask: null,
      displacement: null,
      printMm: null,
    }));
  }
  const unconfigured = { configured: false, mask: null, displacement: null, printMm: null } as const;
  if (p.kind === "photo") {
    return [
      { key: "front", ...unconfigured, base: { kind: "photo", src: p.src, w: p.w, h: p.h, transform: p.transform, clip: p.clip, dark: p.dark }, area: p.area },
      ...(p.sides ?? []).map((side) => ({ key: side.key, ...unconfigured, base: { kind: "photo" as const, src: side.src, w: p.w, h: p.h, dark: p.dark }, area: side.area })),
    ];
  }
  return [{ key: "front", ...unconfigured, base: { kind: "drawing", product, w: p.w, h: p.h, transform: p.transform, circle: p.circle }, area: p.area }];
}

/** The visible frame of a side: the template crop, or the whole base. */
export function viewFrame(view: EditorView): { x: number; y: number; w: number; h: number } {
  return view.base.kind === "template" ? view.base.crop : { x: 0, y: 0, w: view.base.w, h: view.base.h };
}

/** Extra transform applied to the print area (rotated sides, tilted drawings and photos). */
export function areaTransform(view: EditorView): string | undefined {
  return view.base.transform;
}
