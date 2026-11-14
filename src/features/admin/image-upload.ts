import "server-only";

/** Upload rules for the public `catalog` bucket (mirrors bucket limits; SVG never allowed). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;
export type ImageMime = keyof typeof TYPES;

/** Detect the real type from the file's first bytes — the browser-provided type is not trusted. */
export function sniffImageType(bytes: Uint8Array): ImageMime | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return "image/avif";
  return null;
}

export type ValidatedImage = { bytes: Uint8Array; type: ImageMime; extension: string };

export async function validateImage(value: FormDataEntryValue | null): Promise<ValidatedImage | string> {
  if (!(value instanceof File) || value.size === 0) return "Choisissez une image.";
  if (value.size > MAX_IMAGE_BYTES) return "Image trop lourde (5 Mo maximum).";
  const bytes = new Uint8Array(await value.arrayBuffer());
  const type = sniffImageType(bytes);
  if (!type) return "Format non pris en charge (JPEG, PNG, WebP ou AVIF).";
  return { bytes, type, extension: TYPES[type] };
}
