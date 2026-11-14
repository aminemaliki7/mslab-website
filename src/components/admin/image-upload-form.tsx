"use client";

import { AdminForm } from "@/components/admin/admin-form";
import { Field, Input } from "@/components/ui/form";
import { uploadProductImage } from "@/features/admin/content-actions";

/** Upload one image (JPEG/PNG/WebP/AVIF, ≤ 5 MB) with alt text per language. */
export function ImageUploadForm({ productId }: { productId: string }) {
  return (
    <AdminForm action={uploadProductImage} submitLabel="Téléverser l'image" encType="multipart/form-data" submitVariant="secondary">
      {(state) => (
        <div className="space-y-4">
          <input type="hidden" name="id" value={productId} />
          <Field id="file" label="Fichier image" required hint="JPEG, PNG, WebP ou AVIF — 5 Mo maximum." error={state.fieldErrors.file}>
            {(p) => <Input {...p} name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="h-auto py-2" />}
          </Field>
          <div className="grid gap-3 md:grid-cols-3">
            <Field id="alt_fr" label="Texte alternatif (fr)" hint="Décrit l'image pour l'accessibilité.">
              {(p) => <Input {...p} name="alt_fr" maxLength={250} />}
            </Field>
            <Field id="alt_ar" label="Texte alternatif (ar)" dir="rtl">
              {(p) => <Input {...p} name="alt_ar" maxLength={250} lang="ar" />}
            </Field>
            <Field id="alt_en" label="Texte alternatif (en)">
              {(p) => <Input {...p} name="alt_en" maxLength={250} lang="en" />}
            </Field>
          </div>
        </div>
      )}
    </AdminForm>
  );
}
