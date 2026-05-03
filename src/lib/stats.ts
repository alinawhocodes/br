import { supabase } from './supabase';
import type { TaskStat } from '../types';

type TaskStatRow = Pick<TaskStat, 'id' | 'user_id' | 'task_id' | 'times_shown' | 'times_correct'>;

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

export const recordWriteInAttempt = async (params: {
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
