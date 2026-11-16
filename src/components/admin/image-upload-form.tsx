"use client";

import { AdminForm } from "@/components/admin/admin-form";
import { Field, Input } from "@/components/ui/form";
import { uploadProductImage } from "@/features/admin/content-actions";
import { useAdminT } from "./admin-i18n";

/** Upload one image (JPEG/PNG/WebP/AVIF, ≤ 5 MB) with a description per language. */
export function ImageUploadForm({ productId }: { productId: string }) {
  const { t } = useAdminT();
  const u = t.products.upload;
  return (
    <AdminForm action={uploadProductImage} submitLabel={u.submit} encType="multipart/form-data" submitVariant="secondary">
      {(state) => (
        <div className="space-y-4">
          <h3 className="text-fg font-semibold">{u.title}</h3>
          <input type="hidden" name="id" value={productId} />
          <Field id="file" label={u.file} required hint={u.fileHint} error={state.fieldErrors.file}>
            {(p) => <Input {...p} name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="h-auto py-2" />}
          </Field>
          <Field id="alt_fr" label={`${u.alt} (${t.locales.fr})`} hint={u.altHint} dir="ltr">
            {(p) => <Input {...p} name="alt_fr" maxLength={250} lang="fr" />}
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field id="alt_ar" label={`${u.alt} (${t.locales.ar})`} dir="rtl">
              {(p) => <Input {...p} name="alt_ar" maxLength={250} lang="ar" />}
            </Field>
            <Field id="alt_en" label={`${u.alt} (${t.locales.en})`} dir="ltr">
              {(p) => <Input {...p} name="alt_en" maxLength={250} lang="en" />}
            </Field>
          </div>
        </div>
      )}
    </AdminForm>
  );
}
