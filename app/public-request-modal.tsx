'use client';
import { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { cataloguePrice } from './lib/catalogue';
import { defaults, moroccoNow } from './lib/schedule';
export default function PublicRequestModal({
  kind: modal,
  data,
  id,
  selectedItem,
  ar,
  onClose,
  onMessage: setMsg,
}: {
  kind: string;
  data: any;
  id: string;
  selectedItem: any;
  ar: boolean;
  onClose: () => void;
  onMessage: (message: string) => void;
}) {
  const t = (fr: string, da: string) => (ar ? da : fr);
  const dialog = useRef<HTMLDivElement>(null);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false),
    [date, setDate] = useState(moroccoNow().slice(0, 10)),
    [serviceIndex, setServiceIndex] = useState(0),
    [slots, setSlots] = useState<string[]>([]),
    [slotsBusy, setSlotsBusy] = useState(false);
  const [myContactCard, setMyContactCard] = useState<any>(null),
    [useMyCard, setUseMyCard] = useState(false),
    [cardCheck, setCardCheck] = useState('');
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  function keyboard(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape' && !busy) {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const nodes = Array.from(
      dialog.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]',
      ) || [],
    ).filter((node) => node.tabIndex >= 0 && node.getClientRects().length > 0);
    if (!nodes.length) {
      e.preventDefault();
      dialog.current?.focus();
      return;
    }
    const first = nodes[0],
      last = nodes[nodes.length - 1];
    if (
      e.shiftKey &&
      (document.activeElement === first || document.activeElement === dialog.current)
    ) {
      e.preventDefault();
      last.focus();
    } else if (
      !e.shiftKey &&
      (document.activeElement === last || document.activeElement === dialog.current)
    ) {
      e.preventDefault();
      first.focus();
    }
  }
  async function action(body: any) {
    setBusy(true);
    try {
      const r = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const b = (await r.json()) as {
        error?: string;
        errorAr?: string;
      };
      if (!r.ok) throw new Error(ar ? b.errorAr || 'ما قدرناش نكمّلو الطلب. عاود جرّب.' : b.error);
      return b;
    } finally {
      setBusy(false);
    }
  }
  async function checkContactCard() {
    setCardCheck('loading');
    setMyContactCard(null);
    try {
      const r = await fetch('/api/data?exchange=1');
      const b: any = await r.json();
      if (r.status === 401) {
        setCardCheck('login');
        return;
      }
      if (!r.ok) throw new Error();
      if (b.card && b.card.id !== id) {
        setMyContactCard(b.card);
        setCardCheck('ready');
      } else setCardCheck('none');
    } catch {
      setCardCheck('error');
    }
  }
  useEffect(() => {
    if (modal === 'contact') {
      setUseMyCard(false);
      void checkContactCard();
    }
  }, [modal, id]);
  useEffect(() => {
    if (modal !== 'rdv' || !id) return;
    const controller = new AbortController();
    setSlotsBusy(true);
    setSlots([]);
    fetch('/api/availability?id=' + id + '&date=' + date + '&service=' + serviceIndex, {
      signal: controller.signal,
    })
      .then(async (r) => {
        const b: any = await r.json();
        if (!r.ok)
          throw new Error(ar ? b.errorAr || 'ما قدرناش نكمّلو الطلب. عاود جرّب.' : b.error);
        setSlots(b.slots);
      })
      .catch((e) => {
        if (e.name !== 'AbortError')
          setFormError(
            e.message || t('Demande impossible. Réessayez.', 'ما قدرناش نسيفطو الطلب. عاود جرّب.'),
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setSlotsBusy(false);
      });
    return () => controller.abort();
  }, [modal, id, date, serviceIndex]);
  return (
    <div className="modal-backdrop">
      <div
        ref={dialog}
        tabIndex={-1}
        onKeyDown={keyboard}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('Demande', 'الطلب')}
        dir={ar ? 'rtl' : 'ltr'}
      >
        <button
          className="close"
          aria-label={t('Fermer', 'سدّ')}
          disabled={busy}
          onClick={() => {
            onClose();
          }}
        >
          <X />
        </button>
        <span className="eyebrow">{data.name}</span>
        <h2>
          {modal === 'contact'
            ? t('Échanger nos coordonnées', 'نتبادلو معلومات التواصل')
            : modal === 'rdv'
              ? t('Demander un rendez-vous', 'طلب موعد')
              : modal === 'commande'
                ? t('Votre demande de commande', 'الطلب ديالك')
                : t('Demander un devis', 'طلب الثمن')}
        </h2>
        {['commande', 'devis'].includes(modal || '') && selectedItem && (
          <div className="catalogue-selection">
            <strong>{selectedItem.name}</strong>
            {selectedItem.category && <span>{selectedItem.category}</span>}
            {selectedItem.price && <span>{cataloguePrice(selectedItem.price, ar)}</span>}
          </div>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setFormError('');
            const f = new FormData(e.currentTarget);
            try {
              await action({
                action: 'request',
                profile: id,
                kind: modal,
                language: ar ? 'ar' : 'fr',
                name: f.get('name'),
                phone: f.get('phone'),
                message: f.get('message'),
                email: f.get('email'),
                service: serviceIndex,
                variantId: selectedItem?.variantId,
                catalogueId: ['commande', 'devis'].includes(modal || '')
                  ? selectedItem?.id
                  : undefined,
                slot: f.get('slot'),
                trap: f.get('company'),
                shareCard: modal === 'contact' && useMyCard,
                consent: modal === 'contact' ? f.get('consent') === 'on' : undefined,
              });
              onClose();
              setMsg(
                modal === 'contact'
                  ? t(
                      'Merci ! Vos coordonnées ont été transmises à ce professionnel.',
                      'شكراً! معلومات التواصل ديالك تسيفطات لهاد المهني.',
                    )
                  : t(
                      'Demande envoyée. Le professionnel doit la confirmer.',
                      'تسيفط الطلب. خاص المهني يأكدو.',
                    ),
              );
            } catch (e: any) {
              setFormError(
                e.message ||
                  t('Demande impossible. Réessayez.', 'ما قدرناش نسيفطو الطلب. عاود جرّب.'),
              );
            }
          }}
        >
          {modal === 'contact' && (
            <div className="contact-card-choice">
              {cardCheck === 'loading' ? (
                <p className="hint">{t('Recherche de votre carte…', 'كنقلبو على الكارط ديالك…')}</p>
              ) : myContactCard ? (
                <>
                  <div className="row">
                    <button
                      type="button"
                      className={useMyCard ? 'primary small' : 'secondary small'}
                      onClick={() => setUseMyCard(true)}
                    >
                      {t('Partager ma carte SoraLink', 'شارك كارط SoraLink ديالي')}
                    </button>
                    <button
                      type="button"
                      className={!useMyCard ? 'primary small' : 'secondary small'}
                      onClick={() => setUseMyCard(false)}
                    >
                      {t('Remplir le formulaire', 'عمّر الفورميلير')}
                    </button>
                  </div>
                  {useMyCard && (
                    <div className="catalogue-selection">
                      <strong>{myContactCard.name}</strong>
                      {myContactCard.business && <span>{myContactCard.business}</span>}
                      <span dir="ltr">{myContactCard.phone}</span>
                      {myContactCard.email && <span dir="ltr">{myContactCard.email}</span>}
                      <p className="hint">
                        {t(
                          'Ces coordonnées et le lien de votre carte seront partagés.',
                          'هاد المعلومات والرابط ديال الكارط غادي يتشاركو.',
                        )}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="hint">
                    {cardCheck === 'login'
                      ? t(
                          'Vous avez déjà une carte SoraLink ? Connectez-vous pour la partager.',
                          'عندك كارط SoraLink؟ دخل للحساب باش تشاركها.',
                        )
                      : cardCheck === 'error'
                        ? t(
                            'Votre carte n’a pas pu être chargée. Réessayez ou remplissez le formulaire.',
                            'ما قدرناش نحمّلو الكارط. عاود حاول ولا عمّر الفورميلير.',
                          )
                        : t(
                            'Pour partager votre carte, elle doit être publiée avec un nom et un téléphone visible. Vous pouvez aussi remplir ce formulaire.',
                            'باش تشارك الكارط، خاصها تكون منشورة وفيها الاسم والتلفون باين. تقدر حتى تعمّر هاد الفورميلير.',
                          )}
                  </p>
                  <div className="row">
                    {cardCheck === 'login' && (
                      <a
                        className="secondary small"
                        href="/auth"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('Se connecter', 'دخل للحساب')}
                      </a>
                    )}
                    <button type="button" className="text-button" onClick={checkContactCard}>
                      {t('Actualiser mon compte', 'حدّث الحساب ديالي')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {!(modal === 'contact' && useMyCard) && (
            <>
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
            </>
          )}
          {modal === 'rdv' && (
            <>
              <label className="field">
                {t('Prestation', 'الخدمة')}
                <select
                  value={serviceIndex}
                  onChange={(e) => setServiceIndex(Number(e.target.value))}
                >
                  {(data.appointmentServices || defaults.appointmentServices).map(
                    (v: any, i: number) => (
                      <option key={i} value={i}>
                        {v.name} · {v.duration} min
                      </option>
                    ),
                  )}
                </select>
              </label>
              {
                <>
                  <div
                    className="docare-date-strip"
                    role="group"
                    aria-label={t('Jours disponibles', 'الأيام المتوفرة')}
                  >
                    {(() => {
                      const list: { iso: string; dayName: string; dayNum: string }[] = [];
                      const base = new Date(moroccoNow().slice(0, 10) + 'T12:00:00Z');
                      const frDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
                      const arDays = [
                        'الأحد',
                        'الإثنين',
                        'الثلاثاء',
                        'الأربعاء',
                        'الخميس',
                        'الجمعة',
                        'السبت',
                      ];
                      for (let i = 0; i < 7; i++) {
                        const cur = new Date(base.getTime() + i * 86400000);
                        const iso = cur.toISOString().slice(0, 10);
                        const dayOfWeek = cur.getUTCDay();
                        list.push({
                          iso,
                          dayName: ar ? arDays[dayOfWeek] : frDays[dayOfWeek],
                          dayNum: String(cur.getUTCDate()).padStart(2, '0'),
                        });
                      }
                      return list;
                    })().map((d) => (
                      <button
                        key={d.iso}
                        type="button"
                        className={'docare-date-pill' + (date === d.iso ? ' active' : '')}
                        onClick={() => setDate(d.iso)}
                      >
                        <span className="pill-day">{d.dayName}</span>
                        <span className="pill-num">{d.dayNum}</span>
                      </button>
                    ))}
                  </div>
                  <label className="field">
                    {t('Jour souhaité · heure du Maroc', 'النهار · توقيت المغرب')}
                    <input
                      type="date"
                      required
                      value={date}
                      min={moroccoNow().slice(0, 10)}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    {t('Créneau disponible', 'الوقت المتوفر')}
                    <select
                      key={date + '-' + serviceIndex + '-' + slots.join(',')}
                      name="slot"
                      required
                      disabled={slotsBusy || !slots.length}
                      defaultValue=""
                    >
                      <option value="">
                        {slotsBusy
                          ? t('Chargement…', 'كنحمّلو…')
                          : slots.length
                            ? t('Choisir un horaire', 'اختار الوقت')
                            : t(
                                'Aucun créneau disponible ce jour',
                                'ما كاين حتى وقت متوفر فهاد النهار',
                              )}
                      </option>
                      {slots.map((v) => (
                        <option key={v} value={v}>
                          {v.slice(11)}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              }
            </>
          )}
          <label className="field">
            {t('Message facultatif', 'رسالة اختيارية')}
            <textarea
              name="message"
              maxLength={
                modal === 'contact' ? 1000 : selectedItem && modal === 'commande' ? 1500 : 2000
              }
            />
          </label>
          {modal === 'contact' && (
            <label className="contact-consent">
              <input type="checkbox" name="consent" required />
              {t(
                'J’accepte de partager ces coordonnées avec ' +
                  (data.business || data.name) +
                  ' pour être recontacté au sujet de mon activité ou de ma demande.',
                'كنوافق نشارك هاد المعلومات مع ' +
                  (data.business || data.name) +
                  ' باش يتواصل معايا بخصوص النشاط أو الطلب ديالي.',
              )}
            </label>
          )}
          <input className="honeypot" name="company" tabIndex={-1} autoComplete="off" />
          <p className="hint">
            {t(
              'Renseignez uniquement les informations nécessaires. Votre demande est visible par ce professionnel.',
              'دخل غير المعلومات الضرورية. الطلب كيشوفو غير هاد المهني.',
            )}
          </p>
          {formError && (
            <p role="alert" className="crop-error">
              {formError}
            </p>
          )}
          <button
            className="primary full"
            disabled={
              busy ||
              (modal === 'contact' && useMyCard && !myContactCard) ||
              (modal === 'rdv' && (slotsBusy || !slots.length))
            }
          >
            {busy
              ? t('Envoi…', 'كيتسيفط…')
              : modal === 'contact'
                ? t('Partager mes coordonnées', 'شارك معلومات التواصل ديالي')
                : t('Envoyer la demande', 'سيفط الطلب')}
          </button>
        </form>
      </div>
    </div>
  );
}
