import type { SaveState } from './save-queue';

export function saveFeedback(state: SaveState, ar: boolean) {
  const messages = {
    ready: ['Les modifications sont enregistrées automatiquement.', 'التغييرات كتتسجّل تلقائياً.'],
    pending: ['Modifications en attente d’enregistrement.', 'تغييرات كتسنى التسجيل.'],
    saving: ['Enregistrement en cours…', 'التسجيل خدام…'],
    saved: ['Toutes les modifications sont enregistrées.', 'تسجلو جميع التغييرات.'],
    offline: [
      'Hors ligne : vos modifications ne sont pas enregistrées.',
      'بلا اتصال: التغييرات ما تسجلاتش.',
    ],
    invalid: ['Vérifiez les informations avant d’enregistrer.', 'راجع المعلومات قبل التسجيل.'],
    error: [
      'Enregistrement impossible. Vos modifications restent dans cette page.',
      'ما قدرناش نسجّلو. التغييرات باقية فهاد الصفحة.',
    ],
    conflict: [
      'Une autre version a été enregistrée. Rechargez pour continuer.',
      'تسجلات نسخة أخرى. عاود حمّل باش تكمل.',
    ],
  };
  const labels =
    state.status === 'conflict'
      ? ['Recharger la version enregistrée', 'عاود حمّل النسخة المسجّلة']
      : state.status === 'saving'
        ? ['Enregistrement…', 'كيتسجّل…']
        : ['offline', 'error', 'invalid'].includes(state.status)
          ? ['Réessayer l’enregistrement', 'عاود جرّب التسجيل']
          : ['Enregistrer les modifications', 'سجّل التغييرات'];
  return { message: state.error || messages[state.status][ar ? 1 : 0], label: labels[ar ? 1 : 0] };
}
