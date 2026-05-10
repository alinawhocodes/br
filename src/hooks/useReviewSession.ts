import { useEffect, useState } from 'react';
import { loadReviewQueue, type ReviewTask } from '../lib/review';
import type { PracticeMode } from '../types';

type ReviewSessionState = {
  tasks: ReviewTask[];
  currentIndex: number;
  loading: boolean;
  error: string | null;
};

const shuffleTasks = (tasks: ReviewTask[]): ReviewTask[] => {
  const shuffled = [...tasks];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};

export const useReviewSession = (params: {
  userId: string;
  mode: PracticeMode | null;
  taskIdsOverride?: string[];
}) => {
  const [state, setState] = useState<ReviewSessionState>({
    tasks: [],
    currentIndex: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!params.mode) {
      setState({
        tasks: [],
        currentIndex: 0,
        loading: false,
        error: 'Missing review mode.',
      });
      return;
    }

    let isActive = true;

    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    loadReviewQueue({
      userId: params.userId,
      mode: params.mode,
      taskIdsOverride: params.taskIdsOverride,
    })
      .then((tasks) => {
        if (!isActive) {
          return;
        }

        const shuffledTasks = shuffleTasks(tasks);

        setState({
          tasks: shuffledTasks,
          currentIndex: 0,
          loading: false,
          error: shuffledTasks.length === 0 ? 'No cards are due for this review mode.' : null,
        });
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setState({
          tasks: [],
          currentIndex: 0,
          loading: false,
          error: error instanceof Error ? error.message : 'Unable to start review.',
        });
      });

    return () => {
      isActive = false;
    };
  }, [params.mode, params.taskIdsOverride, params.userId]);

  const currentTask = state.tasks[state.currentIndex] ?? null;

  const moveToNextTask = () => {
    setState((current) => {
      if (current.tasks.length === 0) {
        return current;
      }

      return {
        ...current,
        currentIndex: (current.currentIndex + 1) % current.tasks.length,
      };
    });
  };

  return {
    ...state,
    currentTask,
    totalTasks: state.tasks.length,
    moveToNextTask,
  };
};
