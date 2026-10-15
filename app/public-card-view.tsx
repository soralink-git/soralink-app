'use client';
import { lazy, Suspense, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import CardView from './card-view';
const PublicRequestModal = lazy(() => import('./public-request-modal'));
export default function PublicCardView({
  cardId = '',
  initialData,
  initialError = '',
  initialAr,
  demoArabic,
}: {
  cardId?: string;
  initialData: any;
  initialError?: string;
  initialAr?: boolean;
  demoArabic?: any;
}) {
  const [ar, setAr] = useState(
      typeof initialAr === 'boolean'
        ? initialAr
        : initialData?.defaultLanguage === 'ar' || initialData?.lang === 'ar',
    ),
    [data, setData] = useState(initialData),
    [error, setError] = useState(initialError),
    [busy, setBusy] = useState(false),
    [msg, setMsg] = useState(''),
    [request, setRequest] = useState<{ kind: string; item?: any } | null>(null);
  const t = (fr: string, da: string) => (ar ? da : fr),
    d = demoArabic && ar ? demoArabic : data,
    view = demoArabic ? 'demo' : 'public';
  useEffect(() => {
    document.documentElement.lang = ar ? 'ar' : 'fr';
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
  }, [ar]);
  async function retry() {
    if (!cardId || busy) return;
    setBusy(true);
    try {
      const r = await fetch('/api/data?id=' + encodeURIComponent(cardId), { cache: 'no-store' });
      const b = (await r.json()) as { data: string };
      if (!r.ok) {
        setError(r.status === 404 ? 'notfound' : 'service');
        return;
      }
      const parsed = JSON.parse(b.data);
      setData(parsed);
      if (typeof initialAr !== 'boolean' && (parsed.defaultLanguage || parsed.lang)) {
        setAr(parsed.defaultLanguage === 'ar' || parsed.lang === 'ar');
      }
      setError('');
    } catch {
      setError('service');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="site public-card-page" dir={ar ? 'rtl' : 'ltr'}>
      {msg && (
        <div className="notice" role="status">
          {msg}
          <button aria-label={t('Fermer', 'سدّ')} onClick={() => setMsg('')}>
            <X size={16} />
          </button>
        </div>
      )}
      <main className="public-layout">
        {d ? (
          <CardView
            d={d}
            ar={ar}
            setAr={setAr}
            view={view}
            id={cardId}
            onMessage={setMsg}
            onRequest={(kind, item) => setRequest({ kind, item })}
            withSections
          />
        ) : (
          <div className="empty">
            <h2>
              {error === 'service'
                ? t('Service temporairement indisponible', 'الخدمة ما متوفراش دابا')
                : t('Page indisponible', 'الصفحة ما متوفراش')}
            </h2>
            {error === 'service' && (
              <button className="secondary" disabled={busy} onClick={retry}>
                {busy ? t('Chargement…', 'كنحمّلو…') : t('Réessayer', 'عاود جرّب')}
              </button>
            )}
          </div>
        )}
      </main>
      <footer
        className="public-legal"
        style={{ textAlign: 'center', padding: '16px', fontSize: '0.8rem' }}
      >
        <a href={'/conditions?lang=' + (ar ? 'ar' : 'fr')}>
          {t('Conditions de service', 'شروط الخدمة')}
        </a>
        {' · '}
        <a href={'/confidentialite?lang=' + (ar ? 'ar' : 'fr')}>
          {t('Confidentialité', 'الخصوصية')}
        </a>
      </footer>
      {request && d && (
        <Suspense
          fallback={
            <div className="notice" role="status">
              {t('Chargement du formulaire…', 'كنحمّلو الفورميلير…')}
            </div>
          }
        >
          <PublicRequestModal
            key={request.kind}
            kind={request.kind}
            data={d}
            id={cardId}
            selectedItem={request.item || null}
            ar={ar}
            onClose={() => setRequest(null)}
            onMessage={setMsg}
          />
        </Suspense>
      )}
    </div>
  );
}
