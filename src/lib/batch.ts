import type { BatchOption, Task } from '../types';

const MIN_BATCH_SIZE = 8;
const MAX_BATCH_SIZE = 15;

export const shouldSkipBatchSelection = (taskCount: number): boolean => taskCount <= 15;

export const buildBatchOptions = (tasks: Task[]): BatchOption[] => {
  if (shouldSkipBatchSelection(tasks.length)) {
    return [
      {
        id: 'all',
        label: 'All',
        start: 0,
        end: tasks.length,
        taskCount: tasks.length,
        isAll: true,
      },
    ];
  }

  const batchCount = Math.ceil(tasks.length / MAX_BATCH_SIZE);
  const baseSize = Math.floor(tasks.length / batchCount);
  const remainder = tasks.length % batchCount;
  const sizes = Array.from({ length: batchCount }, (_, index) => baseSize + (index < remainder ? 1 : 0));

  if (sizes.some((size) => size < MIN_BATCH_SIZE || size > MAX_BATCH_SIZE)) {
    throw new Error('Unable to split tasks into valid batches.');
  }

  let cursor = 0;
  const batches = sizes.map((size, index) => {
    const batch: BatchOption = {
      id: `batch-${index + 1}`,
      label: `Batch ${index + 1}`,
      start: cursor,
      end: cursor + size,
      taskCount: size,
    };
    cursor += size;
    return batch;
  });

  return [
    ...batches,
    {
      id: 'all',
      label: 'All',
      start: 0,
      end: tasks.length,
      taskCount: tasks.length,
      isAll: true,
    },
  ];
};

export const getBatchOptionById = (tasks: Task[], batchId: string): BatchOption | null => {
  const batches = buildBatchOptions(tasks);
  return batches.find((batch) => batch.id === batchId) ?? null;
};

export const getTasksForBatch = (tasks: Task[], batchId: string): Task[] => {
  const batch = getBatchOptionById(tasks, batchId);

  if (!batch) {
    return tasks;
  }

  return tasks.slice(batch.start, batch.end);
};
