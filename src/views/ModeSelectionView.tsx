import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';

const modes = [
  { id: 'flashcard-en-pt', title: 'Flashcards EN → PT', description: 'Think first, flip, then self-rate.' },
  { id: 'flashcard-pt-en', title: 'Flashcards PT → EN', description: 'Reverse the direction for recognition practice.' },
  { id: 'write-in', title: 'Write-in', description: 'Type your answer and record accuracy to Supabase.' },
];

export const ModeSelectionView = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get('batch') ?? 'all';
  const origin = searchParams.get('origin');
  const backUrl = topicId ? (origin === 'auto-skip' ? '/' : `/topics/${topicId}/batches`) : '/';

  return (
    <AppShell title="Choose a mode" subtitle="Flashcards and write-in sessions share the same topic data but present it differently.">
      <div className="mb-6">
        <Link className="text-sm font-semibold text-forest-700" to={backUrl}>
          Back
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {modes.map((mode) => (
          <button
            key={mode.id}
            className="rounded-[1.5rem] border border-ink-800/10 bg-white px-5 py-5 text-left shadow-card"
            onClick={() => {
              const params = new URLSearchParams({ batch: batchId, mode: mode.id });
              if (origin) {
                params.set('origin', origin);
              }
              navigate(`/topics/${topicId}/practice?${params.toString()}`);
            }}
            type="button"
          >
            <h2 className="text-lg font-semibold text-ink-900">{mode.title}</h2>
            <p className="mt-2 text-sm text-ink-800/70">{mode.description}</p>
          </button>
        ))}
      </div>
    </AppShell>
  );
};
