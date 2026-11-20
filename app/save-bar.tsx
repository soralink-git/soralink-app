'use client';
import { RefreshCw } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { saveFeedback } from './lib/save-feedback';
import type { SaveState } from './lib/save-queue';
export default function SaveBar({
  state = { status: 'ready', dirty: false },
  ar,
  disabled,
  save,
  reload,
}: {
  state?: SaveState;
  ar: boolean;
  disabled: boolean;
  save: () => Promise<void>;
  reload?: () => Promise<void>;
}) {
  const feedback = saveFeedback(state, ar);
  const statusId = useId();
  const [dismissedSuccess, setDismissedSuccess] = useState<number | null>(null);
  useEffect(() => {
    if (state.status !== 'saved' || state.savedAt === undefined) return;
    const savedAt = state.savedAt;
    const timer = setTimeout(() => setDismissedSuccess(savedAt), 2000);
    return () => clearTimeout(timer);
  }, [state.status, state.savedAt]);
  const failed = ['offline', 'invalid', 'error', 'conflict'].includes(state.status);
  if (
    state.status === 'ready' ||
    (state.status === 'saved' &&
      (state.savedAt === undefined || dismissedSuccess === state.savedAt))
  )
    return null;
  return (
    <div className="workspace-save-action" data-save-status={state.status}>
      <p
        id={statusId}
        className="save-feedback"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {feedback.message}
      </p>
      {failed && (
        <button
          type="button"
          className="primary"
          aria-describedby={statusId}
          disabled={
            disabled || state.status === 'saving' || (state.status === 'conflict' && !reload)
          }
          onClick={() => void (state.status === 'conflict' && reload ? reload() : save())}
        >
          <RefreshCw size={17} />
          {feedback.label}
        </button>
      )}
    </div>
  );
}
