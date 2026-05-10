export type PracticeTask = {
  id: string;
  front: string;
  back: string;
  acceptedFronts?: string[];
  acceptedBacks?: string[];
};

export type FillInTask = PracticeTask;

export type Task = PracticeTask & {
  fillIns?: FillInTask[];
};

export type Topic = {
  id: string;
  name: string;
  imageUrl: string;
  tasks: Task[];
};

export type TopicSummary = {
  id: string;
  name: string;
  imageUrl: string;
  taskCount: number;
  taskIds: string[];
  fillInTaskIds?: string[];
};

export type PracticeMode = 'flashcard-en-pt' | 'flashcard-pt-en' | 'write-in' | 'fill-in';

export type BatchOption = {
  id: string;
  label: string;
  start: number;
  end: number;
  taskCount: number;
  isAll?: boolean;
};

export type TaskStat = {
  id: string;
  user_id: string;
  task_id: string;
  times_shown: number;
  times_correct: number;
  last_seen_at: string | null;
  next_review_at: string | null;
  streak_correct: number;
  ease_level: number;
};

export type SessionWrongAnswer = {
  taskId: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
};

export type SessionResult = {
  mode: PracticeMode;
  totalSeen: number;
  totalAnswered?: number;
  correctCount?: number;
  wrongAnswers: SessionWrongAnswer[];
};

export type Profile = {
  user_id: string;
  confirmed: boolean;
};
