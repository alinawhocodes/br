import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { isPracticeMode, usePracticeSession } from '../hooks/usePracticeSession';

export const PracticeView = () => {
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

  useEffect(() => {
    setRevealed(false);
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

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <div className="flex items-start px-6 pb-4 pt-6">
        <Link className="text-2xl font-semibold text-forest-700" to={backToModes}>
          Back
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-6">
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
      </div>
    </div>
  );
};
