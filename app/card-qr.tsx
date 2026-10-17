'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { publicCardPath } from './lib/public-address';
export default function CardQR({
  id,
  publicName,
  logo,
  ar,
}: {
  id: string;
  publicName: string;
  logo?: string;
  ar: boolean;
}) {
  const [withLogo, setWithLogo] = useState(false);
  const [image, setImage] = useState('');
  const [error, setError] = useState(false);
  const t = (fr: string, a: string) => (ar ? a : fr);
  const eligibleLogo =
    typeof logo === 'string' && /^\/api\/upload\?key=[a-f0-9-]{36}$/.test(logo) ? logo : '';
  useEffect(() => {
    let cancelled = false;
    setImage('');
    setError(false);
    if (!id) return;
    void (async () => {
      try {
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, location.origin + publicCardPath(id, publicName), {
          width: 768,
          margin: 4,
          errorCorrectionLevel: 'H',
        });
        if (withLogo && eligibleLogo) {
          const picture = new Image();
          picture.src = eligibleLogo;
          await picture.decode();
          if (cancelled) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw Error('canvas');
          // Preserve a quiet border around a small logo; the outer QR quiet zone stays untouched.
          const area = Math.round(canvas.width * 0.18),
            padding = Math.round(canvas.width * 0.015);
          const x = (canvas.width - area) / 2;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, x, area, area);
          const scale = Math.min(
            (area - padding * 2) / picture.naturalWidth,
            (area - padding * 2) / picture.naturalHeight,
          );
          const width = picture.naturalWidth * scale,
            height = picture.naturalHeight * scale;
          ctx.drawImage(
            picture,
            (canvas.width - width) / 2,
            (canvas.height - height) / 2,
            width,
            height,
          );
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
      {eligibleLogo && (
        <label className="toggle">
          <input
            type="checkbox"
            checked={withLogo}
            onChange={(e) => setWithLogo(e.target.checked)}
          />
          {t('Ajouter mon logo au centre', 'زيد اللوگو ديالي فالوسط')}
        </label>
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
        download="soralink-qr.png"
        aria-disabled={!image}
        onClick={(e) => {
          if (!image) e.preventDefault();
        }}
      >
        {t('Télécharger le QR', 'حمّل رمز QR')}
      </a>
      <p className="hint">
        {t(
          'Le QR garde le lien de votre carte quand vous modifiez son contenu. Vérifiez le scan avant impression.',
          'رمز QR كيبقى مربوط بالكارط ملي كتبدّل المحتوى. جرّب السكان قبل الطباعة.',
        )}
      </p>
    </div>
  );
}
