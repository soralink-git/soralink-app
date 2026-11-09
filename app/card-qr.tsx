'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { trackedCardURL } from './lib/metric-links';
import { drawLogoBadge } from './lib/qr-logo';

export default function CardQR({
  id,
  publicName,
  logo,
  ar,
  business = '',
}: {
  id: string;
  publicName: string;
  logo?: string;
  business?: string;
  ar: boolean;
}) {
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(location.origin), []);
  const [withLogo, setWithLogo] = useState(true);
  const [image, setImage] = useState('');
  const [error, setError] = useState(false);
  const [exporting, setExporting] = useState(false),
    [exportError, setExportError] = useState(false);
  const t = (fr: string, a: string) => (ar ? a : fr);
  const eligibleLogo =
    typeof logo === 'string' &&
    (/^\/api\/upload\?key=[a-f0-9-]{36}$/.test(logo) ||
      logo.startsWith('data:image/') ||
      logo.startsWith('/assets/'))
      ? logo
      : '';
  useEffect(() => {
    let cancelled = false;
    setImage('');
    setError(false);
    if (!id) return;
    void (async () => {
      try {
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, trackedCardURL(location.origin, id, publicName, 'qr'), {
          width: 768,
          margin: 4,
          errorCorrectionLevel: 'H',
        });
        if (withLogo) {
          if (eligibleLogo) {
            try {
              const picture = new Image();
              picture.src = eligibleLogo;
              await picture.decode();
              if (cancelled) return;
              drawLogoBadge(canvas, picture, false);
            } catch {
              if (cancelled) return;
              drawLogoBadge(canvas, null, true);
            }
          } else {
            drawLogoBadge(canvas, null, true);
          }
        }
        if (!cancelled) setImage(canvas.toDataURL('image/png'));
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, publicName, withLogo, eligibleLogo]);
  if (!id)
    return (
      <p className="hint">
        {t(
          'Enregistrez votre carte pour obtenir son QR.',
          'سجّل الكارط باش تحصل على رمز QR ديالها.',
        )}
      </p>
    );
  return (
    <div className="card-qr-panel">
      <label className="toggle">
        <input type="checkbox" checked={withLogo} onChange={(e) => setWithLogo(e.target.checked)} />
        {eligibleLogo
          ? t('Ajouter mon logo au centre', 'زيد اللوگو ديالي فالوسط')
          : t('Ajouter le logo SoraLink au centre', 'زيد رمز SoraLink فالوسط')}
      </label>
      {!eligibleLogo && withLogo && (
        <p className="hint" style={{ marginTop: '-4px', fontSize: '12px' }}>
          {t(
            'Ajoutez votre photo ou logo dans l’onglet Profil pour l’afficher au centre du QR.',
            'أضف صورتك أو شعارك في تبويب الملف الشخصي لعرضه في وسط رمز QR.',
          )}
        </p>
      )}
      {image ? (
        <img
          src={image}
          width={192}
          height={192}
          alt={t('QR de votre carte', 'رمز QR ديال الكارط')}
        />
      ) : (
        <p role="status">
          {error
            ? t(
                'QR indisponible. Réessayez sans logo ou rechargez la page.',
                'رمز QR ما متوفرش. جرّب بلا لوگو ولا عاود حمّل الصفحة.',
              )
            : t('Création du QR…', 'كنوجدو رمز QR…')}
        </p>
      )}
      <a
        className="secondary"
        href={image || undefined}
        download={`${publicName || id}-qr.png`}
        aria-disabled={!image}
        onClick={(e) => {
          if (!image) e.preventDefault();
        }}
      >
        {t('Télécharger le QR', 'حمّل رمز QR')}
      </a>
      <button
        type="button"
        className="secondary"
        disabled={exporting || !image}
        onClick={async () => {
          setExporting(true);
          setExportError(false);
          try {
            const { qrStandPDF } = await import('./qr-stand-pdf');
            const blob = await qrStandPDF(
              trackedCardURL(location.origin, id, publicName, 'qr'),
              business,
              ar,
              withLogo ? eligibleLogo || 'brand' : undefined,
            );
            const url = URL.createObjectURL(blob),
              link = document.createElement('a');
            link.href = url;
            link.download = `chevalet-a5-${publicName || 'soralink'}.pdf`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
          } catch {
            setExportError(true);
          } finally {
            setExporting(false);
          }
        }}
      >
        {exporting
          ? t('Préparation…', 'كنوجدو…')
          : t('Télécharger le chevalet A5 (PDF)', 'حمّل حامل QR بصيغة PDF قياس A5')}
      </button>
      {exportError && (
        <p role="alert">{t('PDF indisponible. Réessayez.', 'PDF ما متوفرش دابا. عاود جرّب.')}</p>
      )}
      <label className="field">
        {t('Lien à programmer dans votre carte NFC', 'الرابط اللي خاص يتبرمج فبطاقة NFC')}
        <input
          readOnly
          dir="ltr"
          value={origin ? trackedCardURL(origin, id, publicName, 'nfc') : ''}
          onFocus={(e) => e.currentTarget.select()}
        />
      </label>
      <p className="hint">
        {t(
          'Ce lien permet de distinguer les visites NFC. Les cartes déjà programmées doivent être mises à jour pour utiliser ce marquage.',
          'هاد الرابط كيفرّق زيارات NFC. البطاقات المبرمجة من قبل خاص يتبدّل الرابط ديالها باش تستعمل هاد العلامة.',
        )}
      </p>
      <p className="hint">
        {t(
          'Le QR garde le lien de votre carte quand vous modifiez son contenu. Vérifiez le scan avant impression.',
          'رمز QR كيبقى مربوط بالكارط ملي كتبدّل المحتوى. جرّب السكان قبل الطباعة.',
        )}
      </p>
    </div>
  );
}
