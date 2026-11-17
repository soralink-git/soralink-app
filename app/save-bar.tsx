'use client';
import { Save } from 'lucide-react';
import { useId } from 'react';
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
      <button
        type="button"
        className="primary"
        aria-describedby={statusId}
        disabled={disabled || state.status === 'saving' || (state.status === 'conflict' && !reload)}
        onClick={() => void (state.status === 'conflict' && reload ? reload() : save())}
      >
        <Save size={17} />
        {feedback.label}
      </button>
    </div>
  );
}
