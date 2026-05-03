import { useState } from 'react';
import type { PracticeMode } from '../types';

export type SessionSelection = {
  topicId: string;
  batchId: string;
  mode: PracticeMode;
};

export const useSession = () => {
  const [selection, setSelection] = useState<SessionSelection | null>(null);

  return {
    selection,
    startSession: (nextSelection: SessionSelection) => setSelection(nextSelection),
    clearSession: () => setSelection(null),
  };
};
