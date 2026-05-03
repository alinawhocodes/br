import type { PropsWithChildren, ReactNode } from 'react';

type AppShellProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  action?: ReactNode;
}>;

export const AppShell = ({ title, subtitle, action, children }: AppShellProps) => (
  <div className="min-h-screen bg-grain px-4 py-6 sm:px-6">
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col rounded-[2rem] border border-white/60 bg-white/80 shadow-card backdrop-blur">
      <header className="border-b border-ink-800/10 px-5 py-5 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-forest-700">Portuguese Practice</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-sm text-ink-800/70">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      </header>
      <main className="flex-1 px-5 py-6 sm:px-8">{children}</main>
    </div>
  </div>
);
