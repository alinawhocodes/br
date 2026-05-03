import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { AuthForm } from '../components/AuthForm';

type RegisterViewProps = {
  onSubmit: (email: string, password: string) => Promise<void>;
};

export const RegisterView = ({ onSubmit }: RegisterViewProps) => (
  <AppShell title="Create your account" subtitle="Registration is open, but each learner is approved manually before practice begins.">
    <div className="flex min-h-[60vh] items-center">
      <AuthForm
        title="Register"
        description="After signing up, your account will stay on the waiting screen until confirmed in Supabase."
        submitLabel="Create account"
        onSubmit={onSubmit}
        footer={
          <>
            Already registered?{' '}
            <Link className="font-semibold text-forest-700" to="/login">
              Sign in
            </Link>
          </>
        }
      />
    </div>
  </AppShell>
);
