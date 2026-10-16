'use client';
import { useEffect, useState } from 'react';
import { normalizePublicName, publicNameError } from './lib/public-address';
export default function AddressEditor({
  current,
  onChange,
  ar,
  disabled = false,
}: {
  current: string;
  onChange: (name: string) => void;
  ar: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(current);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const name = normalizePublicName(value);
  const t = (fr: string, da: string) => (ar ? da : fr);
  useEffect(() => {
    setValue(current);
  }, [current]);
  useEffect(() => {
    if (!name || name === current || disabled) {
      setStatus('');
      return;
    }
    const invalid = publicNameError(name);
    if (invalid) {
      setStatus(invalid);
      return;
    }
    const abort = new AbortController();
    setStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/address?name=' + encodeURIComponent(name), {
          cache: 'no-store',
          signal: abort.signal,
        });
        const body: any = await response.json();
        if (!abort.signal.aborted)
          setStatus(
            response.ok ? (body.available ? 'available' : 'taken') : body.error || 'service',
          );
      } catch {
        if (!abort.signal.aborted) setStatus('service');
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [name, current, disabled]);
  const messages: Record<string, string> = {
    checking: t('Vérification de la disponibilité…', 'كنشوفو واش الاسم متوفر…'),
    available: t('Cette adresse est disponible.', 'هاد العنوان متوفر.'),
    taken: t(
      'Cette adresse est déjà prise. Choisissez un autre nom.',
      'هاد العنوان خداوه. اختار اسم آخر.',
    ),
    format: t(
      'Utilisez 3 à 40 lettres sans accents, chiffres ou tirets, sans tiret au début ou à la fin.',
      'استعمل من 3 حتى 40 حرف لاتيني بلا تشكيل، أرقام ولا شرطات. ما تبداش وما تساليش بشرطة.',
    ),
    reserved: t(
      'Ce nom est réservé au site. Choisissez-en un autre.',
      'هاد الاسم محجوز للموقع. اختار اسم آخر.',
    ),
    auth: t('Reconnectez-vous pour choisir votre adresse.', 'عاود دخل للحساب باش تختار العنوان.'),
    service: t(
      'Vérification impossible. Réessayez dans un instant.',
      'ما قدرناش نتحققو. عاود جرّب من بعد شوية.',
    ),
    'save-first': t('Enregistrez d’abord votre carte.', 'سجّل الكارط ديالك الأول.'),
    saved: t('Votre nouvelle adresse est enregistrée.', 'تسجّل العنوان الجديد ديالك.'),
  };
  async function reserve() {
    if (saving || disabled || name === current || publicNameError(name)) return;
    setSaving(true);
    try {
      const response = await fetch('/api/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const body: any = await response.json();
      if (response.ok) {
        onChange(body.name);
        setStatus('saved');
      } else setStatus(body.error || 'service');
    } catch {
      setStatus('service');
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="address-editor">
      <label className="field">
        {t('Choisissez votre adresse SoraLink', 'اختار عنوان SoraLink ديالك')}
        <span className="address-input" dir="ltr">
          <span>soralink.link/</span>
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={saving || disabled}
            maxLength={40}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="mon-activite"
            aria-describedby="address-hint address-status"
          />
        </span>
      </label>
      <p className="hint" id="address-hint">
        {disabled
          ? messages['save-first']
          : current
            ? t(
                'Votre adresse actuelle et vos anciens QR codes restent valables après un changement.',
                'العنوان الحالي و QR القدام كيبقاو خدامين من بعد التغيير.',
              )
            : t(
                'Choisissez un nom court, par exemple celui de votre activité.',
                'اختار اسم قصير، مثلا اسم الخدمة ديالك.',
              )}
      </p>
      <p id="address-status" role="status" className="hint">
        {messages[status] || ''}
      </p>
      <button
        type="button"
        className="primary"
        disabled={disabled || saving || name === current || status !== 'available'}
        onClick={reserve}
      >
        {saving
          ? t('Enregistrement…', 'كنسجّلو…')
          : t('Utiliser cette adresse', 'استعمل هاد العنوان')}
      </button>
    </div>
  );
}
