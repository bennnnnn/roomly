'use client';

import { useState } from 'react';

import { sendMagicLink } from './actions';

export interface LoginFormProps {
  staffError: boolean;
}

export function LoginForm({ staffError }: LoginFormProps) {
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>(
    staffError ? 'This account is not staff.' : undefined,
  );
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(undefined);
    setMessage(undefined);
    const result = await sendMagicLink(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage('Check your email for a sign-in link.');
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <label className="text-sm font-medium text-neutral-700" htmlFor="email">
        Work email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        placeholder="you@company.com"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-accent-600">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? 'Sending…' : 'Send magic link'}
      </button>
    </form>
  );
}
