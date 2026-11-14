import { z } from "zod";
import { slugify } from "@/lib/slugify";

/** Admin content validation (mirrors DB constraints). Messages are French (admin UI). */

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LOCALES = ["fr", "ar", "en"] as const;

const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `${max} caractères maximum.` })
    .transform((v) => (v ? v : null));

const req = (max: number) =>
  z.string().trim().min(1, { error: "Champ requis." }).max(max, { error: `${max} caractères maximum.` });

const slugInput = z
  .string()
  .trim()
  .toLowerCase()
  .refine((v) => v === "" || (SLUG.test(v) && v.length <= 120), { error: "Minuscules, chiffres et tirets uniquement." });

const uuidOrNull = z
  .string()
  .trim()
  .refine((v) => v === "" || z.uuid().safeParse(v).success, { error: "Valeur invalide." })
  .transform((v) => (v ? v : null));

const sortOrder = z.coerce.number({ error: "Nombre entier attendu." }).int().min(-100000).max(100000).catch(0);
const checkbox = z.preprocess((v) => v === "on" || v === "true", z.boolean());

/** Localized text fields: <name>_fr (required or optional), <name>_ar, <name>_en. */
function localized(name: string, max: number, requiredFr: boolean) {
  return {
    [`${name}_fr`]: requiredFr ? req(max) : opt(max),
    [`${name}_ar`]: opt(max),
    [`${name}_en`]: opt(max),
  } as Record<string, z.ZodType>;
}

const slugShape = { slug_fr: slugInput, slug_ar: slugInput, slug_en: slugInput };

/**
 * Fill empty slugs from names (fr/en; Arabic stays empty unless typed — page falls back to the
 * French slug) and enforce "a slug needs a name in that locale".
 */
function withSlugs<T extends Record<string, unknown>>(data: T, ctx: z.RefinementCtx) {
  const out: Record<string, unknown> = { ...data };
  for (const locale of LOCALES) {
    const name = data[`name_${locale}`] as string | null;
    let slug = (data[`slug_${locale}`] as string) || "";
    if (!slug && name && locale !== "ar") slug = slugify(name);
    if (slug && !name) {
      ctx.addIssue({ code: "custom", path: [`slug_${locale}`], message: "Renseignez d'abord le nom dans cette langue." });
    }
    out[`slug_${locale}`] = slug || null;
  }
  if (!out.slug_fr) ctx.addIssue({ code: "custom", path: ["slug_fr"], message: "Slug français requis (lettres latines)." });
  return out;
}

const specEntry = z.object({
  label: z.object({ fr: z.string().trim().min(1).max(120), ar: z.string().trim().max(120).optional(), en: z.string().trim().max(120).optional() }),
  value: z.object({ fr: z.string().trim().min(1).max(500), ar: z.string().trim().max(500).optional(), en: z.string().trim().max(500).optional() }),
});

const specifications = z
  .string()
  .default("[]")
  .transform((raw, ctx) => {
    try {
      const parsed = z.array(specEntry).max(50).safeParse(JSON.parse(raw || "[]"));
      if (parsed.success) return parsed.data;
    } catch {
      // fall through
    }
    ctx.addIssue({ code: "custom", message: "Caractéristiques invalides : chaque ligne doit avoir un libellé et une valeur en français." });
    return z.NEVER;
  });

export const productSchema = z
  .object({
    ...localized("name", 200, true),
    ...slugShape,
    ...localized("short_description", 500, false),
    ...localized("description", 10000, false),
    category_id: uuidOrNull,
    sku: opt(64),
    status: z.enum(["draft", "published", "archived"]).catch("draft"),
    is_featured: checkbox,
    sort_order: sortOrder,
    specifications,
  })
  .transform(withSlugs);

export const categorySchema = z
  .object({
    ...localized("name", 120, true),
    ...slugShape,
    ...localized("description", 2000, false),
    parent_id: uuidOrNull,
    is_published: checkbox,
    sort_order: sortOrder,
  })
  .transform(withSlugs);

export const serviceSchema = z
  .object({
    ...localized("name", 160, true),
    ...slugShape,
    ...localized("summary", 500, false),
    ...localized("description", 10000, false),
    status: z.enum(["draft", "published", "archived"]).catch("draft"),
    is_featured: checkbox,
    sort_order: sortOrder,
  })
  .transform(withSlugs);

/** FormData → plain object for the schemas (unchecked checkboxes are simply absent). */
export function formToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of formData.entries()) if (typeof value === "string" && !key.startsWith("$")) result[key] = value;
  return result;
}
