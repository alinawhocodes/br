import { useEffect, useMemo, useState } from 'react';
import { fetchTaskStats } from '../lib/stats';
import type { TaskStat, TopicSummary } from '../types';

type TopicRate = {
  taskCount: number;
  completedCount: number;
  accuracy: number | null;
};

type StatsState = {
  loading: boolean;
  error: string | null;
  topicRates: Record<string, TopicRate>;
};

const buildRates = (topics: TopicSummary[], stats: TaskStat[]): Record<string, TopicRate> =>
  topics.reduce<Record<string, TopicRate>>((accumulator, topic) => {
    const topicStats = stats.filter((stat) => topic.taskIds.includes(stat.task_id) && stat.times_shown > 0);
    const totals = topicStats.reduce(
      (result, stat) => ({
        shown: result.shown + stat.times_shown,
        correct: result.correct + stat.times_correct,
      }),
      { shown: 0, correct: 0 },
    );

    accumulator[topic.id] = {
      taskCount: topic.taskCount,
      completedCount: topicStats.length,
      accuracy: totals.shown > 0 ? totals.correct / totals.shown : null,
    };

    return accumulator;
  }, {});

export const useStats = (userId: string | null, topics: TopicSummary[]) => {
  const [state, setState] = useState<StatsState>({
    loading: false,
    error: null,
    topicRates: {},
  });

  const taskIds = useMemo(() => topics.flatMap((topic) => topic.taskIds), [topics]);

  useEffect(() => {
    if (!userId || taskIds.length === 0) {
      setState({
        loading: false,
        error: null,
        topicRates: buildRates(topics, []),
      });
      return;
    }

    let isActive = true;

    setState((current) => ({ ...current, loading: true, error: null }));

    fetchTaskStats(userId, taskIds)
      .then((stats) => {
        if (!isActive) {
          return;
        }

        setState({
          loading: false,
          error: null,
          topicRates: buildRates(topics, stats),
        });
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setState({
          loading: false,
          error: error instanceof Error ? error.message : 'Unable to load stats.',
          topicRates: buildRates(topics, []),
        });
      });

    return () => {
      isActive = false;
    };
  }, [taskIds, topics, userId]);

  return state;
};
