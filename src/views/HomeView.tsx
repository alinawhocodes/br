import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { SortToggle } from '../components/SortToggle';
import { TopicCard } from '../components/TopicCard';
import { useStats } from '../hooks/useStats';
import { useTopics } from '../hooks/useTopics';

type HomeViewProps = {
  userId: string;
  onSignOut: () => Promise<void>;
};

type SortMode = 'sequential' | 'worst-first';

export const HomeView = ({ userId, onSignOut }: HomeViewProps) => {
  const navigate = useNavigate();
  const [sortMode, setSortMode] = useState<SortMode>('sequential');
  const { topics, loading, error } = useTopics();
  const { topicRates, reviewDueCount, reviewQueueCount, loading: statsLoading, error: statsError } = useStats(userId, topics);

  const sortedTopics = useMemo(() => {
    if (sortMode === 'sequential') {
      return topics;
    }

    return [...topics].sort((left, right) => {
      const leftAccuracy = topicRates[left.id]?.accuracy ?? 0;
      const rightAccuracy = topicRates[right.id]?.accuracy ?? 0;
      return leftAccuracy - rightAccuracy;
    });
  }, [sortMode, topicRates, topics]);

  return (
    <AppShell
      action={
        <button className="rounded-full border border-ink-800/10 px-4 py-2 text-sm font-semibold text-ink-900" onClick={() => void onSignOut()}>
          Sign out
        </button>
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Topics</h2>
          <p className="text-sm text-ink-800/70">Tap a card to continue into batch and mode selection.</p>
        </div>
        <SortToggle value={sortMode} onChange={setSortMode} />
      </div>

      {loading ? <p className="mt-8 text-sm text-ink-800/70">Loading topics...</p> : null}
      {error ? <p className="mt-8 rounded-2xl bg-terracotta-500/10 px-4 py-3 text-sm text-terracotta-600">{error}</p> : null}
      {statsError ? <p className="mt-4 rounded-2xl bg-terracotta-500/10 px-4 py-3 text-sm text-terracotta-600">{statsError}</p> : null}
      {statsLoading ? <p className="mt-4 text-sm text-ink-800/70">Refreshing tracked performance...</p> : null}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink-900">Review</h2>
        <button
          className="mt-3 w-full rounded-[1.75rem] border border-forest-700/20 bg-forest-700 px-5 py-5 text-left text-white shadow-card transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-ink-800/20 disabled:text-ink-800/50 disabled:hover:translate-y-0"
          type="button"
          onClick={() => navigate('/review/modes')}
          disabled={reviewQueueCount === 0}
        >
          <span className="block text-xl font-semibold">Review Today</span>
          <span className="mt-1 block text-sm text-white/80">
            {reviewQueueCount > 0
              ? `${reviewQueueCount}-card review${reviewDueCount > reviewQueueCount ? `, ${reviewDueCount} due total` : ''}`
              : 'No cards due right now'}
          </span>
        </button>
      </section>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sortedTopics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            successRate={topicRates[topic.id]?.accuracy ?? null}
            onOpen={() => navigate(`/topics/${topic.id}/batches`)}
          />
        ))}
      </div>
    </AppShell>
  );
};
