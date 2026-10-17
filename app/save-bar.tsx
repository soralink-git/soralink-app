'use client';
import { Save } from 'lucide-react';
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
  return (
    <div className="workspace-save-action">
      <button
        type="button"
        className="primary"
        disabled={disabled || state.status === 'saving'}
        onClick={() => void (state.status === 'conflict' && reload ? reload() : save())}
      >
        <Save size={17} />
        {ar ? 'سجّل التغييرات' : 'Enregistrer les modifications'}
      </button>
    </div>
  );
}
