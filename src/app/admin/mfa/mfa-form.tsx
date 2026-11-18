"use client";

import { useActionState, useState, useTransition } from "react";
import { useAdminT } from "@/components/admin/admin-i18n";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { translateMessage } from "@/features/admin/dictionary";
import { startTotpEnrollment, verifyTotp, type MfaState, type TotpEnrollment } from "@/features/admin/session-actions";

const initial: MfaState = { error: null };

/** factorId = an already linked authenticator; null = first time, link one first. */
export function MfaForm({ factorId }: { factorId: string | null }) {
  const { lang, t } = useAdminT();
  const [state, action, pending] = useActionState(verifyTotp, initial);
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [starting, startTransition] = useTransition();
  const activeFactor = factorId ?? (enrollment?.ok ? enrollment.factorId : null);
  const error = state.error ?? (enrollment && !enrollment.ok ? enrollment.error : null);

  return (
    <div className="space-y-5">
      {error ? (
        <p role="alert" className="bg-danger-soft text-danger rounded-[var(--radius-control)] px-3 py-2 text-sm">
          {translateMessage(error, lang)}
        </p>
      ) : null}

      {!factorId && !enrollment?.ok ? (
        <Button type="button" className="w-full" disabled={starting} onClick={() => startTransition(async () => setEnrollment(await startTotpEnrollment()))}>
          {starting ? t.mfa.settingUp : t.mfa.setup}
        </Button>
      ) : null}

      {enrollment?.ok ? (
        <div className="space-y-3 text-sm">
          <p>{t.mfa.scan}</p>
          {/* Supabase returns the QR code as an SVG data URL (allowed by the CSP img-src data:). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrollment.qrCode} alt="" width={180} height={180} className="mx-auto rounded bg-white p-2" />
          <p className="text-fg-muted">{t.mfa.secret}</p>
          <code dir="ltr" className="bg-surface block break-all rounded px-2 py-1 font-mono text-xs select-all">
            {enrollment.secret}
          </code>
        </div>
      ) : null}

      {activeFactor ? (
        <form action={action} className="space-y-5">
          <input type="hidden" name="factorId" value={activeFactor} />
          <Field id="code" label={t.mfa.code} required dir="ltr">
            {(p) => <Input {...p} name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} dir="ltr" autoFocus />}
          </Field>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t.mfa.submitting : t.mfa.submit}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
