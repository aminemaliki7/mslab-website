/**
 * MSLAB catalogue artwork — every catalogue product is shown printed with MSLAB's OWN identity
 * (owner request 2026-11-23): the ribbon "ms" + "Lab" + dot logo (exact paths of
 * src/components/layout/wordmark.tsx), the site palette (src/app/globals.css) and only verified
 * facts (site_settings: phone, Errachidia address; the promise from docs/POSITIONING.md).
 *
 * Each function returns a standalone SVG; build-catalogue-mockups.mjs writes them to
 * design/catalogue-mockups/artwork/*.svg (editable sources) before compositing.
 * Fonts: Century Gothic (geometric, stands in for Jost) and Bahnschrift condensed (for Anton
 * headlines) — Windows system fonts, since the web fonts are not installed for librsvg.
 */

export const C = {
  teal: "#0B6E8A", tealDark: "#085870", tealLight: "#5BA7BC", mist: "#E7F2F5",
  navy: "#193642", ink: "#0E1A2B", ivory: "#F7F6F2", paper: "#ECEAE3", line: "#D3D0C6",
  slate: "#5B6779", magenta: "#C2255C", yellow: "#F2C14E", white: "#FFFFFF",
};

export const FACTS = {
  promiseFr: "Votre idée. Votre design. Notre production.",
  lineFr: "Impression & production sur mesure",
  phone: "+212 6 70 36 70 05",
  web: "www.mslab.ma",
  address: "Rue 04 N° 57, Cité Azemour, Errachidia",
};

const SERVICES_FR = [
  "Impression & reprographie",
  "Vêtements & produits personnalisés",
  "Objets d’entreprise & promotionnels",
  "Papeterie & fournitures de bureau",
  "Livres, brochures & imprimés",
  "Packaging & production en série",
];

// ── Logo (viewBox 40 54 380 244) ─────────────────────────────────────────────
const M_PATH = "M 44 218 L 44 114 A 56 56 0 0 1 156 114 L 156 154 A 13 13 0 0 0 182 154 L 182 114 A 56 56 0 0 1 294 114 L 294 218 L 246 218 L 246 114 A 8 8 0 0 0 230 114 L 230 156 A 61 61 0 0 1 108 156 L 108 114 A 8 8 0 0 0 92 114 L 92 218 Z";
const S_PATH = "M 304 114 A 56 56 0 0 1 416 114 L 416 162 A 56 56 0 0 1 304 162 Z M 416 110 L 362 110 A 8 8 0 0 0 362 126 L 416 126 Z M 304 150 L 358 150 A 8 8 0 0 1 358 166 L 304 166 Z";
const LAB_PATH = "M66.5 293.5L44 293.5L44 238L55.1 238L55.1 284.0L66.5 284.0L66.5 293.5ZM78.1 294L78.1 294Q74.1 294 72.1 292.2Q70.0 290.3 69.3 287.2Q68.5 284.0 68.5 279.9L68.5 279.9Q68.5 275.6 69.4 272.9Q70.2 270.1 72.3 268.3Q74.3 266.6 78.0 265.3L78.0 265.3L85.0 262.9L85.0 258.1Q85.0 254.3 82.5 254.3L82.5 254.3Q80.2 254.3 80.2 257.4L80.2 257.4L80.2 260.2L69.2 260.2Q69.2 259.9 69.2 259.6Q69.2 259.2 69.2 258.7L69.2 258.7Q69.2 251.6 72.5 248.6Q75.8 245.7 83.1 245.7L83.1 245.7Q86.9 245.7 89.8 247.0Q92.8 248.4 94.6 251.0Q96.3 253.6 96.3 257.5L96.3 257.5L96.3 293.5L85.1 293.5L85.1 287.9Q84.3 290.8 82.4 292.4Q80.5 294 78.1 294ZM82.5 285.2L82.5 285.2Q83.9 285.2 84.4 284.1Q84.9 282.9 84.9 281.5L84.9 281.5L84.9 268.4Q82.6 269.3 81.3 270.7Q80.0 272.2 80.0 275.0L80.0 275.0L80.0 281.0Q80.0 285.2 82.5 285.2ZM119.6 294L119.6 294Q116.8 294 115.1 292.6Q113.3 291.3 112.3 288.5L112.3 288.5L112.3 293.5L100.8 293.5L100.8 238L112.3 238L112.3 251.2Q113.3 248.6 115.2 247.2Q117.0 245.7 120.5 245.7L120.5 245.7Q125.1 245.7 127.0 249.1Q128.9 252.4 128.9 257.9L128.9 257.9L128.9 281.2Q128.9 284.8 127.9 287.7Q126.9 290.6 124.9 292.3Q122.8 294 119.6 294ZM114.9 285.2L114.9 285.2Q116.7 285.2 117.1 283.4Q117.5 281.7 117.5 279.1L117.5 279.1L117.5 260.6Q117.5 258.0 117.1 256.2Q116.7 254.5 114.9 254.5L114.9 254.5Q113.1 254.5 112.7 256.3Q112.3 258.1 112.3 260.6L112.3 260.6L112.3 279.1Q112.3 281.6 112.7 283.4Q113.1 285.2 114.9 285.2Z";

const LOGO_COLORS = {
  color: { ms: C.teal, lab: C.ink, dot: C.teal },
  inverted: { ms: C.tealLight, lab: C.white, dot: C.tealLight },
  white: { ms: C.white, lab: C.white, dot: C.white },
  navy: { ms: C.ink, lab: C.ink, dot: C.ink },
  teal: { ms: C.teal, lab: C.teal, dot: C.teal },
};

/** Full logo, top-left at (x, y), `w` wide (height = w × 244/380). */
export function logo(x, y, w, variant = "color") {
  const c = LOGO_COLORS[variant];
  const s = w / 380;
  return `<g transform="translate(${x} ${y}) scale(${s}) translate(-40 -54)"><path fill="${c.ms}" d="${M_PATH}"/><path fill="${c.ms}" fill-rule="evenodd" d="${S_PATH}"/><path fill="${c.lab}" d="${LAB_PATH}"/><circle cx="386" cy="264" r="30" fill="${c.dot}"/></g>`;
}
/** "ms" ribbon only (viewBox 40 54 380 168), top-left at (x, y), `w` wide. */
export function mark(x, y, w, fill) {
  const s = w / 380;
  return `<g transform="translate(${x} ${y}) scale(${s}) translate(-40 -54)"><path fill="${fill}" d="${M_PATH}"/><path fill="${fill}" fill-rule="evenodd" d="${S_PATH}"/></g>`;
}

/** Printer's crop marks around a box — MSLAB is a print shop. */
function cropMarks(x, y, w, h, len, gap, color, sw) {
  const l = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}"/>`;
  return [
    l(x - gap - len, y, x - gap, y), l(x, y - gap - len, x, y - gap),
    l(x + w + gap, y, x + w + gap + len, y), l(x + w, y - gap - len, x + w, y - gap),
    l(x - gap - len, y + h, x - gap, y + h), l(x, y + h + gap, x, y + h + gap + len),
    l(x + w + gap, y + h, x + w + gap + len, y + h), l(x + w, y + h + gap, x + w, y + h + gap + len),
  ].join("");
}
/** CMYK process swatches (a print colour bar). */
function cmykBar(x, y, size, gap) {
  return [C.teal, C.magenta, C.yellow, C.ink].map((f, i) => `<rect x="${x + i * (size + gap)}" y="${y}" width="${size}" height="${size}" fill="${f}"/>`).join("");
}
/** Approximate Century Gothic Bold advance widths (em) for even ring spacing. */
const GLYPH_EM = { " ": 0.32, "·": 0.34, I: 0.3, M: 0.96, W: 1.0, O: 0.9, Q: 0.9, C: 0.84, G: 0.88, D: 0.8, N: 0.8, H: 0.76, U: 0.72, A: 0.76, R: 0.64, P: 0.62, E: 0.6, F: 0.56, S: 0.56, T: 0.56, L: 0.52, J: 0.5, "&": 0.8 };

/** Text around a circle, centred on `centre` degrees (−90 = top), one rotated glyph per letter
 *  (librsvg has no textPath). */
function ringText(cx, cy, r, text, { size, centre = -90, tracking = 0.08, family = "Century Gothic", weight = "bold", fill }) {
  const chars = [...text];
  const adv = chars.map((ch) => (GLYPH_EM[ch] ?? 0.66) * size + tracking * size);
  const total = adv.reduce((a, b) => a + b, 0);
  const deg = (px) => (px / r) * (180 / Math.PI);
  let a0 = centre - deg(total) / 2;
  let out = "";
  chars.forEach((ch, i) => {
    const a = a0 + deg(adv[i] / 2);
    a0 += deg(adv[i]);
    const rad = (a * Math.PI) / 180;
    const px = cx + r * Math.cos(rad), py = cy + r * Math.sin(rad);
    const rot = a + 90;
    out += `<text x="0" y="0" transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${rot.toFixed(2)})" text-anchor="middle" font-family="${family}" font-weight="${weight}" font-size="${size}" fill="${fill}">${ch === "&" ? "&amp;" : ch}</text>`;
  });
  return out;
}
const svg = (w, h, comment, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n  <!-- MSLAB — ${comment} -->\n  ${body}\n</svg>\n`;
const esc = (s) => s.replace(/&/g, "&amp;");

// ── Artwork ───────────────────────────────────────────────────────────────────
export const ARTWORK = {
  /** 85 × 55 mm card, logo side: teal full bleed, white logo, crop-mark frame. */
  "mslab-business-card-front": () => svg(850, 550, "business card, logo side (85 × 55 mm, full bleed)", [
    `<rect width="850" height="550" fill="${C.teal}"/>`,
    mark(470, 250, 520, C.tealDark),
    logo(110, 150, 300, "white"),
    `<text x="112" y="440" font-family="Century Gothic" font-size="22" letter-spacing="6" fill="${C.white}">${esc(FACTS.lineFr.toUpperCase())}</text>`,
  ].join("\n  ")),

  /** Contact side on warm white board: verified facts only. */
  "mslab-business-card-back": () => svg(850, 550, "business card, contact side", [
    `<rect width="850" height="550" fill="${C.ivory}"/>`,
    logo(70, 60, 150, "color"),
    `<text x="72" y="270" font-family="Century Gothic" font-weight="bold" font-size="30" fill="${C.ink}">${esc(FACTS.lineFr)}</text>`,
    `<rect x="72" y="296" width="54" height="4" fill="${C.teal}"/>`,
    `<g font-family="Century Gothic" font-size="23" fill="${C.slate}"><text x="72" y="350">${FACTS.phone}</text><text x="72" y="388">${FACTS.web}</text><text x="72" y="426">${FACTS.address}</text></g>`,
    cmykBar(72, 470, 16, 6),
  ].join("\n  ")),

  /** A4 letterhead with a sample letter (MSLAB's own quotation process, no invented claims). */
  "mslab-letterhead": () => svg(2100, 2970, "A4 letterhead with a sample letter", [
    `<rect width="2100" height="2970" fill="${C.white}"/>`,
    `<rect x="0" y="0" width="525" height="18" fill="${C.teal}"/><rect x="525" y="0" width="525" height="18" fill="${C.magenta}"/><rect x="1050" y="0" width="525" height="18" fill="${C.yellow}"/><rect x="1575" y="0" width="525" height="18" fill="${C.ink}"/>`,
    logo(180, 170, 300, "color"),
    `<g font-family="Century Gothic" font-size="28" fill="${C.slate}" text-anchor="end"><text x="1920" y="230">${esc(FACTS.lineFr)}</text><text x="1920" y="272">${FACTS.address}</text><text x="1920" y="314">${FACTS.phone} · ${FACTS.web}</text></g>`,
    `<rect x="180" y="440" width="1740" height="2" fill="${C.line}"/>`,
    `<g font-family="Georgia" fill="${C.ink}">`,
    `<text x="1920" y="580" text-anchor="end" font-size="38">Errachidia, le 14 janvier 2027</text>`,
    `<text x="180" y="740" font-size="40" font-weight="bold">Objet : votre demande de devis de production</text>`,
    `<g font-size="38" fill="#2A3A44">`,
    ...[
      [870, "Madame, Monsieur,"],
      [970, "Nous vous remercions pour votre demande. Afin d’établir un devis précis,"],
      [1026, "nous vous invitons à nous préciser les éléments suivants :"],
      [1110, "— le produit et son format, ainsi que le support souhaité ;"],
      [1166, "— la quantité à produire et, le cas échéant, les déclinaisons ;"],
      [1222, "— vos fichiers ou votre idée de design, et la date de livraison visée."],
      [1322, "Chaque commande est étudiée et chiffrée sur devis : nous revenons vers"],
      [1378, "vous avec une proposition adaptée à votre projet et à vos quantités."],
      [1478, "Nous restons à votre disposition pour en discuter par téléphone ou à"],
      [1534, "notre atelier d’Errachidia."],
      [1634, "Veuillez agréer, Madame, Monsieur, nos salutations distinguées."],
    ].map(([y, t]) => `<text x="180" y="${y}">${esc(t)}</text>`),
    `</g>`,
    `<text x="180" y="1830" font-size="40" font-style="italic">L’équipe MSLAB</text>`,
    `</g>`,
    `<rect x="180" y="2690" width="90" height="5" fill="${C.teal}"/>`,
    `<text x="180" y="2760" font-family="Century Gothic" font-size="27" fill="${C.slate}">MSLAB · ${esc(FACTS.lineFr)} · ${FACTS.address} · ${FACTS.web}</text>`,
  ].join("\n  ")),

  /** A4 flyer: the promise, the six lines, the call to action. */
  "mslab-flyer": () => svg(2100, 2970, "A4 promotional flyer (full bleed)", [
    `<rect width="2100" height="2970" fill="${C.navy}"/>`,
    mark(760, 120, 1700, "#21485A"),
    logo(170, 190, 430, "inverted"),
    `<g font-family="Bahnschrift" font-weight="bold" font-stretch="condensed" fill="${C.white}">`,
    `<text x="170" y="1000" font-size="250">VOTRE IDÉE.</text>`,
    `<text x="170" y="1250" font-size="250">VOTRE DESIGN.</text>`,
    `<text x="170" y="1500" font-size="250" fill="${C.tealLight}">NOTRE PRODUCTION.</text>`,
    `</g>`,
    `<text x="175" y="1640" font-family="Century Gothic" font-size="58" letter-spacing="10" fill="${C.white}">IMPRESSION &amp; PRODUCTION SUR MESURE</text>`,
    `<rect x="175" y="1730" width="1750" height="3" fill="#2F566A"/>`,
    ...SERVICES_FR.map((s, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 175 + col * 900, y = 1880 + row * 130;
      return `<rect x="${x}" y="${y - 34}" width="26" height="26" fill="${[C.teal, C.magenta, C.yellow, C.tealLight, C.magenta, C.yellow][i]}"/><text x="${x + 56}" y="${y - 6}" font-family="Century Gothic" font-size="50" fill="${C.white}">${esc(s)}</text>`;
    }),
    `<rect x="0" y="2400" width="2100" height="570" fill="${C.teal}"/>`,
    `<text x="175" y="2580" font-family="Bahnschrift" font-weight="bold" font-stretch="condensed" font-size="120" fill="${C.white}">DEMANDEZ VOTRE DEVIS DE PRODUCTION</text>`,
    `<text x="175" y="2720" font-family="Century Gothic" font-size="66" fill="${C.white}">${FACTS.phone}   ·   ${FACTS.web}</text>`,
    `<text x="175" y="2830" font-family="Century Gothic" font-size="44" fill="${C.mist}">Commandes en quantité, chaque projet sur devis · Errachidia, Maroc</text>`,
  ].join("\n  ")),

  /** Tri-fold, outside: inside flap — the six production lines. */
  "mslab-leaflet-panel-1": () => svg(900, 2040, "tri-fold leaflet, inside flap: production lines", [
    `<rect width="900" height="2040" fill="${C.ivory}"/>`,
    `<rect x="90" y="150" width="70" height="8" fill="${C.teal}"/>`,
    `<text x="90" y="270" font-family="Century Gothic" font-weight="bold" font-size="76" fill="${C.ink}">Nos lignes</text>`,
    `<text x="90" y="355" font-family="Century Gothic" font-weight="bold" font-size="76" fill="${C.teal}">de production</text>`,
    ...SERVICES_FR.map((s, i) => {
      const y = 520 + i * 200;
      return `<text x="90" y="${y}" font-family="Bahnschrift" font-weight="bold" font-stretch="condensed" font-size="64" fill="${C.teal}">0${i + 1}</text><text x="190" y="${y - 6}" font-family="Century Gothic" font-size="40" fill="${C.ink}">${esc(s)}</text><rect x="190" y="${y + 40}" width="620" height="2" fill="${C.line}"/>`;
    }),
    `<text x="90" y="1840" font-family="Century Gothic" font-size="32" fill="${C.slate}">Pour les entreprises, les institutions</text>`,
    `<text x="90" y="1884" font-family="Century Gothic" font-size="32" fill="${C.slate}">et les particuliers.</text>`,
  ].join("\n  ")),

  /** Tri-fold, outside: back panel — how an order works + contact. */
  "mslab-leaflet-panel-2": () => svg(900, 2040, "tri-fold leaflet, back panel: how it works", [
    `<rect width="900" height="2040" fill="${C.white}"/>`,
    `<text x="90" y="270" font-family="Century Gothic" font-weight="bold" font-size="76" fill="${C.ink}">Comment</text>`,
    `<text x="90" y="355" font-family="Century Gothic" font-weight="bold" font-size="76" fill="${C.teal}">ça marche ?</text>`,
    ...[
      ["Votre projet", "Produit, quantité, format", "et délai souhaité."],
      ["Votre devis", "Nous étudions la demande", "et chiffrons la production."],
      ["Notre production", "Fabrication en série", "et livraison de la commande."],
    ].map(([t, a, b], i) => {
      const y = 520 + i * 330;
      return `<circle cx="140" cy="${y}" r="50" fill="${[C.teal, C.magenta, C.yellow][i]}"/><text x="140" y="${y + 20}" text-anchor="middle" font-family="Bahnschrift" font-weight="bold" font-size="56" fill="${i === 2 ? C.ink : C.white}">${i + 1}</text><text x="230" y="${y - 8}" font-family="Century Gothic" font-weight="bold" font-size="46" fill="${C.ink}">${t}</text><text x="230" y="${y + 48}" font-family="Century Gothic" font-size="34" fill="${C.slate}">${a}</text><text x="230" y="${y + 92}" font-family="Century Gothic" font-size="34" fill="${C.slate}">${b}</text>`;
    }),
    `<rect x="90" y="1500" width="720" height="380" rx="24" fill="${C.mist}"/>`,
    logo(140, 1550, 170, "color"),
    `<g font-family="Century Gothic" font-size="34" fill="${C.ink}"><text x="140" y="1740">${FACTS.phone}</text><text x="140" y="1790">${FACTS.web}</text><text x="140" y="1840" font-size="28" fill="${C.slate}">Cité Azemour, Errachidia</text></g>`,
  ].join("\n  ")),

  /** Tri-fold, outside: front cover. */
  "mslab-leaflet-panel-3": () => svg(900, 2040, "tri-fold leaflet, front cover", [
    `<rect width="900" height="2040" fill="${C.teal}"/>`,
    mark(-120, 1180, 1250, C.tealDark),
    logo(110, 200, 420, "white"),
    `<text x="110" y="760" font-family="Bahnschrift" font-weight="bold" font-stretch="condensed" font-size="118" fill="${C.white}">VOTRE IDÉE.</text>`,
    `<text x="110" y="880" font-family="Bahnschrift" font-weight="bold" font-stretch="condensed" font-size="118" fill="${C.white}">VOTRE DESIGN.</text>`,
    `<text x="110" y="1000" font-family="Bahnschrift" font-weight="bold" font-stretch="condensed" font-size="118" fill="${C.mist}">NOTRE PRODUCTION.</text>`,
    `<text x="112" y="1100" font-family="Century Gothic" font-size="34" letter-spacing="6" fill="${C.white}">IMPRESSION &amp; PRODUCTION SUR MESURE</text>`,
    cmykBar(112, 1880, 30, 10),
  ].join("\n  ")),

  /** A4 stapled catalogue cover. */
  "mslab-brochure-cover": () => svg(2100, 2970, "A4 stapled catalogue, front cover", [
    `<rect width="2100" height="2970" fill="${C.ivory}"/>`,
    mark(330, 1050, 1900, C.teal),
    `<circle cx="1860" cy="2440" r="150" fill="${C.teal}"/>`,
    logo(180, 200, 360, "color"),
    `<text x="180" y="790" font-family="Bahnschrift" font-weight="bold" font-stretch="condensed" font-size="230" fill="${C.ink}">CATALOGUE</text>`,
    `<text x="186" y="900" font-family="Century Gothic" font-size="60" letter-spacing="14" fill="${C.teal}">DE PRODUCTION 2027</text>`,
    `<g font-family="Century Gothic" font-size="44" fill="${C.ink}">`,
    `<text x="186" y="2420">Impression · Vêtements · Objets d’entreprise</text>`,
    `<text x="186" y="2490">Papeterie · Livres &amp; imprimés · Packaging</text>`,
    `</g>`,
    `<text x="186" y="2760" font-family="Century Gothic" font-size="40" letter-spacing="8" fill="${C.slate}">${FACTS.web.toUpperCase()}</text>`,
  ].join("\n  ")),

  /** Mailer box lid: one-colour navy flexo print on kraft (transparent ground). Top = hinge.
   *  Centred on the part of the lid the photo shows (clear of the tape band and the thumb). */
  "mslab-mailer-box-lid": () => svg(1000, 1180, "mailer box lid, one-colour print on kraft (multiply), top = hinge", [
    logo(205, 300, 350, "navy"),
    `<rect x="205" y="590" width="350" height="3" fill="${C.ink}"/>`,
    `<text x="380" y="650" text-anchor="middle" font-family="Century Gothic" font-size="25" letter-spacing="5" fill="${C.ink}">${esc(FACTS.lineFr.toUpperCase())}</text>`,
    `<text x="380" y="700" text-anchor="middle" font-family="Century Gothic" font-size="25" letter-spacing="5" fill="${C.ink}">${FACTS.web.toUpperCase()}</text>`,
  ].join("\n  ")),

  /** Paper shopping bag, front panel. */
  "mslab-paper-bag": () => svg(700, 1000, "paper shopping bag, front panel", [
    `<rect width="700" height="1000" fill="${C.white}"/>`,
    logo(185, 210, 330, "color"),
    `<text x="350" y="520" text-anchor="middle" font-family="Century Gothic" font-size="21" letter-spacing="6" fill="${C.slate}">${esc(FACTS.lineFr.toUpperCase())}</text>`,
    `<rect y="640" width="700" height="360" fill="${C.teal}"/>`,
    mark(-60, 700, 520, C.tealDark),
    mark(300, 760, 520, C.tealDark),
    `<g font-family="Century Gothic" font-weight="bold" font-size="34" text-anchor="middle" fill="${C.white}"><text x="350" y="900">Votre idée. Votre design.</text><text x="350" y="948">Notre production.</text></g>`,
  ].join("\n  ")),

  /** A5 spiral notepad top sheet (spiral on the first ~110 px). */
  "mslab-notepad": () => svg(1480, 1980, "A5 spiral notepad, top sheet", [
    `<rect width="1480" height="1980" fill="${C.white}"/>`,
    logo(150, 190, 220, "color"),
    `<text x="1330" y="260" text-anchor="end" font-family="Century Gothic" font-weight="bold" font-size="56" letter-spacing="10" fill="${C.ink}">NOTES</text>`,
    `<g font-family="Century Gothic" font-size="28" fill="${C.slate}"><text x="430" y="380">Projet</text><text x="1000" y="380">Date</text></g>`,
    `<rect x="530" y="384" width="420" height="2" fill="${C.line}"/><rect x="1080" y="384" width="250" height="2" fill="${C.line}"/>`,
    `<rect x="150" y="460" width="1180" height="4" fill="${C.teal}"/>`,
    ...Array.from({ length: 14 }, (_, i) => `<rect x="150" y="${580 + i * 88}" width="1180" height="2" fill="${C.line}"/>`),
    `<text x="150" y="1860" font-family="Century Gothic" font-size="26" letter-spacing="4" fill="${C.slate}">${FACTS.web.toUpperCase()}</text>`,
    cmykBar(1218, 1836, 22, 8),
  ].join("\n  ")),

  /** Round die-cut sticker (the photo's circle), ring text in glyph rotations. */
  "mslab-sticker": () => svg(1000, 1000, "round die-cut sticker", [
    `<circle cx="500" cy="500" r="500" fill="${C.teal}"/>`,
    `<circle cx="500" cy="500" r="430" fill="none" stroke="${C.tealLight}" stroke-width="4"/>`,
    ringText(500, 500, 372, "IMPRESSION · PRODUCTION SUR MESURE", { size: 46, centre: -100, fill: C.white }),
    `<circle cx="500" cy="500" r="300" fill="${C.ivory}"/>`,
    logo(330, 390, 340, "color"),
  ].join("\n  ")),

  /** Mug wrap, front 124° of the cylinder. Proportions match the unrolled surface on the photo
   *  (arc length 2 × 222 px × 1.08 rad ≈ 480 px for 513 px of height → 1000 × 1070). */
  "mslab-mug-wrap": () => svg(1000, 1070, "mug wrap print (front 124°)", [
    logo(250, 200, 500, "color"),
    `<g font-family="Century Gothic" font-weight="bold" font-size="50" text-anchor="middle" fill="${C.ink}"><text x="500" y="690">Votre idée. Votre design.</text><text x="500" y="760" fill="${C.teal}">Notre production.</text></g>`,
    cmykBar(416, 830, 36, 12),
  ].join("\n  ")),

  /** T-shirt chest print: logo inside printer's crop marks + the promise, streetwear scale. */
  "mslab-tshirt-print": () => svg(1000, 1200, "T-shirt front print (screen print)", [
    cropMarks(190, 180, 620, 400, 70, 24, C.ink, 7),
    logo(260, 230, 480, "color"),
    `<g font-family="Bahnschrift" font-weight="bold" font-stretch="condensed" text-anchor="middle" fill="${C.ink}"><text x="500" y="790" font-size="104">VOTRE IDÉE.</text><text x="500" y="900" font-size="104">VOTRE DESIGN.</text><text x="500" y="1010" font-size="104" fill="${C.teal}">NOTRE PRODUCTION.</text></g>`,
    cmykBar(395, 1080, 40, 14),
  ].join("\n  ")),

  /** Hoodie left-chest embroidery (light thread on black). */
  "mslab-hoodie-chest": () => svg(600, 400, "hoodie left-chest embroidery", logo(60, 15, 480, "inverted")),

  /** Hoodie back print, light inks on black. */
  "mslab-hoodie-back": () => svg(1000, 1240, "hoodie back print", [
    mark(80, 60, 840, C.tealLight),
    `<g font-family="Bahnschrift" font-weight="bold" font-stretch="condensed" text-anchor="middle" fill="${C.white}"><text x="500" y="620" font-size="150" letter-spacing="10">MSLAB</text></g>`,
    `<text x="500" y="720" text-anchor="middle" font-family="Century Gothic" font-size="40" letter-spacing="8" fill="${C.white}">IMPRESSION &amp; PRODUCTION</text>`,
    `<text x="500" y="780" text-anchor="middle" font-family="Century Gothic" font-size="40" letter-spacing="8" fill="${C.white}">SUR MESURE</text>`,
    `<rect x="440" y="840" width="120" height="5" fill="${C.tealLight}"/>`,
    `<text x="500" y="940" text-anchor="middle" font-family="Century Gothic" font-size="34" letter-spacing="10" fill="${C.tealLight}">ERRACHIDIA · MAROC</text>`,
  ].join("\n  ")),
};
