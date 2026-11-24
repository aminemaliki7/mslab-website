/**
 * Identify an artwork file from its first bytes (never from the browser's declared type or the
 * extension) and read its pixel size when the header contains it. Pure module: used in the
 * browser (immediate feedback in the Studio) and by the admin (authoritative check of what was
 * actually uploaded). 64 KB of header is enough for every format listed here.
 */
export type SniffedFile = {
  /** Detected type, or null when the content matches no accepted print format. */
  mime: string | null;
  width: number | null;
  height: number | null;
};

export const SNIFF_BYTES = 64 * 1024;

const ascii = (b: Uint8Array, start: number, end: number) => String.fromCharCode(...b.subarray(start, Math.min(end, b.length)));
const be16 = (b: Uint8Array, i: number) => (b[i]! << 8) | b[i + 1]!;
const be32 = (b: Uint8Array, i: number) => ((b[i]! << 24) >>> 0) + (b[i + 1]! << 16) + (b[i + 2]! << 8) + b[i + 3]!;
const le16 = (b: Uint8Array, i: number) => b[i]! | (b[i + 1]! << 8);
const le24 = (b: Uint8Array, i: number) => b[i]! | (b[i + 1]! << 8) | (b[i + 2]! << 16);

function jpegSize(b: Uint8Array): [number, number] | null {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1]!;
    // SOF0–SOF15 except DHT (C4), JPG (C8) and DAC (CC) carry the frame size.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return [be16(b, i + 7), be16(b, i + 5)];
    i += 2 + be16(b, i + 2);
  }
  return null;
}

function webpSize(b: Uint8Array): [number, number] | null {
  const chunk = ascii(b, 12, 16);
  if (chunk === "VP8X") return [le24(b, 24) + 1, le24(b, 27) + 1];
  if (chunk === "VP8 ") return [le16(b, 26) & 0x3fff, le16(b, 28) & 0x3fff];
  if (chunk === "VP8L") {
    const bits = b[21]! | (b[22]! << 8) | (b[23]! << 16) | (b[24]! << 24);
    return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
  }
  return null;
}

/** width/height attributes in px, else the viewBox (vector: size is indicative only). */
function svgSize(text: string): [number, number] | null {
  const tag = /<svg\b[^>]*>/i.exec(text)?.[0];
  if (!tag) return null;
  const attr = (name: string) => new RegExp(`\\s${name}\\s*=\\s*["']\\s*([\\d.]+)(px)?\\s*["']`, "i").exec(tag);
  const w = attr("width"), h = attr("height");
  if (w && h) return [Math.round(Number(w[1])), Math.round(Number(h[1]))];
  const box = /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(tag);
  return box ? [Math.round(Number(box[1])), Math.round(Number(box[2]))] : null;
}

export const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function sniffFile(bytes: Uint8Array): SniffedFile {
  const none = { width: null, height: null };
  const b = bytes;
  if (b.length < 12) return { mime: null, ...none };
  const size = (s: [number, number] | null) => (s && s[0] > 0 && s[1] > 0 ? { width: s[0], height: s[1] } : none);

  if (b[0] === 0x89 && ascii(b, 1, 4) === "PNG") return { mime: "image/png", ...size([be32(b, 16), be32(b, 20)]) };
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ...size(jpegSize(b)) };
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") return { mime: "image/webp", ...size(webpSize(b)) };
  if (ascii(b, 0, 4) === "8BPS") return { mime: "image/vnd.adobe.photoshop", ...size([be32(b, 18), be32(b, 14)]) };
  if ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0) || (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0 && b[3] === 0x2a)) {
    return { mime: "image/tiff", ...none };
  }
  if (ascii(b, 4, 8) === "ftyp" && ["heic", "heix", "mif1", "msf1", "hevc"].includes(ascii(b, 8, 12))) return { mime: "image/heic", ...none };
  if (ascii(b, 0, 5) === "%PDF-") {
    // Illustrator files are PDF-compatible; their header mentions Illustrator early on.
    const head = ascii(b, 0, 4096);
    return { mime: /Adobe Illustrator|Illustrator/i.test(head) ? "application/illustrator" : "application/pdf", ...none };
  }
  if (ascii(b, 0, 4) === "%!PS" || (b[0] === 0xc5 && b[1] === 0xd0 && b[2] === 0xd3 && b[3] === 0xc6)) return { mime: "application/postscript", ...none };
  // Office Open XML (requirements files): a ZIP whose first entries name the document part.
  if (b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) {
    const names = new TextDecoder("latin1").decode(b);
    if (names.includes("[Content_Types].xml") || names.includes("_rels/")) {
      if (names.includes("word/")) return { mime: DOCX, ...none };
      if (names.includes("xl/")) return { mime: XLSX, ...none };
    }
    return { mime: null, ...none };
  }

  // SVG is text: allow a BOM, an XML declaration, comments and a doctype before <svg.
  const text = new TextDecoder("utf-8", { fatal: false }).decode(b.subarray(0, Math.min(b.length, 8192))).replace(/^﻿/, "");
  if (/^\s*(<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(text)) {
    return { mime: "image/svg+xml", ...size(svgSize(text)) };
  }
  return { mime: null, ...none };
}

/** Declared and detected types that are the same format (e.g. image/x-photoshop ↔ image/vnd.adobe.photoshop). */
export function sameFormat(declared: string | null | undefined, detected: string | null): boolean {
  if (!declared || !detected) return false;
  const family = (m: string) =>
    ({
      "application/x-photoshop": "image/vnd.adobe.photoshop",
      "application/illustrator": "application/pdf",
      "application/postscript": "application/postscript",
    })[m] ?? m;
  return declared === detected || family(declared) === family(detected);
}
