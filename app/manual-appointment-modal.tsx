'use client';
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
  return (
    <div className="modal-backdrop">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('Ajouter un rendez-vous confirmé', 'زيد موعد مؤكد')}
      >
        <button className="close" aria-label={t('Fermer', 'سدّ')} onClick={onClose}>
          <X />
        </button>
        <span className="eyebrow">{profileName(data)}</span>
        <h2>{t('Ajouter un rendez-vous confirmé', 'زيد موعد مؤكد')}</h2>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            await onSubmit(new FormData(event.currentTarget));
          }}
        >
          <label className="field">
            {t('Nom *', 'الاسم *')}
            <input name="name" autoComplete="name" required maxLength={120} />
          </label>
          <label className="field">
            {t('Téléphone *', 'التلفون *')}
            <input name="phone" autoComplete="tel" required type="tel" maxLength={40} />
          </label>
          <label className="field">
            {t('E-mail facultatif', 'الإيميل اختياري')}
            <input name="email" autoComplete="email" type="email" maxLength={254} />
          </label>
          <label className="field">
            {t('Prestation', 'الخدمة')}
            <select
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
            <input name="slot" type="datetime-local" step="900" min={moroccoNow()} required />
          </label>
          <label className="field">
            {t('Message facultatif', 'رسالة اختيارية')}
            <textarea name="message" maxLength={2000} />
          </label>
          <button className="primary full" disabled={busy}>
            {busy ? t('Envoi…', 'كيتسيفط…') : t('Envoyer la demande', 'سيفط الطلب')}
          </button>
        </form>
      </div>
    </div>
  );
}
