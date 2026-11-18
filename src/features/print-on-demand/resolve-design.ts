import "server-only";
import type { DesignInput, StoredDesign } from "./design";
import { effectiveDpi, insideArea, layerBoxPx, layerMm } from "./design-geometry";
import { placeholderSides } from "./placeholder-views";
import { getStudioConfig } from "./queries";
import { isStudioProduct, type OptionKind } from "./studio";

/**
 * Turn the design sent by the browser into what is stored with the request (ADR-026):
 * - option ids → names from MSLAB's configuration (French snapshot, like production options);
 *   an id that is not an active option of this product is dropped, never trusted;
 * - only layers on sides that exist for the product are kept;
 * - print size (mm) and resolution are computed from the configured printable size only.
 */
export async function resolveDesign(input: DesignInput): Promise<StoredDesign> {
  const config = isStudioProduct(input.product) ? (await getStudioConfig("fr"))[input.product] : undefined;
  const views = config?.views ?? [];
  const configured = views.length > 0;

  const optionName = (kind: OptionKind, id: string | null) => (id && config ? (config.options[kind].find((o) => o.id === id) ?? null) : null);
  const color = optionName("color", input.colorId);

  const sides = configured
    ? views.map((v) => ({ view: v.key, area: v.area, printMm: v.printMm }))
    : placeholderSides(input.product).map((s) => ({ ...s, printMm: null }));

  const layers = input.layers.flatMap((layer) => {
    const side = sides.find((s) => s.view === layer.view);
    if (!side) return [];
    const mm = side.printMm ? layerMm(layer, side.printMm) : null;
    const raster = layer.kind === "image" && layer.file.width && !["image/svg+xml", "application/pdf"].includes(layer.file.type);
    return [
      {
        ...layer,
        mm,
        dpi: raster && mm && layer.kind === "image" ? effectiveDpi(layer.file.width!, mm.width) : null,
        insideArea: insideArea(layerBoxPx(layer, side.area), side.area),
      },
    ];
  });

  return {
    version: 1,
    product: input.product,
    configured,
    color: color?.hex ? { name: color.name, hex: color.hex } : !configured && input.colorHex ? { name: null, hex: input.colorHex } : null,
    size: optionName("size", input.sizeId)?.name ?? null,
    material: optionName("material", input.materialId)?.name ?? null,
    technique: optionName("technique", input.techniqueId)?.name ?? null,
    minDpi: config?.minDpi ?? null,
    views: sides.map(({ view, printMm }) => ({ view, printMm })),
    layers,
  };
}
