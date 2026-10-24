'use client';
import { Globe, Users } from 'lucide-react';
import { accountPath } from './lib/journey-links';
import ThemeToggle from './theme-toggle';

export default function SiteHeader({
  ar,
  view,
  t,
  toggleLanguage,
  sessionChecked,
  auth,
  loaded,
  authLoading,
  canAdmin,
  accountEmail,
  busy,
  logout,
}: {
  ar: boolean;
  view: string;
  t: (fr: string, da: string) => string;
  toggleLanguage: () => void;
  sessionChecked: boolean;
  auth: boolean;
  loaded: boolean;
  authLoading: boolean;
  canAdmin: boolean;
  accountEmail: string;
  busy: boolean;
  logout: () => Promise<void>;
}) {
  return (
    <header>
      <a className="brand" dir="ltr" href={'/?lang=' + (ar ? 'ar' : 'fr')}>
        <span className="brand-icon">
          <svg width="25" height="25" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path
              d="M23 17h-5a10 10 0 0 0-10 10v10a10 10 0 0 0 10 10h11M41 17h5a10 10 0 0 1 10 10v10a10 10 0 0 1-10 10H35M24 38l16-12"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </svg>
        </span>
        Sora<span>Link</span>
      </a>
      {(view === 'home' || view === 'pricing') && (
        <nav aria-label={t('Navigation principale', 'التنقل الرئيسي')}>
          {[
            ['fonctionnalites', 'En bref', 'باختصار'],
            ['tarifs', 'Tarifs', 'الأثمنة'],
            ['exemples', 'Démo', 'مثال'],
            ['faq', 'FAQ', 'أسئلة'],
          ].map(([anchor, f, a]) => (
            <a
              href={
                anchor === 'exemples'
                  ? '/demo' + (ar ? '?lang=ar' : '')
                  : '/?lang=' + (ar ? 'ar' : 'fr') + '#' + anchor
              }
              key={anchor}
            >
              {t(f, a)}
            </a>
          ))}
        </nav>
      )}
      <div className="header-actions">
        <ThemeToggle ar={ar} />
        <button className="language" onClick={toggleLanguage}>
          <Globe size={16} />
          {ar ? 'FR' : 'العربية'}
        </button>
        {(!sessionChecked && !auth) || (view === 'app' && (!loaded || authLoading) && !auth) ? (
          <span className="header-login" role="status">
            {t('Vérification…', 'كنتحققو…')}
          </span>
        ) : auth ? (
          <>
            {canAdmin && (
              <a className="header-login" href={accountPath(canAdmin, ar)}>
                {t('Administration', 'الإدارة')}
              </a>
            )}
            <details className="account-menu">
              <summary aria-label={t('Compte connecté', 'الحساب اللي داخل')}>
                <span className="account-status-dot" />
                <Users size={16} />
                <span>{t('Mon compte', 'الحساب')}</span>
              </summary>
              <div className="account-menu-panel">
                <strong>{t('Connecté avec', 'داخل بـ')}</strong>
                <span dir="ltr" className="account-email">
                  {accountEmail || t('Votre compte', 'الحساب ديالك')}
                </span>
                {(canAdmin || view !== 'app') && (
                  <a href={accountPath(canAdmin, ar)}>
                    {canAdmin
                      ? t('Ouvrir l’administration', 'حل الإدارة')
                      : t('Ouvrir mon espace', 'حل الحساب ديالي')}
                  </a>
                )}
                <button disabled={busy} onClick={logout}>
                  {t('Se déconnecter', 'خرج من الحساب')}
                </button>
              </div>
            </details>
          </>
        ) : (
          <a className="header-login" href={'/auth?mode=login' + (ar ? '&lang=ar' : '')}>
            {t('Connexion', 'الدخول')}
          </a>
        )}
        {view === 'home' && sessionChecked && !canAdmin && !auth && (
          <a
            className="primary small header-start"
            href={'/auth?mode=signup' + (ar ? '&lang=ar' : '')}
          >
            {t('Créer ma carte', 'صايب الكارط')}
          </a>
        )}
      </div>
    </header>
  );
}
