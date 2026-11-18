"use client";

import { AdminForm } from "@/components/admin/admin-form";
import { LocalizedField, TextField } from "@/components/admin/fields";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { saveStudioOption, saveStudioProduct, saveStudioView } from "@/features/admin/studio-actions";
import { VIEW_KEYS, type OptionKind, type StudioProductKey, type ViewKey } from "@/features/print-on-demand/studio";
import { format } from "@/i18n/format";
import { useAdminT } from "./admin-i18n";

type Values = Record<string, string | number | boolean | null>;

export function StudioProductForm({ productKey, minDpi }: { productKey: StudioProductKey; minDpi: number | null }) {
  const { t } = useAdminT();
  const s = t.pod.studio;
  return (
    <AdminForm action={saveStudioProduct} submitLabel={t.common.save} submitVariant="secondary">
      {(state) => (
        <div className="max-w-xs">
          <input type="hidden" name="product_key" value={productKey} />
          <TextField name="min_dpi" label={s.minDpi} hint={s.minDpiHint} type="number" values={{ min_dpi: minDpi }} errors={state.fieldErrors} />
        </div>
      )}
    </AdminForm>
  );
}

export type StudioViewRow = {
  id: string;
  view: ViewKey;
  image_width: number;
  image_height: number;
  area_x: number;
  area_y: number;
  area_w: number;
  area_h: number;
  print_width_mm: number | null;
  print_height_mm: number | null;
  sort_order: number;
  is_active: boolean;
  mask_path: string | null;
  displacement_path: string | null;
};

/** Create (view = null) or edit one printable side. */
export function StudioViewForm({ productKey, view, taken }: { productKey: StudioProductKey; view: StudioViewRow | null; taken: ViewKey[] }) {
  const { t } = useAdminT();
  const s = t.pod.studio;
  const values: Values = view ? { ...view } : { sort_order: 0, is_active: true };
  const choices = VIEW_KEYS.filter((k) => !taken.includes(k) || k === view?.view);
  const file = (name: string, label: string, hint: string, error?: string) => (
    <Field id={`${name}-${view?.id ?? "new"}`} label={label} hint={hint} error={error}>
      {(p) => <Input {...p} name={name} type="file" accept="image/jpeg,image/png,image/webp" className="h-auto py-2" />}
    </Field>
  );

  return (
    <AdminForm action={saveStudioView} submitLabel={view ? t.common.save : s.addView} encType="multipart/form-data" submitVariant={view ? "secondary" : "primary"}>
      {(state) => {
        const e = state.fieldErrors;
        return (
          <div className="space-y-5">
            <input type="hidden" name="product_key" value={productKey} />
            {view ? <input type="hidden" name="id" value={view.id} /> : null}
            <div className="grid gap-4 md:grid-cols-2">
              <Field id={`view-${view?.id ?? "new"}`} label={s.view} required error={e.view}>
                {(p) => (
                  <Select {...p} name="view" defaultValue={view?.view ?? choices[0]}>
                    {choices.map((k) => (
                      <option key={k} value={k}>
                        {s.viewNames[k]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              {file("image", view ? s.replacePhoto : s.photo, s.photoHint, e.image)}
            </div>
            {view ? <p className="text-fg-muted text-xs">{format(s.imageSize, { w: view.image_width, h: view.image_height })}</p> : null}

            <fieldset>
              <legend className="text-fg text-sm font-semibold">{s.area}</legend>
              <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
                {(["area_x", "area_y", "area_w", "area_h"] as const).map((k) => (
                  <TextField key={k} name={k} label={s[k === "area_x" ? "areaX" : k === "area_y" ? "areaY" : k === "area_w" ? "areaW" : "areaH"]} type="number" required values={values} errors={e} />
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-fg text-sm font-semibold">{s.printSize}</legend>
              <p className="text-fg-muted text-xs">{s.printSizeHint}</p>
              <div className="mt-2 grid grid-cols-2 gap-3 md:max-w-md">
                <TextField name="print_width_mm" label={s.printW} values={values} errors={e} />
                <TextField name="print_height_mm" label={s.printH} values={values} errors={e} />
              </div>
            </fieldset>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                {file("mask", s.mask, s.maskHint, e.mask)}
                {view?.mask_path ? (
                  <label className="mt-2 flex min-h-11 items-center gap-2 text-sm">
                    <Checkbox name="remove_mask" className="mt-0" /> {s.removeMask}
                  </label>
                ) : null}
              </div>
              <div>
                {file("displacement", s.displacement, s.displacementHint, e.displacement)}
                {view?.displacement_path ? (
                  <label className="mt-2 flex min-h-11 items-center gap-2 text-sm">
                    <Checkbox name="remove_displacement" className="mt-0" /> {s.removeDisplacement}
                  </label>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-6">
              <div className="w-32">
                <TextField name="sort_order" label={t.common.sortOrder} type="number" values={values} errors={e} />
              </div>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <Checkbox name="is_active" defaultChecked={view ? view.is_active : true} className="mt-0" /> {s.active}
              </label>
            </div>
          </div>
        );
      }}
    </AdminForm>
  );
}

export function StudioOptionForm({ productKey, kind }: { productKey: StudioProductKey; kind: OptionKind }) {
  const { t } = useAdminT();
  const s = t.pod.studio;
  return (
    <AdminForm action={saveStudioOption} submitLabel={s.addOption} submitVariant="secondary">
      {(state) => (
        <div className="space-y-4">
          <input type="hidden" name="product_key" value={productKey} />
          <input type="hidden" name="kind" value={kind} />
          <LocalizedField name="name" label={s.optionName} values={{}} errors={state.fieldErrors} requiredFr maxLength={120} />
          {kind === "color" ? (
            <Field id={`hex-${productKey}`} label={s.hex} required error={state.fieldErrors.hex}>
              {(p) => <Input {...p} name="hex" placeholder="#FFFFFF" maxLength={7} dir="ltr" pattern="#[0-9A-Fa-f]{6}" />}
            </Field>
          ) : null}
        </div>
      )}
    </AdminForm>
  );
}
