import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { isPracticeMode, usePracticeSession } from '../hooks/usePracticeSession';
import { recordWriteInAttempt } from '../lib/stats';
import { isAnswerMatch } from '../lib/tolerance';

type PracticeViewProps = {
  userId: string;
};

export const PracticeView = ({ userId }: PracticeViewProps) => {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const mode = isPracticeMode(modeParam) ? modeParam : null;
  const batch = searchParams.get('batch') ?? 'all';
  const backToModes = topicId ? `/topics/${topicId}/modes?batch=${batch}` : '/';
  const session = usePracticeSession({
    topicId,
    batchId: batch,
    mode,
  });
  const [revealed, setRevealed] = useState(false);
  const [answer, setAnswer] = useState('');
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    setRevealed(false);
    setAnswer('');
    setFeedbackState('idle');
    setSubmitting(false);
    setSubmissionError(null);
  }, [session.currentTask?.id]);

  const promptText =
    mode === 'flashcard-pt-en' ? session.currentTask?.back ?? '' : session.currentTask?.front ?? '';
  const answerText =
    mode === 'flashcard-pt-en' ? session.currentTask?.front ?? '' : session.currentTask?.back ?? '';

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
    if (revealed) {
      session.moveToNextTask();
      return;
    }

    setRevealed(true);
  };

  const handleWriteInSubmit = async () => {
    if (!session.currentTask || submitting) {
      return;
    }

    const correct = isAnswerMatch(answer, session.currentTask.back);
    setSubmitting(true);
    setSubmissionError(null);

    try {
      await recordWriteInAttempt({
        userId,
        taskId: session.currentTask.id,
        correct,
      });
      setFeedbackState(correct ? 'correct' : 'wrong');
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Unable to save this attempt.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWriteInAdvance = () => {
    session.moveToNextTask();
  };

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <div className="flex items-start px-6 pb-4 pt-6">
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
                    <p className="mt-4 text-2xl font-medium text-forest-700">{session.currentTask.back}</p>
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
                  onClick={handleWriteInAdvance}
                  type="button"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            className="flex flex-1 flex-col items-center justify-center border-0 bg-transparent p-0 text-inherit"
            onClick={handlePracticeAreaClick}
            type="button"
          >
            <span className="w-full text-center text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">{promptText}</span>
            <div className="mt-8 flex min-h-32 w-full items-center justify-center">
              <p
                className={`text-center text-3xl font-medium text-forest-700 transition-opacity sm:text-4xl ${
                  revealed ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {answerText}
              </p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
