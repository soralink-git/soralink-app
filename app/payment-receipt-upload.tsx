'use client';
import { useEffect, useState } from 'react';
type Receipt = { id: string; mime: string; bytes: number; created: string };
export default function PaymentReceiptUpload({
  orderId,
  ar,
  pending = false,
  admin = false,
}: {
  orderId: string;
  ar: boolean;
  pending?: boolean;
  admin?: boolean;
}) {
  const [files, setFiles] = useState<Receipt[]>([]),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const t = (fr: string, a: string) => (ar ? a : fr);
  async function refresh() {
    const response = await fetch('/api/payment-receipts?order=' + encodeURIComponent(orderId), {
      cache: 'no-store',
    });
    if (!response.ok) throw Error(t('Justificatifs indisponibles.', 'الوثائق ما متوفراش دابا.'));
    const data: any = await response.json();
    setFiles(data.receipts || []);
    setLoaded(true);
  }
  useEffect(() => {
    let live = true;
    fetch('/api/payment-receipts?order=' + encodeURIComponent(orderId), { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw Error();
        const b: any = await r.json();
        if (live) {
          setFiles(b.receipts || []);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (live) setError(t('Justificatifs indisponibles.', 'الوثائق ما متوفراش دابا.'));
      });
    return () => {
      live = false;
    };
  }, [orderId, ar]);
  return (
    <div className="payment-receipts">
      <strong>{t('Justificatifs de paiement', 'وثائق الأداء')}</strong>
      {files.map((file, i) => (
        <a
          key={file.id}
          className="secondary small"
          href={'/api/payment-receipts/' + file.id}
          download
        >
          {t('Télécharger le justificatif', 'حمّل وثيقة الأداء')} {i + 1} ·{' '}
          {Math.ceil(file.bytes / 1024)} {t('Ko', 'كيلوبايت')}
        </a>
      ))}
      {loaded && !files.length && (
        <small>{t('Aucun justificatif déposé.', 'ما تزادت حتى وثيقة.')}</small>
      )}
      {pending && !admin && files.length < 3 && (
        <label className="field">
          {busy
            ? t('Dépôt en cours…', 'كنرسلو الوثيقة…')
            : t(
                'Ajouter un justificatif (JPEG, PNG ou PDF, 5 Mo maximum)',
                'زيد وثيقة الأداء (JPEG ولا PNG ولا PDF، حتى 5 ميغا)',
              )}
          <input
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            disabled={busy || !loaded}
            onChange={async (e) => {
              const input = e.currentTarget,
                file = input.files?.[0];
              if (!file) return;
              setError('');
              if (file.size > 5 * 1024 * 1024) {
                setError(t('Fichier de 5 Mo maximum.', 'الملف ما يفوتش 5 ميغا.'));
                input.value = '';
                return;
              }
              setBusy(true);
              try {
                const form = new FormData();
                form.set('order', orderId);
                form.set('file', file);
                const r = await fetch('/api/payment-receipts', { method: 'POST', body: form });
                const b: any = await r.json();
                if (!r.ok)
                  throw Error(ar ? b.errorAr || 'تعذر الإرسال.' : b.error || 'Dépôt impossible.');
                await refresh();
              } catch (ex: any) {
                setError(ex.message || t('Dépôt impossible.', 'تعذر الإرسال.'));
              } finally {
                setBusy(false);
                input.value = '';
              }
            }}
          />
        </label>
      )}
      {files.length > 0 && (
        <p className="hint">
          {admin
            ? t(
                'Justificatif reçu : vérifiez l’encaissement avant de confirmer le paiement.',
                'توصلنا بالوثيقة: تأكد من دخول الفلوس قبل تأكيد الأداء.',
              )
            : t(
                'Justificatif reçu. Le paiement reste soumis à la vérification de SoraLink.',
                'توصلنا بالوثيقة. SoraLink باقي خاصها تتأكد من الأداء.',
              )}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
