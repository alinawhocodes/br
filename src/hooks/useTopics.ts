import { useEffect, useState } from 'react';
import { getTopicById, getTopicSummaries } from '../data/topics-manifest';
import type { Topic, TopicSummary } from '../types';

type TopicState = {
  topics: TopicSummary[];
  loading: boolean;
  error: string | null;
};

export const useTopics = () => {
  const [state, setState] = useState<TopicState>({
    topics: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isActive = true;

    getTopicSummaries()
      .then((topics) => {
        if (!isActive) {
          return;
        }

        setState({ topics, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setState({
          topics: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Unable to load topics.',
        });
      });

    return () => {
      isActive = false;
    };
  }, []);

  return state;
};

export const loadTopic = async (topicId: string): Promise<Topic | null> => getTopicById(topicId);
