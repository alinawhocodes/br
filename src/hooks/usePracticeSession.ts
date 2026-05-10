import { useEffect, useState } from 'react';
import { loadTopic } from './useTopics';
import { getBatchOptionById, getTasksForBatch } from '../lib/batch';
import { getPracticeTasksForMode } from '../lib/practiceTasks';
import type { BatchOption, PracticeMode, PracticeTask, Topic } from '../types';

type PracticeSessionState = {
  topic: Topic | null;
  batch: BatchOption | null;
  tasks: PracticeTask[];
  currentIndex: number;
  loading: boolean;
  error: string | null;
};

const shuffleTasks = (tasks: PracticeTask[]): PracticeTask[] => {
  const shuffled = [...tasks];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};

export const isPracticeMode = (value: string | null): value is PracticeMode =>
  value === 'flashcard-en-pt' || value === 'flashcard-pt-en' || value === 'write-in' || value === 'fill-in';

export const usePracticeSession = (params: {
  topicId: string | undefined;
  batchId: string;
  mode: PracticeMode | null;
  taskIdsOverride?: string[];
}) => {
  const [state, setState] = useState<PracticeSessionState>({
    topic: null,
    batch: null,
    tasks: [],
    currentIndex: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!params.topicId) {
      setState({
        topic: null,
        batch: null,
        tasks: [],
        currentIndex: 0,
        loading: false,
        error: 'Missing topic selection.',
      });
      return;
    }

    if (!params.mode) {
      setState({
        topic: null,
        batch: null,
        tasks: [],
        currentIndex: 0,
        loading: false,
        error: 'Missing practice mode.',
      });
      return;
    }

    const practiceMode = params.mode;
    let isActive = true;

    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    loadTopic(params.topicId)
      .then((topic) => {
        if (!isActive) {
          return;
        }

        if (!topic) {
          setState({
            topic: null,
            batch: null,
            tasks: [],
            currentIndex: 0,
            loading: false,
            error: 'Topic not found.',
          });
          return;
        }

        const batch = getBatchOptionById(topic.tasks, params.batchId) ?? getBatchOptionById(topic.tasks, 'all');
        const batchTasks = getTasksForBatch(topic.tasks, params.batchId);
        const modeTasks = getPracticeTasksForMode(batchTasks, practiceMode);
        const selectedTasks =
          params.taskIdsOverride && params.taskIdsOverride.length > 0
            ? modeTasks.filter((task) => params.taskIdsOverride?.includes(task.id))
            : modeTasks;
        const shuffledTasks = shuffleTasks(selectedTasks);

        setState({
          topic,
          batch,
          tasks: shuffledTasks,
          currentIndex: 0,
          loading: false,
          error: shuffledTasks.length === 0 ? 'This batch has no tasks.' : null,
        });
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setState({
          topic: null,
          batch: null,
          tasks: [],
          currentIndex: 0,
          loading: false,
          error: error instanceof Error ? error.message : 'Unable to start the practice session.',
        });
      });

    return () => {
      isActive = false;
    };
  }, [params.batchId, params.mode, params.taskIdsOverride, params.topicId]);

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

  const moveToPreviousTask = () => {
    setState((current) => {
      if (current.tasks.length === 0) {
        return current;
      }

      return {
        ...current,
        currentIndex: (current.currentIndex - 1 + current.tasks.length) % current.tasks.length,
      };
    });
  };

  const reshuffleTasks = () => {
    setState((current) => ({
      ...current,
      tasks: shuffleTasks(current.tasks),
      currentIndex: 0,
    }));
  };

  return {
    ...state,
    currentTask,
    totalTasks: state.tasks.length,
    progressLabel: state.tasks.length === 0 ? '0 / 0' : `${state.currentIndex + 1} / ${state.tasks.length}`,
    moveToNextTask,
    moveToPreviousTask,
    reshuffleTasks,
  };
};
