import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { AuthForm } from '../components/AuthForm';

type LoginViewProps = {
  onSubmit: (email: string, password: string) => Promise<void>;
};

export const LoginView = ({ onSubmit }: LoginViewProps) => (
  <AppShell title="Welcome back" subtitle="Sign in to keep practicing with your teacher-prepared Portuguese topics.">
    <div className="flex min-h-[60vh] items-center">
      <AuthForm
        title="Login"
        description="Use your Supabase account credentials to continue."
        submitLabel="Sign in"
        onSubmit={onSubmit}
        footer={
          <>
            Need an account?{' '}
            <Link className="font-semibold text-forest-700" to="/register">
              Register
            </Link>
          </>
        }
      />
    </div>
  </AppShell>
);
