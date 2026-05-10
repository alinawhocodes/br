import { supabase } from './supabase';
import type { TaskStat } from '../types';

type TaskStatRow = Pick<
  TaskStat,
  | 'id'
  | 'user_id'
  | 'task_id'
  | 'times_shown'
  | 'times_correct'
  | 'last_seen_at'
  | 'next_review_at'
  | 'streak_correct'
  | 'ease_level'
>;
type PendingAttempt = {
  taskId: string;
  correct: boolean;
};

const TASK_STAT_SELECT =
  'id, user_id, task_id, times_shown, times_correct, last_seen_at, next_review_at, streak_correct, ease_level';

const addDays = (date: Date, days: number): string => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString();
};

const getCorrectReviewDelayDays = (streakCorrect: number): number => {
  if (streakCorrect <= 1) {
    return 1;
  }

  if (streakCorrect === 2) {
    return 3;
  }

  if (streakCorrect === 3) {
    return 7;
  }

  if (streakCorrect === 4) {
    return 14;
  }

  return 30;
};

const getReviewSchedule = (params: {
  existing: TaskStatRow | undefined;
  shown: number;
  correct: number;
  practicedAt: Date;
}) => {
  const wasFullyCorrect = params.correct === params.shown;
  const previousStreak = params.existing?.streak_correct ?? 0;
  const previousEase = params.existing?.ease_level ?? 1;

  if (!wasFullyCorrect) {
    return {
      last_seen_at: params.practicedAt.toISOString(),
      next_review_at: params.practicedAt.toISOString(),
      streak_correct: 0,
      ease_level: Math.max(1, previousEase - 1),
    };
  }

  const streakCorrect = previousStreak + params.correct;
  const easeLevel = Math.min(5, previousEase + (streakCorrect >= 3 ? 1 : 0));

  return {
    last_seen_at: params.practicedAt.toISOString(),
    next_review_at: addDays(params.practicedAt, getCorrectReviewDelayDays(streakCorrect)),
    streak_correct: streakCorrect,
    ease_level: easeLevel,
  };
};

export const fetchTaskStats = async (userId: string, taskIds: string[]): Promise<TaskStat[]> => {
  if (taskIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('task_stats')
    .select(TASK_STAT_SELECT)
    .eq('user_id', userId)
    .in('task_id', taskIds);

  if (error) {
    throw error;
  }

  return (data satisfies TaskStatRow[]) as TaskStat[];
};

export const recordTaskAttempt = async (params: {
  userId: string;
  taskId: string;
  correct: boolean;
}): Promise<void> => {
  const { data: existing, error: fetchError } = await supabase
    .from('task_stats')
    .select(TASK_STAT_SELECT)
    .eq('user_id', params.userId)
    .eq('task_id', params.taskId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  const practicedAt = new Date();
  const payload = existing
    ? {
        id: existing.id,
        user_id: params.userId,
        task_id: params.taskId,
        times_shown: existing.times_shown + 1,
        times_correct: existing.times_correct + (params.correct ? 1 : 0),
        ...getReviewSchedule({
          existing: existing satisfies TaskStatRow,
          shown: 1,
          correct: params.correct ? 1 : 0,
          practicedAt,
        }),
      }
    : {
        user_id: params.userId,
        task_id: params.taskId,
        times_shown: 1,
        times_correct: params.correct ? 1 : 0,
        ...getReviewSchedule({
          existing: undefined,
          shown: 1,
          correct: params.correct ? 1 : 0,
          practicedAt,
        }),
      };

  const { error: upsertError } = await supabase.from('task_stats').upsert(payload, {
    onConflict: 'user_id,task_id',
  });

  if (upsertError) {
    throw upsertError;
  }
};

export const recordWriteInAttempt = recordTaskAttempt;

export const recordTaskAttemptsBatch = async (params: {
  userId: string;
  attempts: PendingAttempt[];
}): Promise<void> => {
  if (params.attempts.length === 0) {
    return;
  }

  const increments = params.attempts.reduce<Record<string, { shown: number; correct: number }>>((accumulator, attempt) => {
    const current = accumulator[attempt.taskId] ?? { shown: 0, correct: 0 };
    accumulator[attempt.taskId] = {
      shown: current.shown + 1,
      correct: current.correct + (attempt.correct ? 1 : 0),
    };
    return accumulator;
  }, {});

  const taskIds = Object.keys(increments);

  const { data: existingRows, error: fetchError } = await supabase
    .from('task_stats')
    .select(TASK_STAT_SELECT)
    .eq('user_id', params.userId)
    .in('task_id', taskIds);

  if (fetchError) {
    throw fetchError;
  }

  const existingByTaskId = new Map((existingRows satisfies TaskStatRow[]).map((row) => [row.task_id, row]));
  const practicedAt = new Date();

  const payload = taskIds.map((taskId) => {
    const existing = existingByTaskId.get(taskId);
    const increment = increments[taskId];
    const reviewSchedule = getReviewSchedule({
      existing,
      shown: increment.shown,
      correct: increment.correct,
      practicedAt,
    });

    if (existing) {
      return {
        id: existing.id,
        user_id: params.userId,
        task_id: taskId,
        times_shown: existing.times_shown + increment.shown,
        times_correct: existing.times_correct + increment.correct,
        ...reviewSchedule,
      };
    }

    return {
      user_id: params.userId,
      task_id: taskId,
      times_shown: increment.shown,
      times_correct: increment.correct,
      ...reviewSchedule,
    };
  });

  const { error: upsertError } = await supabase.from('task_stats').upsert(payload, {
    onConflict: 'user_id,task_id',
  });

  if (upsertError) {
    throw upsertError;
  }
};
