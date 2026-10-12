'use client';
import { useEffect, useState } from 'react';
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
export default function Admin() {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [tab, setTab] = useState('clients'),
    [search, setSearch] = useState('');
  async function load() {
    setBusy(true);
    try {
      const r = await fetch('/api/admin');
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error);
      setData(b);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function save(body: any) {
    setBusy(true);
    try {
      const r = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="site">
      <header>
        <a className="brand" dir="ltr" href="/">
          <span className="brand-icon">
            <Nfc />
          </span>
          Sora<span>Link</span>
        </a>
        <span className="badge">
          <Shield size={14} /> ADMINISTRATION
        </span>
        <a className="secondary small" href="/?app=1">
          Mon espace / الحساب ديالي
        </a>
      </header>
      <main className="section">
        <span className="eyebrow">SORALINK / GESTION</span>
        <div className="workspace-head">
          <h1>Administration · الإدارة</h1>
          <button className="secondary" disabled={busy} onClick={load}>
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>
        <p className="muted">
          Accès réservé à l’administrateur · paiements manuels et suivi des supports.
        </p>
        {error && <div className="notice">{error}</div>}
        {!data ? (
          <div className="empty">
            <Shield size={44} />
            <h2>Connexion administrateur</h2>
            <p>Utilisez le compte SoraLink vérifié autorisé pour l’administration.</p>
            <a className="primary" target="_top" href="/auth">
              Se connecter
            </a>
          </div>
        ) : (
          <>
            <div className="admin-stats">
              <div className="panel">
                <Users />
                <b>{data.profiles.length}</b>
                <span>Clients / الزبناء</span>
              </div>
              <div className="panel">
                <Package />
                <b>{data.orders.filter((o: any) => o.status === 'pending').length}</b>
                <span>Demandes en attente</span>
              </div>
              <div className="panel">
                <Clock />
                <b>
                  {
                    data.profiles.filter((p: any) => p.expires && new Date(p.expires) < new Date())
                      .length
                  }
                </b>
                <span>Échéances dépassées</span>
              </div>
            </div>
            <div className="row admin-tabs">
              {[
                ['clients', 'Clients / الزبناء'],
                ['orders', 'Commandes / الطلبات'],
                ['audit', 'Historique / التتبع'],
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
                  Rechercher / قلب
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nom ou e-mail"
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
                            {p.email || 'E-mail renseigné à la prochaine connexion'}
                          </p>
                        </div>
                        <a className="secondary small" href={'/c/' + p.id} target="_blank">
                          Voir la carte
                        </a>
                      </div>
                      <div className="form-grid">
                        <label className="field">
                          État
                          <select name="state" defaultValue={p.state}>
                            <option value="trial">Essai / تجربة</option>
                            <option value="active">Actif / مفعّل</option>
                            <option value="suspended">Suspendu / موقوف</option>
                          </select>
                        </label>
                        <label className="field">
                          Offre
                          <select name="plan" defaultValue={p.plan}>
                            {['Digital', 'Pack', 'Accompagnement'].map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          Échéance / نهاية الاشتراك
                          <input
                            name="expires"
                            type="date"
                            defaultValue={p.expires?.slice(0, 10) || ''}
                          />
                        </label>
                        <label className="toggle">
                          <input name="pro" type="checkbox" defaultChecked={!!p.pro_enabled} />
                          Pro Rendez-vous
                        </label>
                      </div>
                      <p className="hint">
                        Validez le paiement séparément dans Commandes, puis activez l’offre et son
                        échéance ici.
                      </p>
                      <button className="primary" disabled={busy}>
                        <Save size={16} />
                        Enregistrer
                      </button>
                    </form>
                  ))}
                {!data.profiles.length && (
                  <div className="empty">
                    Aucun client. Créez votre première carte dans Mon espace.
                  </div>
                )}
              </>
            )}
            {tab === 'orders' && (
              <section className="panel">
                {data.orders.map((o: any) => (
                  <article className="request" key={o.id}>
                    <div>
                      <span className="eyebrow">{o.plan}</span>
                      <h3>{o.data ? JSON.parse(o.data).name : 'Client sans carte'}</h3>
                      <p>{o.email}</p>
                      <p className="hint">
                        {o.created.slice(0, 10)} · {o.id.slice(0, 8)}
                      </p>
                    </div>
                    <label className="field">
                      Statut
                      <select
                        value={o.status}
                        disabled={busy}
                        onChange={(e) =>
                          save({ action: 'order', id: o.id, status: e.target.value })
                        }
                      >
                        {Object.entries(statuses).map(([v, l]: any) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </label>
                  </article>
                ))}
                {!data.orders.length && <div className="empty">Aucune demande de pack.</div>}
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
                  <div className="empty">Les actions administratives apparaîtront ici.</div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
