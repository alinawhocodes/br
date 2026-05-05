import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { isPracticeMode, usePracticeSession } from '../hooks/usePracticeSession';
import { recordTaskAttemptsBatch } from '../lib/stats';
import { isAnswerMatchAny } from '../lib/tolerance';
import type { SessionResult, SessionWrongAnswer } from '../types';

type PracticeViewProps = {
  userId: string;
};

type PendingAttempt = {
  taskId: string;
  correct: boolean;
};

export const PracticeView = ({ userId }: PracticeViewProps) => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const mode = isPracticeMode(modeParam) ? modeParam : null;
  const batch = searchParams.get('batch') ?? 'all';
  const retryParam = searchParams.get('retry');
  const retryTaskIds = useMemo(() => (retryParam ? retryParam.split(',').filter(Boolean) : []), [retryParam]);
  const backToModes = topicId ? `/topics/${topicId}/modes?batch=${batch}` : '/';
  const session = usePracticeSession({
    topicId,
    batchId: batch,
    mode,
    taskIdsOverride: retryTaskIds.length > 0 ? retryTaskIds : undefined,
  });
  const [revealed, setRevealed] = useState(false);
  const [answer, setAnswer] = useState('');
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [pendingAttempts, setPendingAttempts] = useState<PendingAttempt[]>([]);
  const [flashcardsSeen, setFlashcardsSeen] = useState(0);
  const [flashcardsCorrect, setFlashcardsCorrect] = useState(0);
  const [flashcardWrongAnswers, setFlashcardWrongAnswers] = useState<SessionWrongAnswer[]>([]);
  const [writeInAnswered, setWriteInAnswered] = useState(0);
  const [writeInCorrect, setWriteInCorrect] = useState(0);
  const [writeInWrongAnswers, setWriteInWrongAnswers] = useState<SessionWrongAnswer[]>([]);

  useLayoutEffect(() => {
    setRevealed(false);
  }, [session.currentTask?.id]);

  useEffect(() => {
    setAnswer('');
    setFeedbackState('idle');
    setSubmitting(false);
    setSubmissionError(null);
  }, [session.currentTask?.id]);

  useEffect(() => {
    setFlashcardsSeen(0);
    setFlashcardsCorrect(0);
    setFlashcardWrongAnswers([]);
    setWriteInAnswered(0);
    setWriteInCorrect(0);
    setWriteInWrongAnswers([]);
    setPendingAttempts([]);
  }, [mode, session.topic?.id, batch, retryParam]);

  const promptText =
    mode === 'flashcard-pt-en' ? session.currentTask?.back ?? '' : session.currentTask?.front ?? '';
  const answerOptions =
    mode === 'flashcard-pt-en'
      ? [session.currentTask?.front ?? '', ...(session.currentTask?.acceptedFronts ?? [])]
      : [session.currentTask?.back ?? '', ...(session.currentTask?.acceptedBacks ?? [])];
  const answerText = answerOptions.join(' / ');
  const writeInExpectedOptions = [session.currentTask?.back ?? '', ...(session.currentTask?.acceptedBacks ?? [])];

  if (session.loading) {
    return <div className="flex min-h-screen items-center justify-center bg-sand-50 px-6 text-center text-lg text-ink-900">Loading...</div>;
  }

  if (session.error) {
    return <div className="flex min-h-screen items-center justify-center bg-sand-50 px-6 text-center text-lg text-terracotta-600">{session.error}</div>;
  }

  if (!session.currentTask) {
    return <div className="flex min-h-screen items-center justify-center bg-sand-50 px-6 text-center text-lg text-ink-900">No tasks available.</div>;
  }

  const handlePracticeAreaClick = () => {
    if (!revealed) {
      setRevealed(true);
    }
  };

  const handleFlashcardGrade = async (correct: boolean) => {
    if (!session.currentTask || !topicId || !mode || submitting) {
      return;
    }

    const nextSeen = flashcardsSeen + 1;
    const nextCorrect = flashcardsCorrect + (correct ? 1 : 0);
    const nextPendingAttempts = [...pendingAttempts, { taskId: session.currentTask.id, correct }];
    const nextWrongAnswers = correct
      ? flashcardWrongAnswers
      : [
          ...flashcardWrongAnswers,
          {
            taskId: session.currentTask.id,
            prompt: promptText,
            userAnswer: 'I did not remember',
            correctAnswer: answerText,
          },
        ];

    setSubmissionError(null);

    if (nextSeen >= session.totalTasks) {
      setSubmitting(true);
      try {
        await recordTaskAttemptsBatch({
          userId,
          attempts: nextPendingAttempts,
        });
        const result: SessionResult = {
          mode,
          totalSeen: nextSeen,
          totalAnswered: nextSeen,
          correctCount: nextCorrect,
          wrongAnswers: nextWrongAnswers,
        };

        navigate('/results', {
          state: {
            result,
            topicId,
            batchId: batch,
          },
        });
        return;
      } catch (error) {
        setSubmissionError(error instanceof Error ? error.message : 'Unable to save this session.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setPendingAttempts(nextPendingAttempts);
    setFlashcardsSeen(nextSeen);
    setFlashcardsCorrect(nextCorrect);
    setFlashcardWrongAnswers(nextWrongAnswers);
    setRevealed(false);
    session.moveToNextTask();
  };

  const handleWriteInSubmit = () => {
    if (!session.currentTask || submitting) {
      return;
    }

    const correct = isAnswerMatchAny(answer, writeInExpectedOptions);
    setSubmissionError(null);

    setPendingAttempts((current) => [
      ...current,
      {
        taskId: session.currentTask.id,
        correct,
      },
    ]);
    setWriteInAnswered((current) => current + 1);
    if (correct) {
      setWriteInCorrect((current) => current + 1);
    } else {
      setWriteInWrongAnswers((current) => [
        ...current,
        {
          taskId: session.currentTask.id,
          prompt: session.currentTask.front,
          userAnswer: answer,
          correctAnswer: writeInExpectedOptions.join(' / '),
        },
      ]);
    }
    setFeedbackState(correct ? 'correct' : 'wrong');
  };

  const handleWriteInAdvance = async () => {
    if (!topicId || !mode) {
      return;
    }

    if (writeInAnswered >= session.totalTasks) {
      setSubmitting(true);
      setSubmissionError(null);
      try {
        await recordTaskAttemptsBatch({
          userId,
          attempts: pendingAttempts,
        });
        const result: SessionResult = {
          mode,
          totalSeen: writeInAnswered,
          totalAnswered: writeInAnswered,
          correctCount: writeInCorrect,
          wrongAnswers: writeInWrongAnswers,
        };

        navigate('/results', {
          state: {
            result,
            topicId,
            batchId: batch,
          },
        });
      } catch (error) {
        setSubmissionError(error instanceof Error ? error.message : 'Unable to save this session.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    session.moveToNextTask();
  };

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <div className="flex items-start justify-between px-6 pb-4 pt-6">
        <Link className="text-2xl font-semibold text-forest-700" to={backToModes}>
          Back
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-6">
        {mode === 'write-in' ? (
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col justify-center">
              <p className="w-full text-center text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">{session.currentTask.front}</p>

              <div className="mt-10">
                <label className="sr-only" htmlFor="write-in-answer">
                  Answer
                </label>
                <input
                  id="write-in-answer"
                  className="w-full rounded-[1.75rem] border border-ink-800/10 bg-white px-5 py-4 text-center text-2xl text-ink-900 outline-none transition focus:border-forest-700 focus:ring-2 focus:ring-forest-700/15"
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Type your answer"
                  value={answer}
                  disabled={feedbackState !== 'idle' || submitting}
                />
              </div>

              <div className="mt-8 flex min-h-36 items-center justify-center">
                {submissionError ? <p className="text-center text-lg text-terracotta-600">{submissionError}</p> : null}
                {!submissionError && feedbackState === 'correct' ? <p className="text-center text-3xl font-medium text-forest-700">Correct</p> : null}
                {!submissionError && feedbackState === 'wrong' ? (
                  <div className="text-center">
                    <p className="text-3xl font-medium text-terracotta-600">Incorrect</p>
                    <p className="mt-4 text-2xl font-medium text-forest-700">{writeInExpectedOptions.join(' / ')}</p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="pt-4">
              {feedbackState === 'idle' ? (
                <button
                  className="w-full rounded-full bg-ink-900 px-8 py-6 text-2xl font-semibold text-white disabled:opacity-60"
                  onClick={() => void handleWriteInSubmit()}
                  type="button"
                  disabled={answer.trim().length === 0 || submitting}
                >
                  {submitting ? 'Checking...' : 'Submit'}
                </button>
              ) : (
                <button
                  className="w-full rounded-full bg-ink-900 px-8 py-6 text-2xl font-semibold text-white"
                  onClick={() => void handleWriteInAdvance()}
                  type="button"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Continue'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <button
              className="flex flex-1 flex-col items-center justify-center border-0 bg-transparent p-0 text-inherit"
              onClick={handlePracticeAreaClick}
              type="button"
            >
              <span className="w-full text-center text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">{promptText}</span>
              <div className="mt-8 flex min-h-32 w-full items-center justify-center">
                <p
                  className={`text-center text-3xl font-medium text-forest-700 sm:text-4xl ${
                    revealed ? 'visible' : 'invisible'
                  }`}
                >
                  {answerText}
                </p>
              </div>
            </button>

            <div className="pt-4">
              {submissionError ? <p className="pb-3 text-center text-lg text-terracotta-600">{submissionError}</p> : null}
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="rounded-full border border-terracotta-600 px-6 py-4 text-3xl font-semibold text-terracotta-600 disabled:opacity-40"
                  onClick={() => void handleFlashcardGrade(false)}
                  type="button"
                  disabled={!revealed || submitting}
                >
                  ❌
                </button>
                <button
                  className="rounded-full border border-forest-700 px-6 py-4 text-3xl font-semibold text-forest-700 disabled:opacity-40"
                  onClick={() => void handleFlashcardGrade(true)}
                  type="button"
                  disabled={!revealed || submitting}
                >
                  ✅
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
