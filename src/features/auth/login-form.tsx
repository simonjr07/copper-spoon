"use client";

import { useActionState, useId, useState } from "react";

import {
  loginAction,
  type LoginActionState,
} from "@/features/auth/actions";

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const messageId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();

  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      <div>
        <label className="block text-sm font-medium text-ink" htmlFor="email">
          Email
        </label>
        <input
          aria-describedby={state.fieldErrors?.email ? emailErrorId : undefined}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-copper focus:ring-2 focus:ring-copper/20"
          id="email"
          name="email"
          type="email"
        />
        {state.fieldErrors?.email ? (
          <p className="mt-2 text-sm text-red-700" id={emailErrorId}>
            {state.fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink" htmlFor="password">
          Password
        </label>
        <div className="relative mt-2">
          <input
            aria-describedby={
              state.fieldErrors?.password ? passwordErrorId : undefined
            }
            aria-invalid={Boolean(state.fieldErrors?.password)}
            autoComplete="current-password"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 pr-20 text-ink outline-none transition focus:border-copper focus:ring-2 focus:ring-copper/20"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-copper hover:text-ink"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {state.fieldErrors?.password ? (
          <p className="mt-2 text-sm text-red-700" id={passwordErrorId}>
            {state.fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      <p aria-live="polite" className="min-h-5 text-sm text-red-700" id={messageId}>
        {state.message}
      </p>

      <button
        className="flex w-full items-center justify-center rounded-xl bg-ink px-5 py-3 font-medium text-white transition hover:bg-copper disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
