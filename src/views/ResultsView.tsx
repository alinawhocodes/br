import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { loadTopic } from '../hooks/useTopics';
import { shouldSkipBatchSelection } from '../lib/batch';
import type { SessionResult } from '../types';

type ResultsLocationState = {
  result: SessionResult;
  topicId?: string;
  batchId?: string;
  origin?: string;
  review?: boolean;
};

export const ResultsView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultsLocationState | null;
  const [nextSelectionUrl, setNextSelectionUrl] = useState('/');
  const [nextSelectionLabel, setNextSelectionLabel] = useState('Back to Home');

  if (!state?.result || (!state.review && !state.topicId)) {
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

  const { result } = state;
  const topicId = state.topicId ?? '';
  const batchId = state.batchId ?? 'all';
  const originQuery = state.origin ? `&origin=${encodeURIComponent(state.origin)}` : '';
  const retryIds = result.wrongAnswers.map((item) => item.taskId).join(',');
  const retryUrl = state.review
    ? `/review/practice?mode=${result.mode}&retry=${retryIds}`
    : `/topics/${topicId}/practice?mode=${result.mode}&batch=${batchId}&retry=${retryIds}${originQuery}`;
  const restartUrl = state.review
    ? `/review/practice?mode=${result.mode}`
    : `/topics/${topicId}/practice?mode=${result.mode}&batch=${batchId}${originQuery}`;
  const score = result.correctCount !== undefined && result.totalAnswered ? `${result.correctCount}/${result.totalAnswered}` : null;

  useEffect(() => {
    if (state.review) {
      setNextSelectionUrl('/review/modes');
      setNextSelectionLabel('Review Modes');
      return;
    }

    let isActive = true;

    loadTopic(topicId)
      .then((topic) => {
        if (!isActive || !topic) {
          return;
        }

        if (shouldSkipBatchSelection(topic.tasks.length)) {
          setNextSelectionUrl(`/topics/${topic.id}/modes?batch=all&origin=auto-skip`);
          setNextSelectionLabel('Mode Selection');
          return;
        }

        setNextSelectionUrl(`/topics/${topic.id}/batches`);
        setNextSelectionLabel('Batch Selection');
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setNextSelectionUrl('/');
        setNextSelectionLabel('Back to Home');
      });

    return () => {
      isActive = false;
    };
  }, [state.review, topicId]);

  return (
    <AppShell title="Results" subtitle="Session summary and quick actions for what to practice next.">
      <div className="rounded-[1.75rem] bg-sand-50 p-6">
        {result.mode === 'write-in' || result.mode === 'fill-in' ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-800/50">
              {result.mode === 'fill-in' ? 'Fill-in score' : 'Write-in score'}
            </p>
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
              {result.mode === 'write-in' || result.mode === 'fill-in' ? (
                <p className="mt-2 text-sm text-terracotta-600">Your answer: {wrong.userAnswer}</p>
              ) : null}
              <p className="mt-1 text-sm text-forest-700">Correct: {wrong.correctAnswer}</p>
            </article>
          ))}
        </div>
      ) : null}

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
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
        <Link className="rounded-full border border-ink-800/15 px-5 py-3 text-center text-sm font-semibold text-ink-900" to={nextSelectionUrl}>
          {nextSelectionLabel}
        </Link>
        <Link className="rounded-full bg-ink-900 px-5 py-3 text-center text-sm font-semibold text-white" to="/">
          Back to Home
        </Link>
      </div>
    </AppShell>
  );
};
