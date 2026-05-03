import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { PlaceholderPanel } from '../components/PlaceholderPanel';

export const PracticeView = () => {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const batch = searchParams.get('batch');
  const backToModes = topicId ? `/topics/${topicId}/modes?batch=${batch ?? 'all'}` : '/';

  return (
    <AppShell title="Practice session" subtitle="The next pass will turn this placeholder into the real looping task runner.">
      <div className="mb-6">
        <Link className="text-sm font-semibold text-forest-700" to={backToModes}>
          Back
        </Link>
      </div>
      <PlaceholderPanel
        title="Practice placeholder"
        body={`Selected mode: ${mode ?? 'unknown'}. Selected batch: ${batch ?? 'all'}. The routing and session parameters are wired, so the next step is implementing task presentation and results handling.`}
      />
    </AppShell>
  );
};
