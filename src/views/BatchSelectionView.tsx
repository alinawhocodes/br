import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { PlaceholderPanel } from '../components/PlaceholderPanel';
import { loadTopic } from '../hooks/useTopics';
import { buildBatchOptions, shouldSkipBatchSelection } from '../lib/batch';
import type { Topic } from '../types';

export const BatchSelectionView = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId) {
      return;
    }

    loadTopic(topicId)
      .then((loadedTopic) => {
        if (!loadedTopic) {
          setError('Topic not found.');
          return;
        }

        if (shouldSkipBatchSelection(loadedTopic.tasks.length)) {
          navigate(`/topics/${loadedTopic.id}/modes?batch=all&origin=auto-skip`, { replace: true });
          return;
        }

        setTopic(loadedTopic);
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load this topic.');
      });
  }, [navigate, topicId]);

  const batches = topic ? buildBatchOptions(topic.tasks) : [];

  return (
    <AppShell title="Choose a batch" subtitle="Large topics get split into evenly sized slices before mode selection.">
      <div className="mb-6">
        <Link className="text-sm font-semibold text-forest-700" to="/">
          Back to Home
        </Link>
      </div>

      {error ? <p className="rounded-2xl bg-terracotta-500/10 px-4 py-3 text-sm text-terracotta-600">{error}</p> : null}
      {!topic && !error ? <PlaceholderPanel title="Loading topic..." body="Preparing batch options from the selected topic file." /> : null}

      {topic ? (
        <div className="grid gap-4 md:grid-cols-2">
          {batches.map((batch) => (
            <button
              key={batch.id}
              className="rounded-[1.5rem] border border-ink-800/10 bg-white px-5 py-5 text-left shadow-card"
              onClick={() => navigate(`/topics/${topic.id}/modes?batch=${batch.id}`)}
              type="button"
            >
              <h2 className="text-lg font-semibold text-ink-900">{batch.label}</h2>
              <p className="mt-2 text-sm text-ink-800/70">{batch.taskCount} tasks</p>
            </button>
          ))}
        </div>
      ) : null}
    </AppShell>
  );
};
