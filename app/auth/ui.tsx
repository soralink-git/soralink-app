'use client';
import ThemeToggle from '../theme-toggle';
import { useState, useEffect, useId } from 'react';
import { REMEMBERED_EMAIL_KEY } from '../lib/idle-policy';
import { workspacePath, selectedPlan, offerLabel } from '../lib/journey-links';
import { Nfc, Globe, Mail, Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
export default function Auth({
  administrator = false,
  reset = false,
  initialMode = 'login',
  initialArabic = false,
  initialOffer,
}: {
  administrator?: boolean;
  reset?: boolean;
  initialMode?: 'signup' | 'login';
  initialArabic?: boolean;
  initialOffer?: string;
}) {
  const [ar, setAr] = useState(initialArabic),
    [mode, setMode] = useState(reset ? 'password' : initialMode),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [visible, setVisible] = useState(false),
    [rememberEmail, setRememberEmail] = useState(false),
    [savedEmail, setSavedEmail] = useState(''),
    [expired, setExpired] = useState(false);
  const offer = selectedPlan(initialOffer);
  const passwordHintId = useId();
  const t = (f: string, a: string) => (ar ? a : f);
  useEffect(() => {
    document.documentElement.lang = ar ? 'ar' : 'fr';
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
  }, [ar]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
      setSavedEmail(saved);
      setRememberEmail(!!saved);
    } catch {}
    setExpired(new URLSearchParams(location.search).get('expired') === '1');
  }, []);
  function toggleLanguage() {
    if (busy) return;
    const next = !ar;
    setAr(next);
    const url = new URL(location.href);
    url.searchParams.set('lang', next ? 'ar' : 'fr');
    history.replaceState(null, '', url.pathname + url.search);
    setMessage('');
    setError('');
  }
  useEffect(() => {
    if (!administrator && !reset && new URLSearchParams(location.search).get('mode') === 'signup')
      setMode('signup');
    if (new URLSearchParams(location.search).get('lang') === 'ar') setAr(true);
    if (new URLSearchParams(location.search).has('error'))
      setError(
        t(
          'Lien expiré ou ouvert dans un autre navigateur. Demandez un nouveau lien et ouvrez-le dans ce navigateur.',
          'الرابط سالات المدة ديالو ولا تحل فمتصفح آخر. طلب رابط جديد وحلّو فنفس المتصفح.',
        ),
      );
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get('password') || '');
    if (['signup', 'password'].includes(mode) && password !== f.get('confirm')) {
      setError(t('Les mots de passe ne correspondent pas.', 'كلمات السر ماشي بحال بحال.'));
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          email: f.get('email'),
          password,
          lang: ar ? 'ar' : 'fr',
          offer,
        }),
      });
      const b: any = await r.json();
      if (!r.ok) throw new Error(ar ? b.errorAr || 'الخدمة ما متوفراش. عاود جرّب.' : b.error);
      if (b.redirect) {
        if (mode === 'login') {
          try {
            if (rememberEmail)
              localStorage.setItem(REMEMBERED_EMAIL_KEY, String(f.get('email') || '').trim());
            else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
          } catch {}
        }
        location.assign(b.redirect);
        return;
      }
      setMessage(ar ? b.messageAr || 'تمّ الطلب.' : b.message);
      if (mode === 'password') setTimeout(() => location.assign(workspacePath(ar, offer)), 1200);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function change(v: string) {
    if (busy) return;
    setMode(v);
    setError('');
    setMessage('');
    const u = new URL(location.href);
    if (v === 'signup') u.searchParams.set('mode', 'signup');
    else u.searchParams.delete('mode');
    history.replaceState(null, '', u.pathname + u.search);
  }
  return (
    <div className="site" dir={ar ? 'rtl' : 'ltr'}>
      <header>
        <a className="brand" dir="ltr" href={'/?lang=' + (ar ? 'ar' : 'fr')}>
          <span className="brand-icon">
            <Nfc size={23} />
          </span>
          Sora<span>Link</span>
        </a>
        <div className="header-actions">
          <ThemeToggle ar={ar} />
          <button className="language" disabled={busy} onClick={toggleLanguage}>
            <Globe size={17} />
            {ar ? 'Français' : 'العربية'}
          </button>
        </div>
      </header>
      <main className="auth-layout">
        <section className="auth-intro">
          <span className="eyebrow">
            SORALINK /{' '}
            {administrator ? t('ADMINISTRATION', 'الإدارة') : t('VOTRE ESPACE', 'الحساب ديالك')}
          </span>
          {administrator ? (
            <>
              <h1>{t('Gérer SoraLink', 'تسيير SoraLink')}</h1>
              <p>
                {t(
                  'Un accès réservé à la gestion des clients, des forfaits et des commandes. Aucune carte ni aucun abonnement client n’est nécessaire.',
                  'ولوج خاص بتسيير الزبناء والعروض والطلبات. ما محتاج لا كارط لا اشتراك ديال الزبناء.',
                )}
              </p>
            </>
          ) : (
            <>
              <h1>
                {t('Votre carte.', 'الكارط ديالك.')}
                <br />
                {t('Votre activité.', 'النشاط ديالك.')}
                <br />
                <em>{t('Votre espace.', 'الحساب ديالك.')}</em>
              </h1>
              <p>
                {t(
                  'Créez votre carte et partagez-la. Ajoutez le catalogue ou le suivi client selon votre pack.',
                  'صايب الكارط ديالك وشاركها. زيد الكاتالوگ ولا تتبّع الزبناء حسب الباقة.',
                )}
              </p>
              <ul className="auth-benefits">
                {[
                  t('Une carte qui évolue avec vous', 'كارط كتتبدّل معاك'),
                  t('Des fonctions selon votre pack', 'وظائف على حساب الباقة ديالك'),
                  t('Modifications incluses avec l’abonnement', 'التعديلات داخلة فالاشتراك'),
                ].map((v) => (
                  <li key={v}>
                    <CheckCircle size={18} />
                    {v}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        <section className="panel auth-panel">
          <h2>
            {mode === 'signup'
              ? t('Créer mon compte', 'صايب الحساب ديالي')
              : mode === 'reset'
                ? t('Mot de passe oublié', 'نسيت كلمة السر')
                : mode === 'password'
                  ? t('Nouveau mot de passe', 'كلمة سر جديدة')
                  : mode === 'resend'
                    ? t('Renvoyer la confirmation', 'عاود سيفط التأكيد')
                    : administrator
                      ? t('Connexion administrateur', 'دخول الإدارة')
                      : t('Bienvenue chez SoraLink', 'مرحبا بيك فـ SoraLink')}
          </h2>
          <p className="hint">
            {mode === 'signup'
              ? t(
                  'Créez votre compte, confirmez votre e-mail, puis complétez votre carte.',
                  'صايب الحساب، أكّد الإيميل ومن بعد عمّر الكارط ديالك.',
                )
              : mode === 'reset'
                ? t(
                    'Recevez un lien pour choisir un nouveau mot de passe.',
                    'توصّل برابط باش تختار كلمة سر جديدة.',
                  )
                : mode === 'password'
                  ? t('Choisissez au moins 10 caractères.', 'اختار على الأقل 10 حروف ورموز.')
                  : administrator
                    ? t(
                        'Utilisez le compte autorisé pour l’administration.',
                        'استعمل الحساب المسموح ليه بالإدارة.',
                      )
                    : t('Accédez à votre carte et à vos demandes.', 'دخل للكارط والطلبات ديالك.')}
          </p>
          {expired && (
            <p className="hint" role="status">
              {t(
                'Votre session a expiré après 15 minutes d’inactivité. Reconnectez-vous.',
                'سالات مدة الدخول من بعد 15 دقيقة بلا استعمال. عاود دخل للحساب.',
              )}
            </p>
          )}
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="auth-success" role="status">
              {message}
              <p className="hint">
                {t(
                  'Pour les liens reçus, gardez le même navigateur. Pensez au dossier indésirables.',
                  'حل الرابط فنفس المتصفح وشوف حتى الرسائل المزعجة.',
                )}
              </p>
            </div>
          )}
          {offer && (
            <p className="hint">
              {t('Offre choisie : ', 'العرض اللي اخترتي: ')}
              <strong>{offerLabel(offer, ar)}</strong>
            </p>
          )}
          <form key={mode} onSubmit={submit} autoComplete="on" aria-busy={busy}>
            {mode !== 'password' && (
              <label className="field">
                {t('Adresse e-mail', 'الإيميل')}
                <input
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  dir="ltr"
                  disabled={busy}
                  name="email"
                  autoComplete={mode === 'login' ? 'username' : 'email'}
                  defaultValue={mode === 'login' ? savedEmail : undefined}
                  key={mode === 'login' ? savedEmail : mode}
                  required
                  maxLength={254}
                  placeholder="vous@exemple.ma"
                />
              </label>
            )}
            {['login', 'signup', 'password'].includes(mode) && (
              <>
                <label className="field">
                  {t('Mot de passe', 'كلمة السر')}
                  <div className="password-field">
                    <input
                      type={visible ? 'text' : 'password'}
                      name="password"
                      aria-label={t('Mot de passe', 'كلمة السر')}
                      disabled={busy}
                      aria-describedby={mode !== 'login' ? passwordHintId : undefined}
                      required
                      minLength={mode === 'login' ? 1 : 10}
                      maxLength={128}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setVisible(!visible)}
                      disabled={busy}
                      aria-pressed={visible}
                      aria-label={
                        visible
                          ? t('Masquer le mot de passe', 'خبّي كلمة السر')
                          : t('Afficher le mot de passe', 'بيّن كلمة السر')
                      }
                    >
                      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
                {mode !== 'login' && (
                  <p className="hint" id={passwordHintId}>
                    {t('Au moins 10 caractères.', 'على الأقل 10 حروف ورموز.')}
                  </p>
                )}
                {mode !== 'login' && (
                  <label className="field">
                    {t('Confirmer le mot de passe', 'عاود كلمة السر')}
                    <input
                      type={visible ? 'text' : 'password'}
                      name="confirm"
                      disabled={busy}
                      aria-describedby={passwordHintId}
                      required
                      minLength={10}
                      maxLength={128}
                      autoComplete="new-password"
                    />
                  </label>
                )}
              </>
            )}
            {mode === 'login' && (
              <>
                <label className="auth-remember">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    disabled={busy}
                    onChange={(e) => {
                      setRememberEmail(e.target.checked);
                      if (!e.target.checked) {
                        try {
                          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
                        } catch {}
                      }
                    }}
                  />
                  {t(
                    'Mémoriser mon adresse e-mail sur cet appareil',
                    'تذكّر الإيميل ديالي فهاد الجهاز',
                  )}
                </label>
                <p className="hint">
                  {t(
                    'Pour mémoriser le mot de passe, acceptez la proposition de votre navigateur. Déconnexion après 15 minutes d’inactivité.',
                    'باش تحفظ كلمة السر، وافق على الاقتراح ديال المتصفح. كيسالي الدخول من بعد 15 دقيقة بلا استعمال.',
                  )}
                </p>
                <button
                  type="button"
                  className="text-button"
                  disabled={busy}
                  onClick={() => change('reset')}
                >
                  {t('Mot de passe oublié ?', 'نسيت كلمة السر؟')}
                </button>
              </>
            )}
            <button className="primary full" disabled={busy}>
              {busy
                ? t('Veuillez patienter…', 'تسنى شوية…')
                : mode === 'signup'
                  ? t('Créer mon compte', 'صايب الحساب')
                  : mode === 'password'
                    ? t('Enregistrer le mot de passe', 'سجّل كلمة السر')
                    : ['reset', 'resend'].includes(mode)
                      ? t('Envoyer le lien', 'سيفط الرابط')
                      : t('Se connecter', 'دخل للحساب')}
            </button>
          </form>
          {(!administrator || mode !== 'login') && (
            <div className="auth-switch">
              {mode === 'login' ? (
                <>
                  {t('Pas encore de compte ?', 'ما عندكش حساب؟')}{' '}
                  <button className="text-button" disabled={busy} onClick={() => change('signup')}>
                    {t('Créer un compte', 'صايب حساب')}
                  </button>
                </>
              ) : (
                <button className="text-button" disabled={busy} onClick={() => change('login')}>
                  {t('J’ai déjà un compte — Se connecter', 'عندي حساب — ندخل')}
                </button>
              )}
            </div>
          )}
          {mode === 'signup' && (
            <button className="text-button" disabled={busy} onClick={() => change('resend')}>
              {t('Renvoyer l’e-mail de confirmation', 'عاود سيفط إيميل التأكيد')}
            </button>
          )}
          {!administrator && (
            <p className="hint">
              {t(
                'Vos coordonnées privées et vos demandes restent dans votre espace.',
                'المعلومات الخاصة والطلبات ديالك كيبقاو فالحساب ديالك.',
              )}
            </p>
          )}
          {administrator && (
            <a className="text-button" href={'/auth?lang=' + (ar ? 'ar' : 'fr')}>
              {t('Connexion à un compte client', 'الدخول لحساب زبون')}
            </a>
          )}
          {!administrator && (
            <p className="hint">
              {t(
                'Vous aviez une ancienne carte ? Contactez l’assistance pour une récupération vérifiée.',
                'كانت عندك كارط قديمة؟ تواصل مع المساعدة باش نتحققو ونرجعو ليك الولوج.',
              )}{' '}
              <a href="https://wa.me/212661446664" target="_blank" rel="noreferrer">
                {t('Contacter l’assistance', 'تواصل مع المساعدة')}
              </a>
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
