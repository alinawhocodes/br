import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { PlaceholderPanel } from '../components/PlaceholderPanel';
import { loadTopic } from '../hooks/useTopics';
import { buildBatchOptions, shouldSkipBatchSelection } from '../lib/batch';
import { getTaskStatIds } from '../lib/practiceTasks';
import { fetchTaskStats } from '../lib/stats';
import type { Topic } from '../types';

type BatchSelectionViewProps = {
  userId: string;
};

export const BatchSelectionView = ({ userId }: BatchSelectionViewProps) => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batchRates, setBatchRates] = useState<Record<string, number | null>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!topicId) {
      return () => {
        isActive = false;
      };
    }

    loadTopic(topicId)
      .then(async (loadedTopic) => {
        if (!loadedTopic) {
          setError('Topic not found.');
          return;
        }

        if (shouldSkipBatchSelection(loadedTopic.tasks.length)) {
          navigate(`/topics/${loadedTopic.id}/modes?batch=all&origin=auto-skip`, { replace: true });
          return;
        }

        setTopic(loadedTopic);

        setStatsLoading(true);
        setStatsError(null);

        try {
          const stats = await fetchTaskStats(
            userId,
            getTaskStatIds(loadedTopic.tasks),
          );

          if (!isActive) {
            return;
          }

          const batches = buildBatchOptions(loadedTopic.tasks);
          const rates = batches.reduce<Record<string, number | null>>((accumulator, batch) => {
            const taskIds = new Set(getTaskStatIds(loadedTopic.tasks.slice(batch.start, batch.end)));
            const relevantStats = stats.filter((stat) => taskIds.has(stat.task_id) && stat.times_shown > 0);

            const totals = relevantStats.reduce(
              (result, stat) => ({
                shown: result.shown + stat.times_shown,
                correct: result.correct + stat.times_correct,
              }),
              { shown: 0, correct: 0 },
            );

            accumulator[batch.id] = totals.shown > 0 ? totals.correct / totals.shown : null;
            return accumulator;
          }, {});

          setBatchRates(rates);
          setStatsLoading(false);
        } catch (statsLoadError: unknown) {
          if (!isActive) {
            return;
          }

          setStatsLoading(false);
          setStatsError(statsLoadError instanceof Error ? statsLoadError.message : 'Unable to load batch performance.');
        }
      })
      .catch((loadError: unknown) => {
        if (!isActive) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Unable to load this topic.');
      });

    return () => {
      isActive = false;
    };
  }, [navigate, topicId, userId]);

  const batches = topic ? buildBatchOptions(topic.tasks) : [];

  return (
    <AppShell title="Choose a batch" subtitle="Large topics get split into evenly sized slices before mode selection.">
      <div className="mb-6">
        <Link className="text-sm font-semibold text-forest-700" to="/">
          Back to Home
        </Link>
      </div>

      {error ? <p className="rounded-2xl bg-terracotta-500/10 px-4 py-3 text-sm text-terracotta-600">{error}</p> : null}
      {statsError ? <p className="mt-3 rounded-2xl bg-terracotta-500/10 px-4 py-3 text-sm text-terracotta-600">{statsError}</p> : null}
      {statsLoading ? <p className="mt-3 text-sm text-ink-800/70">Loading batch performance...</p> : null}
      {!topic && !error ? <PlaceholderPanel title="Loading topic..." body="Preparing batch options from the selected topic file." /> : null}

      {topic ? (
        <div className="grid gap-4 md:grid-cols-2">
          {batches.map((batch) => {
            const rate = batchRates[batch.id];

            return (
              <button
                key={batch.id}
                className="rounded-[1.5rem] border border-ink-800/10 bg-white px-5 py-5 text-left shadow-card"
                onClick={() => navigate(`/topics/${topic.id}/modes?batch=${batch.id}`)}
                type="button"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-ink-900">{batch.label}</h2>
                    <p className="mt-2 text-sm text-ink-800/70">{batch.taskCount} tasks</p>
                  </div>
                  <div className="rounded-2xl bg-sand-50 px-3 py-2 text-right">
                    <p className="text-sm font-semibold text-forest-700">
                      {rate === null || rate === undefined ? 'No data yet' : `${Math.round(rate * 100)}% success`}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </AppShell>
  );
};
