import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { useAuth } from './hooks/useAuth';
import { BatchSelectionView } from './views/BatchSelectionView';
import { HomeView } from './views/HomeView';
import { LoginView } from './views/LoginView';
import { ModeSelectionView } from './views/ModeSelectionView';
import { PracticeView } from './views/PracticeView';
import { RegisterView } from './views/RegisterView';
import { ResultsView } from './views/ResultsView';
import { WaitingView } from './views/WaitingView';

const LoadingScreen = () => (
  <AppShell title="Loading" subtitle="Connecting to Supabase and restoring your session.">
    <p className="text-sm text-ink-800/70">Just a moment...</p>
  </AppShell>
);

const ErrorScreen = ({ message }: { message: string }) => (
  <AppShell title="Configuration issue" subtitle="The app started, but something blocked the initial auth or profile lookup.">
    <p className="rounded-2xl bg-terracotta-500/10 px-4 py-3 text-sm text-terracotta-600">{message}</p>
  </AppShell>
);

function App() {
  const auth = useAuth();

  if (auth.loading) {
    return <LoadingScreen />;
  }

  if (auth.error) {
    return <ErrorScreen message={auth.error} />;
  }

  if (!auth.user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginView onSubmit={auth.signIn} />} />
        <Route path="/register" element={<RegisterView onSubmit={auth.signUp} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!auth.isConfirmed) {
    return <WaitingView email={auth.user.email} onSignOut={auth.signOut} />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomeView userId={auth.user.id} onSignOut={auth.signOut} />} />
      <Route path="/topics/:topicId/batches" element={<BatchSelectionView />} />
      <Route path="/topics/:topicId/modes" element={<ModeSelectionView />} />
      <Route path="/topics/:topicId/practice" element={<PracticeView />} />
      <Route path="/results" element={<ResultsView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
