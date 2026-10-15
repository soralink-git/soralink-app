'use client';
import { useEffect, useState } from 'react';
import { offerLabel } from '../lib/journey-links';
import { Nfc, Users, Package, Clock, RefreshCw, Shield, Save, Globe } from 'lucide-react';
const statuses: any = {
  pending: 'En attente / فانتظار الأداء',
  paid: 'Paiement confirmé / تخلّص',
  design: 'Visuel à valider / التصميم',
  production: 'En fabrication / فالتحضير',
  ready: 'Prête / واجدة',
  shipped: 'Expédiée / تسيفطات',
  delivered: 'Remise / تسلّمات',
  cancelled: 'Annulée / تلغات',
};
export default function Admin({ initialArabic = false }: { initialArabic?: boolean }) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [tab, setTab] = useState('clients'),
    [search, setSearch] = useState(''),
    [ar, setAr] = useState(initialArabic);
  const t = (fr: string, darija: string) => (ar ? darija : fr);
  useEffect(() => {
    setAr(new URLSearchParams(location.search).get('lang') === 'ar');
  }, []);
  useEffect(() => {
    document.documentElement.lang = ar ? 'ar' : 'fr';
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
  }, [ar]);
  async function load() {
    setBusy(true);
    try {
      const r = await fetch('/api/admin');
      const b: any = await r.json();
      if (!r.ok) throw new Error(ar ? b.errorAr || 'الخدمة ما متوفراش. عاود جرّب.' : b.error);
      setData(b);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlTab = new URLSearchParams(window.location.search).get('tab');
        const savedTab = localStorage.getItem('soralink_admin_tab');
        const candidate = urlTab || savedTab;
        if (candidate && ['clients', 'orders', 'audit'].includes(candidate)) {
          setTab(candidate);
        }
      } catch {}
    }
    load();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('soralink_admin_tab', tab);
      const url = new URL(window.location.href);
      if (url.searchParams.get('tab') !== tab) {
        url.searchParams.set('tab', tab);
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
    } catch {}
  }, [tab]);
  async function save(body: any) {
    setBusy(true);
    try {
      const r = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const b: any = await r.json();
      if (!r.ok) throw new Error(ar ? b.errorAr || 'الخدمة ما متوفراش. عاود جرّب.' : b.error);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="site" dir={ar ? 'rtl' : 'ltr'}>
      <header>
        <button
          className="language"
          onClick={() => {
            const next = !ar;
            setAr(next);
            const u = new URL(location.href);
            u.searchParams.set('lang', next ? 'ar' : 'fr');
            history.replaceState(null, '', u.pathname + u.search);
          }}
        >
          {ar ? 'Français' : 'العربية'}
        </button>
        <a className="brand" dir="ltr" href="/">
          <span className="brand-icon">
            <Nfc />
          </span>
          Sora<span>Link</span>
        </a>
        <span className="badge">
          <Shield size={14} />
          {t('ADMINISTRATION', 'الإدارة')}
        </span>
        <a className="secondary small" href={'/?app=1&lang=' + (ar ? 'ar' : 'fr')}>
          {t('Mon espace', 'الحساب ديالي')}
        </a>
      </header>
      <main className="section">
        <span className="eyebrow">{t('SORALINK / GESTION', 'SoraLink / التسيير')}</span>
        <div className="workspace-head">
          <h1>{t('Administration', 'الإدارة')}</h1>
          <button className="secondary" disabled={busy} onClick={load}>
            <RefreshCw size={16} />
            {t('Actualiser', 'حدّث')}
          </button>
        </div>
        <p className="muted">
          {t(
            'Accès réservé à l’administrateur · paiements manuels et suivi des supports.',
            'ولوج خاص بالإدارة: الأداء اليدوي وتتبع الكارطات.',
          )}
        </p>
        {error && <div className="notice">{error}</div>}
        {!data ? (
          <div className="empty">
            <Shield size={44} />
            <h2>{t('Connexion administrateur', 'دخول الإدارة')}</h2>
            <p>
              {t(
                'Utilisez le compte SoraLink vérifié autorisé pour l’administration.',
                'استعمل الحساب المؤكد والمسموح ليه بإدارة SoraLink.',
              )}
            </p>
            <a className="primary" target="_top" href={'/auth?lang=' + (ar ? 'ar' : 'fr')}>
              {t('Se connecter', 'دخل للحساب')}
            </a>
          </div>
        ) : (
          <>
            <div className="admin-stats">
              <div className="panel">
                <Users />
                <b>{data.profiles.length}</b>
                <span>{t('Clients', 'الزبناء')}</span>
              </div>
              <div className="panel">
                <Package />
                <b>{data.orders.filter((o: any) => o.status === 'pending').length}</b>
                <span>{t('Demandes en attente', 'الطلبات المعلقة')}</span>
              </div>
              <div className="panel">
                <Clock />
                <b>
                  {
                    data.profiles.filter((p: any) => p.expires && new Date(p.expires) < new Date())
                      .length
                  }
                </b>
                <span>{t('Échéances dépassées', 'الاشتراكات اللي سالات')}</span>
              </div>
            </div>
            <div className="row admin-tabs">
              {[
                ['clients', t('Clients', 'الزبناء')],
                ['orders', t('Commandes', 'الطلبات')],
                ['audit', t('Historique', 'التتبع')],
              ].map(([v, l]) => (
                <button
                  className={tab === v ? 'primary' : 'secondary'}
                  key={v}
                  onClick={() => setTab(v)}
                >
                  {l}
                </button>
              ))}
            </div>
            {tab === 'clients' && (
              <>
                <label className="field">
                  {t('Rechercher', 'قلب')}
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('Nom ou e-mail', 'الاسم ولا الإيميل')}
                  />
                </label>
                {data.profiles
                  .filter((p: any) =>
                    (p.email + ' ' + JSON.parse(p.data).name)
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((p: any) => (
                    <form
                      className="panel admin-client"
                      key={p.id}
                      onSubmit={(e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        save({
                          action: 'profile',
                          id: p.id,
                          state: f.get('state'),
                          plan: f.get('plan'),
                          expires: f.get('expires'),
                          pro: f.get('pro') === 'on',
                        });
                      }}
                    >
                      <div className="panel-title">
                        <div>
                          <h2>{JSON.parse(p.data).name}</h2>
                          <p className="hint">
                            {p.email ||
                              t(
                                'E-mail renseigné à la prochaine connexion',
                                'الإيميل غادي يتسجّل فالدخول الجاي',
                              )}
                          </p>
                        </div>
                        <a className="secondary small" href={'/c/' + p.id} target="_blank">
                          {t('Voir la carte', 'شوف الكارط')}
                        </a>
                      </div>
                      <div className="form-grid">
                        <label className="field">
                          {t('État', 'الحالة')}
                          <select name="state" defaultValue={p.state}>
                            <option value="trial">{t('Essai', 'تجربة')}</option>
                            <option value="active">{t('Actif', 'مفعّل')}</option>
                            <option value="suspended">{t('Suspendu', 'موقوف')}</option>
                          </select>
                        </label>
                        <label className="field">
                          {t('Offre', 'العرض')}
                          <select name="plan" defaultValue={p.plan}>
                            {['Digital', 'Pack', 'Accompagnement'].map((v) => (
                              <option key={v} value={v}>
                                {offerLabel(v, ar)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          {t('Échéance', 'نهاية الاشتراك')}
                          <input
                            name="expires"
                            type="date"
                            defaultValue={p.expires?.slice(0, 10) || ''}
                          />
                        </label>
                        <label className="toggle">
                          <input name="pro" type="checkbox" defaultChecked={!!p.pro_enabled} />
                          {t('Option Rendez-vous', 'خيار المواعيد')}
                        </label>
                      </div>
                      <p className="hint">
                        {t(
                          'Validez le paiement séparément dans Commandes, puis activez l’offre et son échéance ici.',
                          'أكّد الأداء فقسم الطلبات ومن بعد فعّل العرض والأجل ديالو هنا.',
                        )}
                      </p>
                      <button className="primary" disabled={busy}>
                        <Save size={16} />
                        {t('Enregistrer', 'سجّل')}
                      </button>
                    </form>
                  ))}
                {!data.profiles.length && (
                  <div className="empty">
                    {t(
                      'Aucun client. Créez votre première carte dans Mon espace.',
                      'ما كاين حتى زبون. صايب أول كارط فالحساب ديالك.',
                    )}
                  </div>
                )}
              </>
            )}
            {tab === 'orders' && (
              <section className="panel">
                {data.orders.map((o: any) => (
                  <article className="request" key={o.id}>
                    <div>
                      <span className="eyebrow">{offerLabel(o.plan, ar)}</span>
                      <h3>
                        {o.data ? JSON.parse(o.data).name : t('Client sans carte', 'زبون بلا كارط')}
                      </h3>
                      <p>{o.email}</p>
                      <p className="hint">
                        {o.created.slice(0, 10)} · {o.id.slice(0, 8)}
                      </p>
                    </div>
                    <label className="field">
                      {t('Statut', 'الحالة')}
                      <select
                        value={o.status}
                        disabled={busy}
                        onChange={(e) =>
                          save({ action: 'order', id: o.id, status: e.target.value })
                        }
                      >
                        {Object.entries(statuses).map(([v, l]: any) => (
                          <option key={v} value={v}>
                            {String(l).split(' / ')[ar ? 1 : 0]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </article>
                ))}
                {!data.orders.length && (
                  <div className="empty">
                    {t('Aucune demande de pack.', 'ما كاين حتى طلب ديال الپاك.')}
                  </div>
                )}
              </section>
            )}
            {tab === 'audit' && (
              <section className="panel">
                {data.audit.map((a: any) => (
                  <div className="request" key={a.id}>
                    <div>
                      <strong>{a.action}</strong>
                      <p className="hint">
                        {a.actor} · {a.target.slice(0, 8)}
                      </p>
                    </div>
                    <span className="hint">
                      {new Date(a.created).toLocaleString('fr-FR', {
                        timeZone: 'Africa/Casablanca',
                      })}
                    </span>
                  </div>
                ))}
                {!data.audit.length && (
                  <div className="empty">
                    {t(
                      'Les actions administratives apparaîtront ici.',
                      'الإجراءات ديال الإدارة غادي تبان هنا.',
                    )}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
