import type { Locale } from "@/i18n/config";

/**
 * Organizations shown in the homepage "They trust us" logo strip.
 *
 * Only organizations MSLAB has verified as clients and is authorized to reference
 * (confirmed by the owner on 2026-11-15). Logo files are the owner-supplied originals,
 * cropped/trimmed and converted to WebP in public/brand/clients/ (proportions and colors
 * unchanged). To add an organization: get the same confirmation, add an authentic logo file
 * at least ~150 px tall, then add an entry here.
 *
 * The Drâa-Tafilalet chamber is the Chambre d'Artisanat (owner-supplied logo, 2026-11-15);
 * the research pack had listed it as the Chambre d'Agriculture.
 *
 * Not shown yet (no logo file supplied): Direction Provinciale de l'Éducation Nationale,
 * Arrondissement Bni Makada.
 */
export type ClientLogo = {
  id: string;
  /** Official name per locale — used as the image's alt text. */
  name: Record<Locale, string>;
  src: string;
  /** Intrinsic size of the file (reserves space: no layout shift). */
  width: number;
  height: number;
};

export const CLIENT_LOGOS: readonly ClientLogo[] = [
  {
    id: "ofppt",
    name: {
      fr: "Office de la formation professionnelle et de la promotion du travail (OFPPT)",
      ar: "مكتب التكوين المهني وإنعاش الشغل",
      en: "Office for Vocational Training and Employment Promotion (OFPPT)",
    },
    src: "/brand/clients/ofppt.webp",
    width: 238,
    height: 160,
  },
  {
    id: "ispits-errachidia",
    name: {
      fr: "Institut supérieur des professions infirmières et techniques de santé (ISPITS) d'Errachidia",
      ar: "المعهد العالي للمهن التمريضية وتقنيات الصحة بالرشيدية",
      en: "Higher Institute of Nursing and Health Techniques (ISPITS) Errachidia",
    },
    src: "/brand/clients/ispits-errachidia.webp",
    width: 120,
    height: 114,
  },
  {
    id: "cnss",
    name: {
      fr: "Caisse nationale de sécurité sociale (CNSS)",
      ar: "الصندوق الوطني للضمان الاجتماعي",
      en: "National Social Security Fund (CNSS)",
    },
    src: "/brand/clients/cnss.webp",
    width: 168,
    height: 160,
  },
  {
    id: "ormva-tafilalet",
    name: {
      fr: "Office régional de mise en valeur agricole du Tafilalet (ORMVA/TF)",
      ar: "المكتب الجهوي للاستثمار الفلاحي لتافيلالت",
      en: "Tafilalet Regional Office for Agricultural Development (ORMVA/TF)",
    },
    src: "/brand/clients/ormva-tafilalet.webp",
    width: 282,
    height: 160,
  },
  {
    id: "fp-errachidia",
    name: {
      fr: "Faculté polydisciplinaire d'Errachidia",
      ar: "الكلية المتعددة التخصصات بالرشيدية",
      en: "Multidisciplinary Faculty of Errachidia",
    },
    src: "/brand/clients/fp-errachidia.webp",
    width: 174,
    height: 160,
  },
  {
    id: "chambre-artisanat-draa-tafilalet",
    name: {
      fr: "Chambre d'artisanat de la région Drâa-Tafilalet",
      ar: "غرفة الصناعة التقليدية لجهة درعة تافيلالت",
      en: "Drâa-Tafilalet Regional Chamber of Crafts",
    },
    src: "/brand/clients/chambre-artisanat-draa-tafilalet.webp",
    width: 206,
    height: 160,
  },
  {
    id: "chambre-artisanat-beni-mellal-khenifra",
    name: {
      fr: "Chambre d'artisanat de la région Béni Mellal-Khénifra",
      ar: "غرفة الصناعة التقليدية لجهة بني ملال خنيفرة",
      en: "Béni Mellal-Khénifra Regional Chamber of Crafts",
    },
    src: "/brand/clients/chambre-artisanat-beni-mellal-khenifra.webp",
    width: 190,
    height: 160,
  },
];
