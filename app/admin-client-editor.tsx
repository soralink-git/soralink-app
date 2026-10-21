'use client';
import { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { capabilities, platformPlans, isPlatformPlan } from './lib/offers';
import { offerLabel } from './lib/journey-links';
import {
  readClientAccess,
  managementRevision,
  clientSectionKeys,
  type ClientAccess,
} from './lib/client-access-config';
import { clientSections, clientSectionLabels } from './lib/client-access';
export default function AdminClientEditor({
  profile,
  ar,
  busy,
  onSave,
}: {
  profile: any;
  ar: boolean;
  busy: boolean;
  onSave: (body: any) => void;
}) {
  const t = (fr: string, da: string) => (ar ? da : fr);
  const [plan, setPlan] = useState(profile.plan);
  const [state, setState] = useState(profile.state);
  const [expires, setExpires] = useState(profile.expires?.slice(0, 10) || '');
  const [pro, setPro] = useState(!!profile.pro_enabled);
  const [access, setAccess] = useState<ClientAccess>(() => readClientAccess(profile));
  const draft = { ...profile, plan, pro_enabled: pro ? 1 : 0, client_access: access };
  const base = capabilities({ ...draft, client_access: null });
  const visible = clientSections(draft);
  const permittedSections = clientSections({
    ...draft,
    client_access: { ...access, sections: {} },
  });
  const modules = [
    ['catalogue', 'Produits et services', 'المنتجات والخدمات'],
    ['activity', 'Suivi des contacts et demandes', 'تتبّع معلومات التواصل والطلبات'],
    ['appointments', 'Gestion des rendez-vous', 'تدبير المواعيد'],
  ] as const;
  return (
    <details className="panel admin-client-management">
      <summary className="admin-client-summary">
        <span>
          <strong>{JSON.parse(profile.data).name || t('Client', 'زبون')}</strong>
          <small>{profile.email || t('E-mail non renseigné', 'الإيميل ما متسجّلش')}</small>
        </span>
        <span className="badge">{offerLabel(profile.plan, ar)}</span>
        <span>{t('Forfait et accès client', 'الباقة وولوج الزبون')}</span>
      </summary>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave({
            action: 'profile',
            id: profile.id,
            plan,
            state,
            expires,
            pro,
            clientAccess: access,
            expectedSettings: profile.managementRevision || managementRevision(profile),
          });
        }}
      >
        <h3>{t('Forfait et abonnement', 'الباقة والاشتراك')}</h3>
        <div className="form-grid">
          <label className="field">
            {t('Forfait', 'الباقة')}
            <select
              disabled={busy}
              value={plan}
              onChange={(event) => {
                setPlan(event.target.value);
                setAccess({ modules: {}, sections: {} });
              }}
            >
              {[...platformPlans, ...(!isPlatformPlan(profile.plan) ? [profile.plan] : [])].map(
                (value) => (
                  <option key={value} value={value}>
                    {offerLabel(value, ar)}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="field">
            {t('État', 'الحالة')}
            <select
              disabled={busy}
              value={state}
              onChange={(event) => setState(event.target.value)}
            >
              <option value="trial">{t('Essai', 'تجربة')}</option>
              <option value="active">{t('Actif', 'مفعّل')}</option>
              <option value="suspended">{t('Suspendu', 'موقوف')}</option>
            </select>
          </label>
          <label className="field">
            {t('Échéance', 'نهاية الاشتراك')}
            <input
              disabled={busy}
              required={state !== 'suspended'}
              type="date"
              value={expires}
              onChange={(event) => setExpires(event.target.value)}
            />
          </label>
          {!isPlatformPlan(plan) && (
            <label className="toggle">
              <input
                type="checkbox"
                disabled={busy}
                checked={pro}
                onChange={(event) => setPro(event.target.checked)}
              />
              {t('Rendez-vous · ancien forfait', 'المواعيد · باقة قديمة')}
            </label>
          )}
        </div>
        <p className="hint">
          {t(
            'Changer de forfait rétablit ses accès standards. Ajustez-les ci-dessous avant d’enregistrer. Le renouvellement reste à 149 DH/an et conserve ces réglages.',
            'تغيير الباقة كيرجّع الولوج العادي ديالها. عدّل الصلاحيات لتحت قبل التسجيل. التجديد كيبقى بـ149 درهم فالعام وكيحتافظ بهاد الإعدادات.',
          )}
        </p>
        <fieldset disabled={busy} className="admin-access-fieldset">
          <legend>{t('Fonctions autorisées', 'الوظائف المسموحة')}</legend>
          <p className="hint">
            {t(
              'Le forfait détermine les fonctions disponibles. Désactiver une fonction la retire aussi de la carte publique, sans supprimer les données.',
              'الباقة كتحدّد الوظائف المتاحة. توقيف وظيفة كيحيدها حتى من الكارط العمومية بلا حذف المعلومات.',
            )}
          </p>
          {modules.map(([key, fr, da]) => (
            <label key={key} className="toggle">
              <input
                type="checkbox"
                disabled={
                  busy ||
                  !base[key] ||
                  (key === 'appointments' && access.modules.activity === false)
                }
                checked={
                  base[key] &&
                  access.modules[key] !== false &&
                  (key !== 'appointments' || access.modules.activity !== false)
                }
                onChange={(event) =>
                  setAccess((current) => ({
                    ...current,
                    modules: { ...current.modules, [key]: event.target.checked },
                  }))
                }
              />
              <span>
                {t(fr, da)}
                {!base[key] && (
                  <small>{t('Non inclus dans ce forfait', 'ما داخلاش فهاد الباقة')}</small>
                )}
              </span>
            </label>
          ))}
        </fieldset>
        <fieldset disabled={busy} className="admin-access-fieldset">
          <legend>
            {t('Rubriques visibles dans l’espace client', 'الأقسام اللي كيبانو فحساب الزبون')}
          </legend>
          <p className="hint">
            {t(
              'Masquer une rubrique bloque son éditeur et ses actions dans l’espace client. Le contenu déjà publié reste visible. Mon offre reste accessible pour le renouvellement.',
              'إخفاء قسم كيوقف المحرّر والإجراءات ديالو فحساب الزبون. المحتوى المنشور كيبقى ظاهر. قسم العرض كيبقى متاح باش يتجدّد الاشتراك.',
            )}
          </p>
          <div className="admin-access-grid">
            {clientSectionKeys.map((key) => (
              <label className="toggle" key={key}>
                <input
                  type="checkbox"
                  disabled={busy || !permittedSections.includes(key)}
                  checked={visible.includes(key)}
                  onChange={(event) =>
                    setAccess((current) => ({
                      ...current,
                      sections: { ...current.sections, [key]: event.target.checked },
                    }))
                  }
                />
                <span>{clientSectionLabels[key][ar ? 1 : 0]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="admin-client-preview" aria-live="polite">
          <strong>{t('Le client verra :', 'الزبون غادي يشوف:')}</strong>
          <p>
            {[
              ...visible.map((key) => clientSectionLabels[key][ar ? 1 : 0]),
              t('Mon offre', 'العرض ديالي'),
            ].join(' · ')}
          </p>
        </div>
        <div className="catalog-actions">
          <button type="submit" className="primary" disabled={busy}>
            <Save size={16} />
            {t('Enregistrer le forfait et les accès', 'سجّل الباقة والصلاحيات')}
          </button>
          <button
            className="secondary"
            type="button"
            disabled={busy}
            onClick={() => setAccess({ modules: {}, sections: {} })}
          >
            <RotateCcw size={16} />
            {t('Rétablir les accès du forfait', 'رجّع صلاحيات الباقة')}
          </button>
        </div>
        <p className="hint">
          {t(
            'Les changements seront visibles à la prochaine actualisation de l’espace client. Pour un paiement, utilisez Commandes → Paiement confirmé → Activer ou renouveler.',
            'التغييرات غادي تبان ملي يتعاود تحميل حساب الزبون. للأداء استعمل الطلبات ← تأكيد الأداء ← التفعيل ولا التجديد.',
          )}
        </p>
      </form>
    </details>
  );
}
