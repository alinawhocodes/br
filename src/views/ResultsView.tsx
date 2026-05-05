import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import type { SessionResult } from '../types';

type ResultsLocationState = {
  result: SessionResult;
  topicId: string;
  batchId: string;
};

export const ResultsView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultsLocationState | null;

  if (!state?.result || !state.topicId) {
    return (
      <AppShell title="Results" subtitle="No completed session was found for this view.">
        <div className="rounded-[1.5rem] bg-sand-50 p-6">
          <p className="text-sm text-ink-800/70">Start a practice session first, then end it to see results.</p>
          <Link className="mt-4 inline-block text-sm font-semibold text-forest-700" to="/">
            Back to Home
          </Link>
        </div>
      </AppShell>
    );
  }

  const { result, topicId, batchId } = state;
  const retryIds = result.wrongAnswers.map((item) => item.taskId).join(',');
  const retryUrl = `/topics/${topicId}/practice?mode=${result.mode}&batch=${batchId}&retry=${retryIds}`;
  const restartUrl = `/topics/${topicId}/practice?mode=${result.mode}&batch=${batchId}`;
  const score = result.correctCount !== undefined && result.totalAnswered ? `${result.correctCount}/${result.totalAnswered}` : null;

  return (
    <AppShell title="Results" subtitle="Session summary and quick actions for what to practice next.">
      <div className="rounded-[1.75rem] bg-sand-50 p-6">
        {result.mode === 'write-in' ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-800/50">Write-in score</p>
            <p className="mt-2 text-4xl font-semibold text-ink-900">{score ?? '0/0'}</p>
            <p className="mt-2 text-sm text-ink-800/70">{result.wrongAnswers.length} wrong answers</p>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-800/50">Flashcard score</p>
            <p className="mt-2 text-4xl font-semibold text-ink-900">{score ?? '0/0'}</p>
            <p className="mt-2 text-sm text-ink-800/70">{result.wrongAnswers.length} cards marked not remembered</p>
          </>
        )}
      </div>

      {result.wrongAnswers.length > 0 ? (
        <div className="mt-6 space-y-3">
          {result.wrongAnswers.map((wrong) => (
            <article key={`${wrong.taskId}-${wrong.userAnswer}`} className="rounded-[1.25rem] border border-ink-800/10 bg-white p-4">
              <p className="text-sm font-semibold text-ink-900">{wrong.prompt}</p>
              {result.mode === 'write-in' ? <p className="mt-2 text-sm text-terracotta-600">Your answer: {wrong.userAnswer}</p> : null}
              <p className="mt-1 text-sm text-forest-700">Correct: {wrong.correctAnswer}</p>
            </article>
          ))}
        </div>
      ) : null}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <button
          className="rounded-full border border-ink-800/15 px-5 py-3 text-sm font-semibold text-ink-900 disabled:opacity-50"
          type="button"
          onClick={() => navigate(retryUrl)}
          disabled={result.wrongAnswers.length === 0}
        >
          Retry wrong
        </button>
        <button className="rounded-full border border-ink-800/15 px-5 py-3 text-sm font-semibold text-ink-900" type="button" onClick={() => navigate(restartUrl)}>
          Restart
        </button>
        <Link className="rounded-full bg-ink-900 px-5 py-3 text-center text-sm font-semibold text-white" to="/">
          Back to Home
        </Link>
      </div>
    </AppShell>
  );
};
