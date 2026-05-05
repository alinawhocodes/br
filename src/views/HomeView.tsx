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
  const { topicRates, loading: statsLoading, error: statsError } = useStats(userId, topics);

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
      title="Choose a topic"
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
