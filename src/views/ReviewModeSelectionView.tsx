import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { loadReviewModeCounts, REVIEW_SESSION_CARD_LIMIT } from '../lib/review';
import type { PracticeMode } from '../types';

type ReviewModeSelectionViewProps = {
  userId: string;
};

type ReviewModeOption = {
  id: PracticeMode;
  title: string;
  description: string;
  countKey: 'standard' | 'fillIn';
};

const reviewModeOptions: ReviewModeOption[] = [
  {
    id: 'flashcard-en-pt',
    title: 'Flashcards EN→PT',
    description: 'Review due vocabulary and phrases from English to Portuguese.',
    countKey: 'standard',
  },
  {
    id: 'flashcard-pt-en',
    title: 'Flashcards PT→EN',
    description: 'Review due vocabulary and phrases from Portuguese to English.',
    countKey: 'standard',
  },
  {
    id: 'write-in',
    title: 'Write-in',
    description: 'Type Portuguese answers for due regular cards.',
    countKey: 'standard',
  },
  {
    id: 'fill-in',
    title: 'Fill-in',
    description: 'Type the missing Portuguese word in due context cards.',
    countKey: 'fillIn',
  },
];

export const ReviewModeSelectionView = ({ userId }: ReviewModeSelectionViewProps) => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ standard: 0, fillIn: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    setLoading(true);
    setError(null);

    loadReviewModeCounts(userId)
      .then((nextCounts) => {
        if (!isActive) {
          return;
        }

        setCounts(nextCounts);
        setLoading(false);
      })
      .catch((caughtError: unknown) => {
        if (!isActive) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load review cards.');
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [userId]);

  return (
    <AppShell title="Review Today" subtitle="Practice cards that are due based on your previous answers.">
      <Link className="text-sm font-semibold text-forest-700" to="/">
        Back
      </Link>

      {loading ? <p className="mt-8 text-sm text-ink-800/70">Loading review counts...</p> : null}
      {error ? <p className="mt-8 rounded-2xl bg-terracotta-500/10 px-4 py-3 text-sm text-terracotta-600">{error}</p> : null}

      {!loading && !error ? (
        <div className="mt-8 grid gap-4">
          {reviewModeOptions.map((option) => {
            const count = counts[option.countKey];

            return (
              <button
                key={option.id}
                className="rounded-[1.5rem] border border-ink-800/10 bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                onClick={() => navigate(`/review/practice?mode=${option.id}`)}
                type="button"
                disabled={count === 0}
              >
                <span className="block text-lg font-semibold text-ink-900">{option.title}</span>
                <span className="mt-1 block text-sm text-ink-800/70">{option.description}</span>
                <span className="mt-4 inline-flex rounded-full bg-sand-50 px-3 py-1 text-sm font-semibold text-forest-700">
                  {count === 0
                    ? 'No cards due'
                    : `${Math.min(count, REVIEW_SESSION_CARD_LIMIT)}-card review${count > REVIEW_SESSION_CARD_LIMIT ? `, ${count} due total` : ''}`}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </AppShell>
  );
};
