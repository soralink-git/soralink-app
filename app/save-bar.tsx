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
  const t = (fr: string, a: string) => (ar ? a : fr);
  const labels = {
    ready: t('Enregistrement automatique activé', 'التسجيل التلقائي مفعّل'),
    pending: t('Modifications en attente…', 'التغييرات فانتظار التسجيل…'),
    saving: t('Enregistrement…', 'كنسجّلو…'),
    saved: t('Modifications enregistrées', 'تسجلات التغييرات'),
    invalid: t('Complétez les champs pour enregistrer.', 'كمّل المعلومات باش يتسجلو التغييرات.'),
    offline: t(
      'Hors ligne. Modifications non enregistrées.',
      'ما كاينش الاتصال. التغييرات ما تسجلاتش.',
    ),
    error: t('Enregistrement impossible. Réessayez.', 'ما قدرناش نسجّلو. عاود جرّب.'),
    conflict: t(
      'Cette carte a été modifiée ailleurs. Rechargez pour continuer.',
      'الكارط تبدلات من بلاصة أخرى. عاود حمّل النسخة المسجّلة باش تكمّل.',
    ),
  };
  return (
    <div className={'workspace-savebar save-status-' + state.status}>
      <div role="status" aria-live="polite">
        <strong>{labels[state.status]}</strong>
        {state.error && <small>{state.error}</small>}
      </div>
      <div className="row">
        <button
          type="button"
          className="primary"
          disabled={disabled || state.status === 'saving' || state.status === 'conflict'}
          onClick={() => void save()}
        >
          <Save size={17} />
          {t('Enregistrer les modifications', 'سجّل التغييرات')}
        </button>
        {state.status === 'conflict' && reload && (
          <button
            type="button"
            className="secondary"
            disabled={disabled}
            onClick={() => void reload()}
          >
            {t('Recharger la version enregistrée', 'عاود حمّل النسخة المسجّلة')}
          </button>
        )}
      </div>
    </div>
  );
}
