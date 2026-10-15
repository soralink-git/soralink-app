'use client';
import { useState, useEffect } from 'react';
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
    [visible, setVisible] = useState(false);
  const offer = selectedPlan(initialOffer);
  const t = (f: string, a: string) => (ar ? a : f);
  useEffect(() => {
    document.documentElement.lang = ar ? 'ar' : 'fr';
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
  }, [ar]);
  function toggleLanguage() {
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
        <button className="language" onClick={toggleLanguage}>
          <Globe size={17} />
          {ar ? 'Français' : 'العربية'}
        </button>
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
                  'Personnalisez votre page, partagez vos contenus et retrouvez vos demandes au même endroit.',
                  'خصّص الصفحة ديالك، شارك المحتوى ولقى الطلبات فبلاصة وحدة.',
                )}
              </p>
              <ul className="auth-benefits">
                {[
                  t('Une carte qui évolue avec vous', 'كارط كتتبدّل معاك'),
                  t('Vos photos et votre catalogue', 'التصاور والكاتالوگ ديالك'),
                  t('Vos demandes et vos rendez-vous', 'الطلبات والمواعيد ديالك'),
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
          <form key={mode} onSubmit={submit}>
            {mode !== 'password' && (
              <label className="field">
                {t('Adresse e-mail', 'الإيميل')}
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
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
                      required
                      minLength={mode === 'login' ? 1 : 10}
                      maxLength={128}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setVisible(!visible)}
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
                  <label className="field">
                    {t('Confirmer le mot de passe', 'عاود كلمة السر')}
                    <input
                      type={visible ? 'text' : 'password'}
                      name="confirm"
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
              <button type="button" className="text-button" onClick={() => change('reset')}>
                {t('Mot de passe oublié ?', 'نسيت كلمة السر؟')}
              </button>
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
                  <button className="text-button" onClick={() => change('signup')}>
                    {t('Créer un compte', 'صايب حساب')}
                  </button>
                </>
              ) : (
                <button className="text-button" onClick={() => change('login')}>
                  {t('J’ai déjà un compte — Se connecter', 'عندي حساب — ندخل')}
                </button>
              )}
            </div>
          )}
          {mode === 'signup' && (
            <button className="text-button" onClick={() => change('resend')}>
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
