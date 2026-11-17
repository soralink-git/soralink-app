'use client';
import { useState, useRef, useEffect } from 'react';
import ModalDialog from './modal-dialog';
import { X } from 'lucide-react';
import { profileName } from './lib/profile-identity';
import { defaults, moroccoNow } from './lib/schedule';

export default function ManualAppointmentModal({
  data,
  ar,
  busy,
  serviceIndex,
  setServiceIndex,
  onClose,
  onSubmit,
}: {
  data: any;
  ar: boolean;
  busy: boolean;
  serviceIndex: number;
  setServiceIndex: (index: number) => void;
  onClose: () => void;
  onSubmit: (form: FormData) => Promise<void>;
}) {
  const t = (fr: string, da: string) => (ar ? da : fr);
  const [error, setError] = useState('');
  const errorSummary = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) errorSummary.current?.focus();
  }, [error]);
  return (
    <ModalDialog
      label={t('Ajouter un rendez-vous confirmé', 'زيد موعد مؤكد')}
      ar={ar}
      busy={busy}
      onClose={onClose}
    >
      <button
        type="button"
        disabled={busy}
        className="close"
        aria-label={t('Fermer', 'سدّ')}
        onClick={onClose}
      >
        <X />
      </button>
      <span className="eyebrow">{profileName(data)}</span>
      <h2>{t('Ajouter un rendez-vous confirmé', 'زيد موعد مؤكد')}</h2>
      <form
        aria-busy={busy}
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          const form = new FormData(event.currentTarget);
          setError('');
          try {
            await onSubmit(form);
          } catch (failure: any) {
            setError(
              failure.message || t('Envoi impossible. Réessayez.', 'تعذّر الإرسال. عاود جرّب.'),
            );
          }
        }}
      >
        <label className="field">
          {t('Nom *', 'الاسم *')}
          <input disabled={busy} name="name" autoComplete="name" required maxLength={120} />
        </label>
        <label className="field">
          {t('Téléphone *', 'التلفون *')}
          <input
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            dir="ltr"
            disabled={busy}
            required
            type="tel"
            maxLength={40}
          />
        </label>
        <label className="field">
          {t('E-mail facultatif', 'الإيميل اختياري')}
          <input
            disabled={busy}
            dir="ltr"
            name="email"
            autoComplete="email"
            type="email"
            maxLength={254}
          />
        </label>
        <label className="field">
          {t('Prestation', 'الخدمة')}
          <select
            disabled={busy}
            value={serviceIndex}
            onChange={(event) => setServiceIndex(Number(event.target.value))}
          >
            {(data.appointmentServices || defaults.appointmentServices).map(
              (service: any, index: number) => (
                <option key={index} value={index}>
                  {service.name} · {service.duration} min
                </option>
              ),
            )}
          </select>
        </label>
        <label className="field">
          {t('Date et heure · Maroc', 'النهار والوقت · المغرب')}
          <input
            disabled={busy}
            name="slot"
            type="datetime-local"
            step="900"
            min={moroccoNow()}
            required
          />
        </label>
        <label className="field">
          {t('Message facultatif', 'رسالة اختيارية')}
          <textarea disabled={busy} name="message" maxLength={2000} />
        </label>
        {error && (
          <p ref={errorSummary} tabIndex={-1} role="alert" className="crop-error">
            {error}
          </p>
        )}
        <button className="primary full" disabled={busy}>
          {busy ? t('Envoi…', 'كيتسيفط…') : t('Envoyer la demande', 'سيفط الطلب')}
        </button>
      </form>
    </ModalDialog>
  );
}
