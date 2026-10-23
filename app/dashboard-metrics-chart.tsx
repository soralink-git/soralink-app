'use client';
import { useEffect, useState } from 'react';
export default function DashboardMetricsChart({ ar }: { ar: boolean }) {
  const [rows, setRows] = useState<{ day: string; source: string; visits: number }[] | null>(null),
    [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    fetch('/api/metrics', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw Error();
        const b: any = await r.json();
        if (live) setRows(b.rows);
      })
      .catch(() => {
        if (live) setError(true);
      });
    return () => {
      live = false;
    };
  }, []);
  const t = (fr: string, a: string) => (ar ? a : fr);
  if (error)
    return (
      <p role="status">
        {t('Statistiques momentanément indisponibles.', 'الإحصائيات ما متوفراش دابا.')}
      </p>
    );
  const totals = ['qr', 'nfc', 'direct'].map((source) => ({
    source,
    value: (rows || []).filter((r) => r.source === source).reduce((n, r) => n + r.visits, 0),
  }));
  const max = Math.max(1, ...totals.map((t) => t.value));
  return (
    <section
      className="visit-metrics"
      aria-label={t('Visites par origine du lien', 'الزيارات حسب مصدر الرابط')}
    >
      <h3>{t('Visites de ma carte · 30 derniers jours', 'زيارات البطاقة · آخر 30 يوم')}</h3>
      {rows === null ? (
        <p role="status">{t('Chargement…', 'كنحمّلو…')}</p>
      ) : (
        totals.map(({ source, value }) => (
          <div className="metric-row" key={source}>
            <span>
              {source === 'qr' ? 'QR' : source === 'nfc' ? 'NFC' : t('Autres liens', 'روابط أخرى')}
            </span>
            <div className="metric-track" aria-hidden="true">
              <span style={{ width: (value / max) * 100 + '%' }} />
            </div>
            <strong>{new Intl.NumberFormat(ar ? 'ar-MA' : 'fr-MA').format(value)}</strong>
          </div>
        ))
      )}
      <p className="hint">
        {t(
          'Ces compteurs indiquent l’origine déclarée du lien, pas les scans physiques. Les visites répétées rapprochées, les robots connus et vos visites connectées sont filtrés. Les anciens liens sans marquage figurent dans « Autres liens ».',
          'هاد العدادات كيبينو مصدر الرابط المعلن، ماشي السكانات الفعلية. كنصفّيو الزيارات المتكررة فمدة قصيرة والروبوتات المعروفة والزيارات ديالك ملي كتكون داخل للحساب. الروابط القديمة بلا علامة كتبان فروابط أخرى.',
        )}
      </p>
    </section>
  );
}
