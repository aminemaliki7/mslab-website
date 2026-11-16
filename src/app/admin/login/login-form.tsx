"use client";

import { useActionState } from "react";
import { useAdminT } from "@/components/admin/admin-i18n";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { translateMessage } from "@/features/admin/dictionary";
import { signIn, type LoginState } from "@/features/admin/session-actions";

const initial: LoginState = { error: null, email: "" };

export function LoginForm() {
  const { lang, t } = useAdminT();
  const [state, action, pending] = useActionState(signIn, initial);
  return (
    <form action={action} className="space-y-5">
      {state.error ? (
        <p role="alert" className="bg-danger-soft text-danger rounded-[var(--radius-control)] px-3 py-2 text-sm">
          {translateMessage(state.error, lang)}
        </p>
      ) : null}
      <Field id="email" label={t.login.email} required dir="ltr">
        {(p) => <Input {...p} name="email" type="email" autoComplete="username" dir="ltr" defaultValue={state.email} />}
      </Field>
      <Field id="password" label={t.login.password} required dir="ltr">
        {(p) => <Input {...p} name="password" type="password" autoComplete="current-password" dir="ltr" />}
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t.login.submitting : t.login.submit}
      </Button>
    </form>
  );
}
