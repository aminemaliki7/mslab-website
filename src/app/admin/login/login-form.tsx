"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { signIn, type LoginState } from "@/features/admin/session-actions";

const initial: LoginState = { error: null, email: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial);
  return (
    <form action={action} className="space-y-5">
      {state.error ? (
        <p role="alert" className="bg-danger-soft text-danger rounded-[var(--radius-control)] px-3 py-2 text-sm">
          {state.error}
        </p>
      ) : null}
      <Field id="email" label="E-mail" required>
        {(p) => <Input {...p} name="email" type="email" autoComplete="username" defaultValue={state.email} />}
      </Field>
      <Field id="password" label="Mot de passe" required>
        {(p) => <Input {...p} name="password" type="password" autoComplete="current-password" />}
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
