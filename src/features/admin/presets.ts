/**
 * Ready-made choices for the back office, already written in French, Arabic and English, so
 * admins pick instead of typing (and translating) common names. They are generic trade terms,
 * not claims: MSLAB decides what to add. Pure module (server actions read names from here,
 * never from the browser).
 */
export type Names = { fr: string; ar: string; en: string };
export type Preset = { key: string; names: Names };

export const MATERIAL_PRESETS: Preset[] = [
  { key: "coated-paper", names: { fr: "Papier couché", ar: "ورق مصقول", en: "Coated paper" } },
  { key: "offset-paper", names: { fr: "Papier offset (non couché)", ar: "ورق أوفست (غير مصقول)", en: "Uncoated (offset) paper" } },
  { key: "cardboard", names: { fr: "Carton", ar: "كرتون", en: "Cardboard" } },
  { key: "kraft", names: { fr: "Papier kraft", ar: "ورق كرافت", en: "Kraft paper" } },
  { key: "adhesive-paper", names: { fr: "Papier adhésif", ar: "ورق لاصق", en: "Adhesive paper" } },
  { key: "vinyl", names: { fr: "Vinyle adhésif", ar: "فينيل لاصق", en: "Adhesive vinyl" } },
  { key: "pvc", names: { fr: "PVC", ar: "PVC", en: "PVC" } },
  { key: "banner", names: { fr: "Bâche", ar: "قماش مشمّع (باش)", en: "Banner vinyl" } },
  { key: "cotton", names: { fr: "Coton", ar: "قطن", en: "Cotton" } },
  { key: "polyester", names: { fr: "Polyester", ar: "بوليستر", en: "Polyester" } },
  { key: "ceramic", names: { fr: "Céramique", ar: "سيراميك", en: "Ceramic" } },
  { key: "acrylic", names: { fr: "Plexiglas", ar: "بليكسيغلاس", en: "Acrylic (Plexiglas)" } },
  { key: "wood", names: { fr: "Bois", ar: "خشب", en: "Wood" } },
];

export const FINISH_PRESETS: Preset[] = [
  { key: "matte", names: { fr: "Pelliculage mat", ar: "تغليف مطفي", en: "Matte lamination" } },
  { key: "gloss", names: { fr: "Pelliculage brillant", ar: "تغليف لامع", en: "Gloss lamination" } },
  { key: "soft-touch", names: { fr: "Pelliculage soft-touch", ar: "تغليف بملمس ناعم (soft-touch)", en: "Soft-touch lamination" } },
  { key: "spot-uv", names: { fr: "Vernis sélectif", ar: "ورنيش انتقائي", en: "Spot UV varnish" } },
  { key: "gold-foil", names: { fr: "Dorure", ar: "تذهيب", en: "Gold foil" } },
  { key: "embossing", names: { fr: "Gaufrage", ar: "نقش بارز", en: "Embossing" } },
  { key: "die-cut", names: { fr: "Découpe à la forme", ar: "قصّ حسب الشكل", en: "Die cutting" } },
  { key: "rounded-corners", names: { fr: "Coins arrondis", ar: "زوايا مستديرة", en: "Rounded corners" } },
  { key: "folding", names: { fr: "Pliage", ar: "طيّ", en: "Folding" } },
  { key: "stapled", names: { fr: "Reliure agrafée", ar: "تجليد بالدبابيس", en: "Saddle stitching" } },
  { key: "spiral", names: { fr: "Reliure spirale", ar: "تجليد حلزوني", en: "Spiral binding" } },
  { key: "embroidery", names: { fr: "Broderie", ar: "تطريز", en: "Embroidery" } },
];

export const CATEGORY_PRESETS: Preset[] = [
  { key: "stationery", names: { fr: "Papeterie", ar: "قرطاسية", en: "Stationery" } },
  { key: "office", names: { fr: "Fournitures de bureau", ar: "لوازم مكتبية", en: "Office supplies" } },
  { key: "school", names: { fr: "Fournitures scolaires", ar: "لوازم مدرسية", en: "School supplies" } },
  { key: "books", names: { fr: "Livres", ar: "كتب", en: "Books" } },
  { key: "printing", names: { fr: "Impression", ar: "طباعة", en: "Printing" } },
  { key: "apparel", names: { fr: "Textile personnalisé", ar: "ملابس مخصّصة", en: "Custom apparel" } },
  { key: "promo", names: { fr: "Objets personnalisés", ar: "منتجات مخصّصة", en: "Custom items" } },
  { key: "packaging", names: { fr: "Packaging", ar: "تغليف", en: "Packaging" } },
  { key: "stamps", names: { fr: "Tampons et cachets", ar: "أختام وطوابع", en: "Stamps" } },
  { key: "consumables", names: { fr: "Consommables (encre, toner)", ar: "مستهلكات (حبر، تونر)", en: "Consumables (ink, toner)" } },
];

/** Common product specifications: a label, and typical values to pick from. */
export type SpecPreset = { key: string; label: Names; values: Names[] };

const n = (fr: string, ar: string, en: string): Names => ({ fr, ar, en });
const same = (v: string): Names => ({ fr: v, ar: v, en: v });

export const SPEC_PRESETS: SpecPreset[] = [
  { key: "format", label: n("Format", "المقاس", "Size"), values: ["A3", "A4", "A5", "A6"].map(same) },
  {
    key: "paper-weight",
    label: n("Grammage", "وزن الورق", "Paper weight"),
    values: ["70 g/m²", "80 g/m²", "90 g/m²", "120 g/m²", "170 g/m²", "250 g/m²", "350 g/m²"].map(same),
  },
  { key: "pages", label: n("Nombre de pages", "عدد الصفحات", "Number of pages"), values: ["48", "96", "100", "200"].map(same) },
  {
    key: "ruling",
    label: n("Réglure", "التسطير", "Ruling"),
    values: [n("Petits carreaux", "مربعات صغيرة", "Small squares"), n("Grands carreaux (Seyès)", "مربعات كبيرة (Seyès)", "Seyès ruling"), n("Lignée", "مسطّر", "Lined"), n("Blanc", "أبيض", "Plain")],
  },
  {
    key: "binding",
    label: n("Reliure", "التجليد", "Binding"),
    values: [n("Spirale", "حلزوني", "Spiral"), n("Agrafée", "مدبّس", "Stapled"), n("Cousue", "مخيط", "Sewn"), n("Collée", "ملصق", "Glued")],
  },
  {
    key: "color",
    label: n("Couleur", "اللون", "Colour"),
    values: [n("Noir", "أسود", "Black"), n("Bleu", "أزرق", "Blue"), n("Rouge", "أحمر", "Red"), n("Vert", "أخضر", "Green"), n("Blanc", "أبيض", "White"), n("Multicolore", "متعدد الألوان", "Assorted colours")],
  },
  {
    key: "material",
    label: n("Matière", "المادة", "Material"),
    values: [n("Papier", "ورق", "Paper"), n("Carton", "كرتون", "Cardboard"), n("Plastique", "بلاستيك", "Plastic"), n("Métal", "معدن", "Metal"), n("Coton", "قطن", "Cotton")],
  },
  {
    key: "packaging",
    label: n("Conditionnement", "التعبئة", "Pack size"),
    values: [n("À l'unité", "بالوحدة", "Single"), n("Paquet de 10", "علبة من 10", "Pack of 10"), n("Boîte de 50", "علبة من 50", "Box of 50"), n("Ramette de 500 feuilles", "رزمة من 500 ورقة", "Ream of 500 sheets")],
  },
  { key: "dimensions", label: n("Dimensions", "الأبعاد", "Dimensions"), values: [] },
  { key: "language", label: n("Langue", "اللغة", "Language"), values: [n("Français", "الفرنسية", "French"), n("Arabe", "العربية", "Arabic"), n("Anglais", "الإنجليزية", "English")] },
];
