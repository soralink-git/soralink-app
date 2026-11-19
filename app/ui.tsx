'use client';
import SiteHeader from './site-header';

import { X } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { WhatsAppIcon } from './card-helpers';
import CardView, { type CardViewProps } from './card-view';
import ImageCropper from './image-cropper';
import { BRAND } from './lib/brand';
import { compressPhoto, MAX_SOURCE_PHOTO_BYTES } from './lib/compress-photo';
import type { CropTarget } from './lib/crop-geometry';
import { languagePath, offerLabel, selectedPlan, workspacePath } from './lib/journey-links';
import { appendUnique, type History, type PageInfo } from './lib/pagination';
import { profileName } from './lib/profile-identity';
import SiteFooter from './site-footer';
import useCardAutosave from './use-card-autosave';

import LandingPage from './landing-page';
import ManualAppointmentModal from './manual-appointment-modal';
import { normalizeCatalogue } from './lib/catalogue';
import { appearance } from './lib/personalization';
import { normalizePromotions } from './lib/promotions';
import { defaults } from './lib/schedule';
const DashboardEditor = lazy(() => import('./dashboard-editor'));
const blank = {
  promotions: [] as any[],
  name: '',
  profileType: 'person',
  job: '',
  business: '',
  bio: '',
  phone: '',
  email: '',
  address: '',
  whatsapp: '',
  website: '',
  instagram: '',
  facebook: '',
  linkedin: '',
  tiktok: '',
  youtube: '',
  x: '',
  mapsUrl: '',
  mapDestination: '',
  color: BRAND.orange,
  template: 'Professionnel',
  cardTheme: 'dark',
  buttonShape: 'pill',
  fondColor: '',
  blockColor: '',
  buttonColor: '',
  textColor: '',
  services: [] as any[],
  photos: [] as string[],
  pdf: '',
  video: '',
  recordedVideo: '',
  avatar: '',
  cover: '',
  backgroundPhoto: '',
  backgroundOpacity: 35,
  defaultLanguage: 'fr',
  pro: false,
  ...defaults,
};

const VALID_DASHBOARD_TABS = new Set([
  'coordinates',
  'content',
  'actions',
  'links',
  'interface',
  'contacts',
  'requests',
  'schedule',
  'share',
  'orders',
  'profile',
  'sections',
  'catalogue',
  'promotions',
  'media',
]);

export default function App({
  workspaceMode = false,
  initialTab,
  initialArabic = false,
  initialOffer,
}: {
  workspaceMode?: boolean;
  initialTab?: string;
  initialArabic?: boolean;
  initialOffer?: string;
}) {
  const [ar, setAr] = useState(initialArabic),
    [view, setView] = useState(workspaceMode ? 'app' : 'home'),
    [tab, setTab] = useState(
      initialTab && VALID_DASHBOARD_TABS.has(initialTab) ? initialTab : 'coordinates',
    ),
    [data, setData] = useState<any>(blank),
    [published, setPublished] = useState(false),
    [id, setId] = useState(''),
    [publicName, setPublicName] = useState(''),
    [inbox, setInbox] = useState<any[]>([]),
    [orders, setOrders] = useState<any[]>([]),
    [msg, setMsg] = useState(''),
    [busy, setBusy] = useState(false),
    [modal, setModal] = useState(''),
    [loaded, setLoaded] = useState(false),
    [auth, setAuth] = useState(false),
    [canAdmin, setCanAdmin] = useState(false),
    [subscription, setSubscription] = useState<any>(null),
    [serviceIndex, setServiceIndex] = useState(0);
  const [cards, setCards] = useState<any[]>([]);
  const [cardLimit, setCardLimit] = useState(1);
  const [cardsCount, setCardsCount] = useState(1);
  const [activeCardId, setActiveCardId] = useState<string>('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [storage, setStorage] = useState<any>(null);
  const [accountEmail, setAccountEmail] = useState(''),
    [sessionChecked, setSessionChecked] = useState(false);
  const [pendingOffer, setPendingOffer] = useState(selectedPlan(initialOffer));
  const authEpoch = useRef(0);
  const [catalogWorking, setCatalogWorking] = useState(false);
  const [authLoading, setAuthLoading] = useState(false),
    [authLoadError, setAuthLoadError] = useState(false);
  const [crop, setCrop] = useState<{
    source: File | string;
    target: CropTarget;
    previousValue?: string;
  } | null>(null);
  const autosave = useCardAutosave({
    id,
    data,
    published,
    ar,
    enabled: view === 'app' && auth && loaded && !authLoading,
    paused: busy || catalogWorking || !!crop,
    onSaved: (result) => {
      setId(result.id);
      setActiveCardId(result.id);
      setCards((prev) =>
        prev.map((c) =>
          c.id === result.id ? { ...c, name: profileName(data) || c.name, published } : c,
        ),
      );
      if (result.cleanupPending)
        setMsg(
          ar ? 'تنظيف التخزين غادي يتعاود من بعد.' : 'Le nettoyage du stockage sera réessayé.',
        );
      void loadStorage();
    },
  });
  const saveErrorNotice = useRef('');
  useEffect(() => {
    const status = autosave.state.status;
    if (status === 'saved' && saveErrorNotice.current) {
      const previous = saveErrorNotice.current;
      saveErrorNotice.current = '';
      setMsg((current) => (current === previous ? '' : current));
      return;
    }
    if (!['invalid', 'offline', 'error', 'conflict'].includes(status)) return;
    const fallback = ar
      ? 'ما قدرناش نسجّلو التغييرات. تحقق من المعلومات والاتصال وعاود جرّب.'
      : 'Les modifications ne sont pas enregistrées. Vérifiez les champs et la connexion puis réessayez.';
    saveErrorNotice.current = autosave.state.error || fallback;
    setMsg(saveErrorNotice.current);
  }, [autosave.state.status, autosave.state.error, ar]);

  useEffect(() => {
    if (!msg) return;
    if (autosave.state.status === 'conflict') return;
    const isProgress =
      msg.includes('Enregistrement automatique') ||
      msg.includes('التسجيل التلقائي') ||
      msg.includes('Demande enregistrée') ||
      msg.includes('الطلب تسجل') ||
      msg.includes('ajouté') ||
      msg.includes('ajoutée') ||
      msg.includes('تزّاد');
    const delay = isProgress ? 3500 : 5000;
    const timer = setTimeout(() => {
      setMsg('');
    }, delay);
    return () => clearTimeout(timer);
  }, [msg, autosave.state.status]);

  useEffect(() => {
    if (
      autosave.state.status === 'saved' &&
      msg &&
      (msg.includes('Enregistrement automatique') || msg.includes('التسجيل التلقائي'))
    ) {
      const timer = setTimeout(() => setMsg(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [autosave.state.status, msg]);
  const [rawSources, setRawSources] = useState<{
    avatar?: File | string;
    cover?: File | string;
    backgroundPhoto?: File | string;
  }>({});
  function startCrop(source: File | string, target: CropTarget) {
    if (busy) return;
    if (
      typeof source !== 'string' &&
      (!['image/jpeg', 'image/png', 'image/webp'].includes(source.type) ||
        source.size > MAX_SOURCE_PHOTO_BYTES)
    ) {
      setMsg(t('JPG, PNG ou WebP : maximum 40 Mo.', 'JPG، PNG ولا WebP: حتى 40 Mo.'));
      return;
    }
    if (typeof source !== 'string') {
      setRawSources((prev) => ({ ...prev, [target]: source }));
    }
    setCrop({ source, target, previousValue: data[target] || '' });
  }
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTab = urlParams.get('tab');
      const hashTab = window.location.hash.replace(/^#/, '');
      const savedTab = localStorage.getItem('soralink_dashboard_tab');
      const candidate =
        (urlTab && VALID_DASHBOARD_TABS.has(urlTab) ? urlTab : null) ||
        (hashTab && VALID_DASHBOARD_TABS.has(hashTab) ? hashTab : null) ||
        (savedTab && VALID_DASHBOARD_TABS.has(savedTab) ? savedTab : null);
      if (candidate && candidate !== tab) {
        setTab(candidate);
      }
    } catch {}
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!VALID_DASHBOARD_TABS.has(tab)) return;
    try {
      localStorage.setItem('soralink_dashboard_tab', tab);
      const url = new URL(window.location.href);
      if (url.searchParams.has('app') || view === 'app') {
        if (url.searchParams.get('tab') !== tab) {
          url.searchParams.set('app', '1');
          url.searchParams.set('tab', tab);
          window.history.replaceState(null, '', url.pathname + url.search + url.hash);
        }
      }
    } catch {}
  }, [tab, view]);
  useEffect(() => {
    const handlePopState = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlTab = urlParams.get('tab');
        if (urlTab && VALID_DASHBOARD_TABS.has(urlTab)) {
          setTab(urlTab);
        }
      } catch {}
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [notifications, setNotifications] = useState<any[]>([]),
    [mailConfigured, setMailConfigured] = useState(false);
  const uploadLock = useRef(false);
  const t = (fr: string, da: string) => (ar ? da : fr);
  async function checkSession() {
    const epoch = ++authEpoch.current;
    try {
      const r = await fetch('/api/auth', { cache: 'no-store' });
      if (!r.ok) throw new Error();
      const b = (await r.json()) as { authenticated?: boolean; email?: unknown; admin?: boolean };
      if (epoch !== authEpoch.current) return;
      setAuth(b.authenticated === true);
      setCanAdmin(b.admin === true);
      setAccountEmail(b.authenticated === true && typeof b.email === 'string' ? b.email : '');
      setSessionChecked(true);
    } catch {
      if (epoch === authEpoch.current) setSessionChecked(true);
    }
  }
  async function logout() {
    if (
      autosave.queue.isDirty() &&
      !(await autosave.queue.flush()) &&
      !window.confirm(
        t(
          'Des modifications ne sont pas enregistrées. Les abandonner et vous déconnecter ?',
          'كاينين تغييرات ما تسجلوش. واش بغيتي تخرج وتخلّيهم؟',
        ),
      )
    )
      return;
    autosave.queue.stop();
    autosave.ownerRef.current = null;
    authEpoch.current++;
    setBusy(true);
    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      if (!r.ok) throw new Error();
      setAuth(false);
      setAccountEmail('');
      setSessionChecked(true);
      location.assign('/');
    } catch {
      await load('login', true);
      setMsg(t('Déconnexion impossible. Réessayez.', 'ما تخرجش الحساب. عاود حاول.'));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (view === 'app') return;
    void checkSession();
    const refresh = () => {
      if (document.visibilityState === 'visible') void checkSession();
    };
    document.addEventListener('visibilitychange', refresh);
    return () => {
      authEpoch.current++;
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [view]);
  async function loadStorage() {
    try {
      const r = await fetch('/api/upload?stats=1');
      if (r.ok) setStorage(await r.json());
    } catch {}
  }
  useEffect(() => {
    if (auth && (tab === 'media' || tab === 'content')) void loadStorage();
  }, [auth, tab]);
  function toggleLanguage() {
    const nextAr = !ar;
    setAr(nextAr);
    history.replaceState(null, '', languagePath(location.href, nextAr));
    setData((d: any) => ({ ...d, defaultLanguage: nextAr ? 'ar' : 'fr' }));
  }
  useEffect(() => {
    if (new URLSearchParams(location.search).get('lang') === 'ar') setAr(true);
  }, []);
  useEffect(() => {
    document.documentElement.lang = ar ? 'ar' : 'fr';
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
  }, [ar]);
  useEffect(() => {
    if (
      new URLSearchParams(location.search).has('app') ||
      new URLSearchParams(location.search).has('tab')
    ) {
      setView('app');
      load();
    }
  }, []);
  const [historyPages, setHistoryPages] = useState<Partial<Record<History, PageInfo>>>({});
  const [historyBusy, setHistoryBusy] = useState(false);
  const historyEpoch = useRef(0);
  const historyLock = useRef(false);
  async function loadMoreHistory(kind: History) {
    const cursor = historyPages[kind]?.nextCursor;
    if (!cursor || historyLock.current || busy) return;
    const epoch = historyEpoch.current;
    historyLock.current = true;
    setHistoryBusy(true);
    try {
      const query = new URLSearchParams({ history: kind, cursor });
      if (activeCardId) query.set('cardId', activeCardId);
      const response = await fetch('/api/data?' + query);
      const page: any = await response.json();
      if (epoch !== historyEpoch.current) return;
      if (!response.ok)
        throw new Error(t('Chargement impossible. Réessayez.', 'ما تحمّلاتش اللائحة. عاود جرّب.'));
      if (kind === 'requests') {
        setInbox((items) => appendUnique(items, page.items));
        setNotifications((items) => appendUnique(items, page.notifications || []));
      } else if (kind === 'contacts') setContacts((items) => appendUnique(items, page.items));
      else setOrders((items) => appendUnique(items, page.items));
      setHistoryPages((pages) => ({ ...pages, [kind]: { nextCursor: page.nextCursor } }));
    } catch (error: any) {
      if (epoch === historyEpoch.current) setMsg(error.message);
    } finally {
      historyLock.current = false;
      setHistoryBusy(false);
    }
  }
  async function load(authMode = 'login', discard = false, targetCardId?: string) {
    if (!discard && autosave.queue.isDirty() && !(await autosave.queue.flush())) {
      setMsg(
        t(
          'Enregistrez les modifications ou rechargez la version enregistrée.',
          'سجّل التغييرات ولا عاود حمّل النسخة المسجّلة.',
        ),
      );
      return;
    }
    autosave.queue.pause(true);
    historyEpoch.current++;
    const epoch = ++authEpoch.current;
    setBusy(true);
    setAuthLoading(true);
    setAuthLoadError(false);
    try {
      const cardToLoad = targetCardId !== undefined ? targetCardId : activeCardId;
      const url = cardToLoad ? `/api/data?cardId=${encodeURIComponent(cardToLoad)}` : '/api/data';
      const r = await fetch(url);
      const b: any = await r.json();
      if (epoch !== authEpoch.current) return;
      if (r.status === 401) {
        setAuth(false);
        setAccountEmail('');
        setSessionChecked(true);
        location.assign(
          '/auth?mode=' +
            authMode +
            (ar ? '&lang=ar' : '') +
            (pendingOffer ? '&offer=' + pendingOffer : ''),
        );
        return;
      } else if (!r.ok) {
        setAuthLoadError(true);
        setSessionChecked(true);
        setMsg(ar ? b.errorAr || 'الخدمة ما متوفراش. عاود جرّب.' : b.error);
      } else {
        setAuth(true);
        setAccountEmail(typeof b.email === 'string' ? b.email : b.profile?.email || '');
        setSessionChecked(true);
        setCanAdmin(!!b.admin);
        setSubscription(b.profile);
        setCards(b.cards || []);
        setCardLimit(b.cardLimit ?? 1);
        setCardsCount(b.cardsCount ?? (b.cards?.length || 1));

        if (!autosave.queue.isDirty() || discard) {
          autosave.ownerRef.current = b.saveOwner || null;
          if (b.profile) {
            const profileData = JSON.parse(b.profile.data);
            const hasQueryLang = new URLSearchParams(location.search).has('lang');
            const nextAr = hasQueryLang
              ? ar
              : profileData.defaultLanguage === 'ar' || profileData.lang === 'ar';
            if (!hasQueryLang) setAr(nextAr);
            const hydrated = {
              ...blank,
              ...profileData,
              defaultLanguage: nextAr ? 'ar' : 'fr',
              promotions: normalizePromotions(profileData.promotions),
              services: normalizeCatalogue(profileData.services),
            };
            autosave.queue.reset(
              { data: hydrated, published: !!b.profile.published },
              b.profile.updated || null,
              true,
            );
            setData(hydrated);
            setPublished(!!b.profile.published);
            setId(b.profile.id);
            setActiveCardId(b.profile.id);
            setPublicName(b.profile.publicName || '');
          } else {
            autosave.queue.reset(
              { data: { ...data, defaultLanguage: ar ? 'ar' : 'fr' }, published: false },
              null,
              false,
            );
          }
        }
        setHistoryPages(b.pages || {});
        setInbox(b.requests);
        setContacts(b.contacts || []);
        setNotifications(b.notifications || []);
        setMailConfigured(!!b.mailConfigured);
        setOrders(b.orders);
        setMsg('');
      }
    } catch {
      if (epoch !== authEpoch.current) return;
      setAuthLoadError(true);
      setSessionChecked(true);
      setMsg(t('Service indisponible. Réessayez.', 'الخدمة ما متوفراش. عاود جرّب.'));
    }
    setBusy(false);
    setAuthLoading(false);
    setLoaded(true);
  }
  async function switchCard(nextCardId: string) {
    if (!nextCardId || nextCardId === id) return;
    if (autosave.queue.isDirty()) {
      const flushed = await autosave.queue.flush();
      if (!flushed) {
        const confirmDiscard = window.confirm(
          t(
            'Des modifications non enregistrées sont en cours. Voulez-vous continuer et abandonner ces modifications ?',
            'كاينين تعديلات ما تسجلوش. واش متأكد باغي تكمّل وتتراجع عليهم؟',
          ),
        );
        if (!confirmDiscard) return;
      }
    }
    await load('login', true, nextCardId);
  }
  async function createCard(name?: string) {
    if (cardsCount >= cardLimit)
      throw new Error(
        t(
          `Limite de ${cardLimit} carte(s) atteinte pour votre forfait. Contactez l'administrateur pour en ajouter.`,
          `وصلتي للحد الأقصى ديال ${cardLimit} بطاقة المسموحة فهاد الباقة. تواصل مع الإدارة باش تزيد.`,
        ),
      );
    if (autosave.queue.isDirty() && !(await autosave.queue.flush()))
      throw new Error(
        t(
          'Enregistrez la carte actuelle avant d’en créer une autre.',
          'سجّل الكارط الحالية قبل ما تزيد وحدة أخرى.',
        ),
      );
    setBusy(true);
    try {
      const res = await action({ action: 'createCard', name: name?.trim() || undefined });
      if (!res?.ok || !res.id)
        throw new Error(
          t('Impossible de créer la carte. Réessayez.', 'ما قدرناش نصايبو الكارط. عاود جرّب.'),
        );
      setMsg(t('Nouvelle carte créée avec succès !', 'تم إنشاء البطاقة الجديدة بنجاح !'));
      await load('login', true, res.id);
    } finally {
      setBusy(false);
    }
  }
  async function action(body: any) {
    setBusy(true);
    try {
      const r = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          ['manual', 'status', 'deleteContact'].includes(body.action)
            ? { ...body, cardId: activeCardId || undefined }
            : body,
        ),
      });
      const b: any = await r.json();
      if (!r.ok) throw new Error(ar ? b.errorAr || 'ما قدرناش نكمّلو الطلب. عاود جرّب.' : b.error);
      return b;
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    autosave.queue.update(autosave.latest.current);
    await autosave.queue.flush();
  }
  async function reloadSaved() {
    if (
      !autosave.queue.isDirty() ||
      window.confirm(
        t(
          'Recharger la version enregistrée ? Les modifications non enregistrées seront abandonnées.',
          'واش بغيتي تعاود تحمّل النسخة المسجّلة؟ التغييرات اللي ما تسجلاتش غادي تتحيّد.',
        ),
      )
    )
      await load('login', true);
  }
  async function upload(f: File, field: string) {
    if (uploadLock.current) return false;
    uploadLock.current = true;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', await compressPhoto(f));
      const r = await fetch('/api/upload', { method: 'POST', body: form });
      const b: any = await r.json();
      if (!r.ok) throw new Error(ar ? b.errorAr || 'ما قدرناش نكمّلو الطلب. عاود جرّب.' : b.error);
      if (b.storage) setStorage(b.storage);
      setData((d: any) => ({
        ...d,
        [field]: b.url,
      }));
      setMsg(
        t(
          'Fichier ajouté. Enregistrement automatique en cours.',
          'تزّاد الملف. التسجيل التلقائي خدام.',
        ),
      );
      return true;
    } catch (e: any) {
      setMsg(e.message);
      return false;
    } finally {
      setBusy(false);
      uploadLock.current = false;
    }
  }
  const field = (key: string, label: string, type = 'text') => (
    <label className="field">
      {label}
      <input
        type={type}
        disabled={busy}
        value={data[key] || ''}
        onChange={(e) => setData({ ...data, [key]: e.target.value })}
      />
    </label>
  );
  const Card = useCallback(
    (props: CardViewProps) => {
      return (
        <CardView
          {...props}
          ar={ar}
          view={view}
          id={id}
          publicName={publicName}
          onMessage={setMsg}
          onRequest={() => {}}
        />
      );
    },
    [ar, view, id, publicName],
  );
  return (
    <div className="site" dir={ar ? 'rtl' : 'ltr'}>
      <SiteHeader
        ar={ar}
        view={view}
        t={t}
        toggleLanguage={toggleLanguage}
        sessionChecked={sessionChecked}
        auth={auth}
        loaded={loaded}
        authLoading={authLoading}
        canAdmin={canAdmin}
        accountEmail={accountEmail}
        busy={busy}
        logout={logout}
      />
      {crop && (
        <ImageCropper
          source={crop.source}
          target={crop.target}
          ar={ar}
          circle={appearance(data).avatarShape === 'circle'}
          cardData={data}
          onLivePreview={(previewUrl) => {
            setData((prev: any) => ({ ...prev, [crop.target]: previewUrl }));
          }}
          onCancel={() => {
            if (crop.previousValue !== undefined) {
              setData((prev: any) => ({ ...prev, [crop.target]: crop.previousValue }));
            }
            setCrop(null);
          }}
          onApply={async (file) => {
            try {
              if (!(await upload(file, crop.target))) {
                if (crop.previousValue !== undefined) {
                  setData((prev: any) => ({ ...prev, [crop.target]: crop.previousValue }));
                }
                throw new Error('Importation impossible');
              }
              setCrop(null);
            } catch (err) {
              if (crop.previousValue !== undefined) {
                setData((prev: any) => ({ ...prev, [crop.target]: crop.previousValue }));
              }
              throw err;
            }
          }}
        />
      )}
      {msg && (
        <div className="notice" role="status">
          {msg}
          <button aria-label="Fermer" onClick={() => setMsg('')}>
            <X size={16} />
          </button>
        </div>
      )}
      {view === 'home' && <LandingPage ar={ar} auth={auth} />}
      {view === 'app' && auth && pendingOffer && (
        <div className="panel" role="status" style={{ margin: '16px auto', maxWidth: 1100 }}>
          <strong>
            {t('Offre choisie : ', 'العرض اللي اخترتي: ')}
            {offerLabel(pendingOffer, ar)}
          </strong>
          <p>
            {t(
              'Confirmez votre demande. Le paiement et l’activation sont traités manuellement.',
              'أكّد الطلب ديالك. الأداء والتفعيل كيتعالجو يدوياً.',
            )}
          </p>
          <button
            className="primary"
            disabled={busy}
            onClick={async () => {
              try {
                await action({ action: 'order', plan: pendingOffer });
                setPendingOffer(undefined);
                history.replaceState(null, '', workspacePath(ar));
                await load();
                setMsg(t('Demande enregistrée.', 'تسجّل الطلب.'));
              } catch (error: any) {
                setMsg(error.message);
              }
            }}
          >
            {t('Confirmer cette offre', 'أكّد هاد العرض')}
          </button>
          <button
            className="secondary"
            onClick={() => {
              setPendingOffer(undefined);
              history.replaceState(null, '', workspacePath(ar));
            }}
          >
            {t('Choisir plus tard', 'نختار من بعد')}
          </button>
        </div>
      )}
      {view === 'app' && (
        <Suspense
          fallback={
            <main id="main-content" tabIndex={-1} className="workspace" role="status">
              {t('Chargement de votre espace…', 'كنحمّلو الحساب ديالك…')}
            </main>
          }
        >
          <DashboardEditor
            context={{
              Card,
              action,
              ar,
              auth,
              authLoadError,
              authLoading,
              busy,
              canAdmin,
              contacts,
              data,
              field,
              id,
              publicName,
              setPublicName,
              inbox,
              historyPages,
              historyBusy,
              loadMoreHistory,
              load,
              loaded,
              logout,
              mailConfigured,
              notifications,
              orders,
              published,
              rawSources,
              save,
              saveState: autosave.state,
              savePaused: catalogWorking || !!crop,
              setCatalogWorking,
              reloadSaved,
              setData,
              setModal,
              setMsg,
              setPublished,
              setServiceIndex,
              setTab,
              startCrop,
              storage,
              subscription,
              t,
              tab,
              cards,
              cardLimit,
              cardsCount,
              activeCardId: id,
              switchCard,
              createCard,
            }}
          />
        </Suspense>
      )}
      {modal === 'manual' && (
        <ManualAppointmentModal
          data={data}
          ar={ar}
          busy={busy}
          serviceIndex={serviceIndex}
          setServiceIndex={setServiceIndex}
          onClose={() => setModal('')}
          onSubmit={async (form) => {
            await action({
              action: 'manual',
              profile: id,
              name: form.get('name'),
              phone: form.get('phone'),
              message: form.get('message'),
              email: form.get('email'),
              service: serviceIndex,
              slot: form.get('slot'),
            });
            setModal('');
            setMsg(t('Rendez-vous enregistré et confirmé.', 'تسجّل الموعد وتأكد.'));
            await load();
          }}
        />
      )}
      {view === 'home' && <SiteFooter ar={ar} />}
      {view === 'home' && (
        <a
          className="commercial-whatsapp"
          href="https://wa.me/212661446664"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('Contacter SoraLink sur WhatsApp', 'تواصل مع SoraLink فـ WhatsApp')}
        >
          <WhatsAppIcon />
          <span>{t('Une question ?', 'عندك سؤال؟')}</span>
        </a>
      )}
    </div>
  );
}
