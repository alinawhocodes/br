import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

type AuthFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  footer: ReactNode;
};

export const AuthForm = ({ title, description, submitLabel, onSubmit, footer }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(email, password);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-[1.75rem] border border-ink-800/10 bg-sand-50/90 p-6 shadow-card">
      <h2 className="text-2xl font-semibold text-ink-900">{title}</h2>
      <p className="mt-2 text-sm text-ink-800/70">{description}</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink-900">Email</span>
          <input
            className="w-full rounded-2xl border border-ink-800/10 bg-white px-4 py-3 outline-none transition focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink-900">Password</span>
          <input
            className="w-full rounded-2xl border border-ink-800/10 bg-white px-4 py-3 outline-none transition focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-500/20"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <p className="rounded-2xl bg-terracotta-500/10 px-4 py-3 text-sm text-terracotta-600">{error}</p> : null}
        <button
          className="w-full rounded-full bg-ink-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Working...' : submitLabel}
        </button>
      </form>
      <div className="mt-5 text-sm text-ink-800/70">{footer}</div>
    </div>
  );
};
