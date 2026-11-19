// Recolours the red heat-press illustration to the brand's Midnight Navy (#193642), 2026-11-19.
// Only red pixels move: each keeps its lightness relation to the red base (#9C0D29), so the
// background lands exactly on #193642, shadows stay darker and highlights lighter. Whites,
// greys and anti-aliased edges are weighted by hue and saturation, so line art stays clean.
// Usage: node scripts/recolor-illustration.mjs <source.jpg> <out.jpg>
import sharp from "sharp";

const [src, out] = process.argv.slice(2);
if (!src || !out) throw new Error("usage: recolor-illustration.mjs <source> <out>");

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return [h, s, l];
}
function hslToRgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
const smooth = (e0, e1, x) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

const [RED_H, RED_S, RED_L] = rgbToHsl(0x9c, 0x0d, 0x29); // illustration red
const [NAVY_H, NAVY_S, NAVY_L] = rgbToHsl(0x19, 0x36, 0x42); // Midnight Navy

const { data, info } = await sharp(src).toColorspace("srgb").removeAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 3) {
  const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
  const hueDist = Math.min(Math.abs(h - RED_H), 360 - Math.abs(h - RED_H));
  const hueW = 1 - smooth(25, 40, hueDist);
  const w = hueW * smooth(0.12, 0.35, s);
  if (w <= 0) {
    // Greys with a faint pink cast (platen, rollers): neutralise to the same lightness.
    const tint = hueW * smooth(0.02, 0.06, s);
    if (tint > 0) {
      const grey = l * 255;
      for (let k = 0; k < 3; k++) data[i + k] = Math.round(data[i + k] * (1 - tint) + grey * tint);
    }
    continue;
  }
  const l2 = l <= RED_L ? (l * NAVY_L) / RED_L : NAVY_L + ((l - RED_L) * (1 - NAVY_L)) / (1 - RED_L);
  const s2 = Math.min(1, (s * NAVY_S) / RED_S);
  const [r, g, b] = hslToRgb(NAVY_H, s2, l2);
  data[i] = Math.round(data[i] * (1 - w) + r * w);
  data[i + 1] = Math.round(data[i + 1] * (1 - w) + g * w);
  data[i + 2] = Math.round(data[i + 2] * (1 - w) + b * w);
}
await sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } }).jpeg({ quality: 88, mozjpeg: true }).toFile(out);
console.log("wrote", out);
