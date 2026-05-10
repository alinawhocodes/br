import type { PracticeMode, PracticeTask, Task, TopicSummary } from '../types';

export const getFillInTasks = (tasks: Task[]): PracticeTask[] => tasks.flatMap((task) => task.fillIns ?? []);

export const hasFillInTasks = (tasks: Task[]): boolean => tasks.some((task) => task.fillIns && task.fillIns.length > 0);

export const getPracticeTasksForMode = (tasks: Task[], mode: PracticeMode): PracticeTask[] =>
  mode === 'fill-in' ? getFillInTasks(tasks) : tasks;

export const getTaskStatIds = (tasks: Task[]): string[] => [
  ...tasks.map((task) => task.id),
  ...getFillInTasks(tasks).map((task) => task.id),
];

export const getTopicSummaryStatIds = (topic: TopicSummary): string[] => [
  ...topic.taskIds,
  ...(topic.fillInTaskIds ?? []),
];
