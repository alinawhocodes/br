import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { PlaceholderPanel } from '../components/PlaceholderPanel';

export const ResultsView = () => (
  <AppShell title="Results" subtitle="This route is ready for session summaries, retry-wrong actions, and restart flows.">
    <div className="mb-6">
      <Link className="text-sm font-semibold text-forest-700" to="/">
        Back to Home
      </Link>
    </div>
    <PlaceholderPanel
      title="Results placeholder"
      body="Write-in sessions will show score and wrong answers here, while flashcard sessions will show a lightweight summary of tasks seen."
    />
  </AppShell>
);
