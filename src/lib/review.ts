import { getTopicSummaries, getTopicById } from '../data/topics-manifest';
import { fetchTaskStats } from './stats';
import { getFillInTasks } from './practiceTasks';
import type { PracticeMode, PracticeTask, TaskStat } from '../types';

export const REVIEW_SESSION_CARD_LIMIT = 5;

export type ReviewModeCounts = {
  standard: number;
  fillIn: number;
};

export type ReviewTask = PracticeTask & {
  topicId: string;
  topicName: string;
};

const isDueForReview = (stat: TaskStat | undefined, now: Date): boolean => {
  if (!stat?.next_review_at) {
    return true;
  }

  return new Date(stat.next_review_at).getTime() <= now.getTime();
};

const sortReviewTasks = (left: { task: ReviewTask; stat?: TaskStat }, right: { task: ReviewTask; stat?: TaskStat }) => {
  if (!left.stat && right.stat) {
    return 1;
  }

  if (left.stat && !right.stat) {
    return -1;
  }

  const leftReviewTime = left.stat?.next_review_at ? new Date(left.stat.next_review_at).getTime() : Number.POSITIVE_INFINITY;
  const rightReviewTime = right.stat?.next_review_at ? new Date(right.stat.next_review_at).getTime() : Number.POSITIVE_INFINITY;

  if (leftReviewTime !== rightReviewTime) {
    return leftReviewTime - rightReviewTime;
  }

  const leftAccuracy = left.stat && left.stat.times_shown > 0 ? left.stat.times_correct / left.stat.times_shown : 0;
  const rightAccuracy = right.stat && right.stat.times_shown > 0 ? right.stat.times_correct / right.stat.times_shown : 0;

  return leftAccuracy - rightAccuracy;
};

const getCandidateStatIds = async (mode: PracticeMode): Promise<string[]> => {
  const summaries = await getTopicSummaries();

  if (mode === 'fill-in') {
    return summaries.flatMap((topic) => topic.fillInTaskIds ?? []);
  }

  return summaries.flatMap((topic) => topic.taskIds);
};

export const getReviewDueCount = (taskIds: string[], stats: TaskStat[], now = new Date()): number => {
  const statsByTaskId = new Map(stats.map((stat) => [stat.task_id, stat]));

  return taskIds.filter((taskId) => isDueForReview(statsByTaskId.get(taskId), now)).length;
};

export const loadReviewModeCounts = async (userId: string): Promise<ReviewModeCounts> => {
  const summaries = await getTopicSummaries();
  const standardTaskIds = summaries.flatMap((topic) => topic.taskIds);
  const fillInTaskIds = summaries.flatMap((topic) => topic.fillInTaskIds ?? []);
  const allTaskIds = [...standardTaskIds, ...fillInTaskIds];
  const stats = await fetchTaskStats(userId, allTaskIds);

  return {
    standard: getReviewDueCount(standardTaskIds, stats),
    fillIn: getReviewDueCount(fillInTaskIds, stats),
  };
};

export const loadReviewQueue = async (params: {
  userId: string;
  mode: PracticeMode;
  taskIdsOverride?: string[];
}): Promise<ReviewTask[]> => {
  const candidateStatIds = await getCandidateStatIds(params.mode);
  const stats = await fetchTaskStats(params.userId, candidateStatIds);
  const statsByTaskId = new Map(stats.map((stat) => [stat.task_id, stat]));
  const summaries = await getTopicSummaries();
  const topics = await Promise.all(summaries.map((summary) => getTopicById(summary.id)));
  const now = new Date();
  const overrideIds = params.taskIdsOverride && params.taskIdsOverride.length > 0 ? new Set(params.taskIdsOverride) : null;

  const candidates = topics.flatMap((topic): Array<{ task: ReviewTask; stat?: TaskStat }> => {
    if (!topic) {
      return [];
    }

    const tasks = params.mode === 'fill-in' ? getFillInTasks(topic.tasks) : topic.tasks;

    return tasks.map((task) => ({
      task: {
        ...task,
        topicId: topic.id,
        topicName: topic.name,
      },
      stat: statsByTaskId.get(task.id),
    }));
  });

  const reviewTasks = candidates
    .filter(({ task, stat }) => (overrideIds ? overrideIds.has(task.id) : isDueForReview(stat, now)))
    .sort(sortReviewTasks)
    .slice(0, overrideIds ? undefined : REVIEW_SESSION_CARD_LIMIT)
    .map(({ task }) => task);

  return reviewTasks;
};
