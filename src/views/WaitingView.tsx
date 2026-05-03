import { AppShell } from '../components/AppShell';

type WaitingViewProps = {
  email: string | undefined;
  onSignOut: () => Promise<void>;
};

export const WaitingView = ({ email, onSignOut }: WaitingViewProps) => (
  <AppShell
    title="Waiting for approval"
    subtitle="Your account exists, but the teacher still needs to flip your confirmation flag in Supabase before you can practice."
    action={
      <button className="rounded-full border border-ink-800/10 px-4 py-2 text-sm font-semibold text-ink-900" onClick={() => void onSignOut()}>
        Sign out
      </button>
    }
  >
    <div className="mx-auto mt-12 max-w-xl rounded-[1.75rem] bg-sand-50 p-6">
      <p className="text-lg font-semibold text-ink-900">{email ?? 'This account'}</p>
      <p className="mt-3 text-sm text-ink-800/70">
        Once you are confirmed, refreshing or signing back in will bring you straight into the app.
      </p>
    </div>
  </AppShell>
);
