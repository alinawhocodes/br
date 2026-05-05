import { supabase } from './supabase';
import type { TaskStat } from '../types';

type TaskStatRow = Pick<TaskStat, 'id' | 'user_id' | 'task_id' | 'times_shown' | 'times_correct'>;
type PendingAttempt = {
  taskId: string;
  correct: boolean;
};

export const fetchTaskStats = async (userId: string, taskIds: string[]): Promise<TaskStat[]> => {
  if (taskIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('task_stats')
    .select('id, user_id, task_id, times_shown, times_correct')
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
    .select('id, times_shown, times_correct')
    .eq('user_id', params.userId)
    .eq('task_id', params.taskId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  const payload = existing
    ? {
        id: existing.id,
        user_id: params.userId,
        task_id: params.taskId,
        times_shown: existing.times_shown + 1,
        times_correct: existing.times_correct + (params.correct ? 1 : 0),
      }
    : {
        user_id: params.userId,
        task_id: params.taskId,
        times_shown: 1,
        times_correct: params.correct ? 1 : 0,
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
    .select('id, user_id, task_id, times_shown, times_correct')
    .eq('user_id', params.userId)
    .in('task_id', taskIds);

  if (fetchError) {
    throw fetchError;
  }

  const existingByTaskId = new Map((existingRows satisfies TaskStatRow[]).map((row) => [row.task_id, row]));

  const payload = taskIds.map((taskId) => {
    const existing = existingByTaskId.get(taskId);
    const increment = increments[taskId];

    if (existing) {
      return {
        id: existing.id,
        user_id: params.userId,
        task_id: taskId,
        times_shown: existing.times_shown + increment.shown,
        times_correct: existing.times_correct + increment.correct,
      };
    }

    return {
      user_id: params.userId,
      task_id: taskId,
      times_shown: increment.shown,
      times_correct: increment.correct,
    };
  });

  const { error: upsertError } = await supabase.from('task_stats').upsert(payload, {
    onConflict: 'user_id,task_id',
  });

  if (upsertError) {
    throw upsertError;
  }
};
