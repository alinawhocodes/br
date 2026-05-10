import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { loadTopic } from '../hooks/useTopics';
import { getTasksForBatch } from '../lib/batch';
import { hasFillInTasks } from '../lib/practiceTasks';
import type { PracticeMode } from '../types';

const modes = [
  { id: 'flashcard-en-pt', title: 'Flashcards EN → PT', description: 'Think first, flip, then self-rate.' },
  { id: 'flashcard-pt-en', title: 'Flashcards PT → EN', description: 'Reverse the direction for recognition practice.' },
  { id: 'write-in', title: 'Write-in', description: 'Type your answer and record accuracy to Supabase.' },
] satisfies Array<{ id: PracticeMode; title: string; description: string }>;

const fillInMode = {
  id: 'fill-in',
  title: 'Fill-in',
  description: 'Type the missing word in a short context sentence.',
} satisfies { id: PracticeMode; title: string; description: string };

export const ModeSelectionView = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get('batch') ?? 'all';
  const origin = searchParams.get('origin');
  const backUrl = topicId ? (origin === 'auto-skip' ? '/' : `/topics/${topicId}/batches`) : '/';
  const [hasFillInMode, setHasFillInMode] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (!topicId) {
      setHasFillInMode(false);
      return () => {
        isActive = false;
      };
    }

    loadTopic(topicId)
      .then((topic) => {
        if (!isActive || !topic) {
          return;
        }

        setHasFillInMode(hasFillInTasks(getTasksForBatch(topic.tasks, batchId)));
      })
      .catch(() => {
        if (isActive) {
          setHasFillInMode(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [batchId, topicId]);

  const availableModes = useMemo(() => (hasFillInMode ? [...modes, fillInMode] : modes), [hasFillInMode]);

  return (
    <AppShell title="Choose a mode" subtitle="Flashcards, write-in, and fill-in sessions share the same topic material.">
      <div className="mb-6">
        <Link className="text-sm font-semibold text-forest-700" to={backUrl}>
          Back
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {availableModes.map((mode) => (
          <button
            key={mode.id}
            className="rounded-[1.5rem] border border-ink-800/10 bg-white px-5 py-5 text-left shadow-card"
            onClick={() => {
              const params = new URLSearchParams({ batch: batchId, mode: mode.id });
              if (origin) {
                params.set('origin', origin);
              }
              navigate(`/topics/${topicId}/practice?${params.toString()}`);
            }}
            type="button"
          >
            <h2 className="text-lg font-semibold text-ink-900">{mode.title}</h2>
            <p className="mt-2 text-sm text-ink-800/70">{mode.description}</p>
          </button>
        ))}
      </div>
    </AppShell>
  );
};
