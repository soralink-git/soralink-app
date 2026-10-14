'use client';
import { compressPhoto, MAX_SOURCE_PHOTO_BYTES } from './lib/compress-photo';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { X, Calendar, Check, Globe, Users } from 'lucide-react';
import QRCode from 'qrcode';
import Pwa from './pwa';
import ImageCropper from './image-cropper';
import CardView, { type CardViewProps } from './card-view';
import { WhatsAppIcon } from './card-helpers';
import { demoCard, demoCardArabic } from './lib/demo-card';
import { VIDEO_TYPES, mediaError } from './lib/content-media';

import { normalizeCatalogue, cataloguePrice } from './lib/catalogue';
import { appearance } from './lib/personalization';
import { normalizePromotions, todayMorocco } from './lib/promotions';
import { defaults, moroccoNow } from './lib/schedule';
const LandingPage = lazy(() => import('./landing-page'));
const DashboardEditor = lazy(() => import('./dashboard-editor'));
const socialFields = [
  ['instagram', 'Instagram'],
  ['facebook', 'Facebook'],
  ['linkedin', 'LinkedIn'],
  ['tiktok', 'TikTok'],
  ['youtube', 'YouTube'],
  ['x', 'X'],
];
function webLink(value: unknown) {
  try {
    const u = new URL(String(value || ''));
    return ['http:', 'https:'].includes(u.protocol) ? u.href : '';
  } catch {
    return '';
  }
}
function mapLinks(d: any) {
  const destination = String(d.mapDestination || d.address || '').trim();
  const custom = webLink(d.mapsUrl);
  let maps = '';
  if (custom) {
    const u = new URL(custom);
    if (
      u.hostname === 'maps.app.goo.gl' ||
      u.hostname === 'maps.google.com' ||
      (u.hostname === 'goo.gl' && u.pathname.startsWith('/maps')) ||
      (['google.com', 'www.google.com'].includes(u.hostname) && u.pathname.startsWith('/maps'))
    )
      maps = custom;
  }
  return {
    destination,
    maps:
      maps ||
      (destination
        ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(destination)
        : ''),
    directions: destination
      ? 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(destination)
      : '',
  };
}
const blank = {
  promotions: [] as any[],
  name: '',
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
  color: '#d5b66f',
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
  defaultLanguage: 'fr',
  pro: false,
  ...defaults,
};
export default function App({
  cardId,
  demoMode = false,
  workspaceMode = false,
}: {
  cardId?: string;
  demoMode?: boolean;
  workspaceMode?: boolean;
}) {
  const [ar, setAr] = useState(false),
    [view, setView] = useState(
      workspaceMode ? 'app' : demoMode ? 'demo' : cardId ? 'public' : 'home',
    ),
    [tab, setTab] = useState('coordinates'),
    [data, setData] = useState<any>(demoMode ? { ...blank, ...demoCard } : blank),
    [published, setPublished] = useState(false),
    [id, setId] = useState(''),
    [inbox, setInbox] = useState<any[]>([]),
    [orders, setOrders] = useState<any[]>([]),
    [msg, setMsg] = useState(''),
    [busy, setBusy] = useState(false),
    [qr, setQr] = useState(''),
    [modal, setModal] = useState(''),
    [demo, setDemo] = useState<any>(null),
    [loaded, setLoaded] = useState(false),
    [auth, setAuth] = useState(false),
    [canAdmin, setCanAdmin] = useState(false),
    [subscription, setSubscription] = useState<any>(null),
    [date, setDate] = useState(moroccoNow().slice(0, 10)),
    [serviceIndex, setServiceIndex] = useState(0),
    [slots, setSlots] = useState<string[]>([]),
    [slotsBusy, setSlotsBusy] = useState(false);
  const [myContactCard, setMyContactCard] = useState<any>(null),
    [useMyCard, setUseMyCard] = useState(false),
    [cardCheck, setCardCheck] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [storage, setStorage] = useState<any>(null);
  const [accountEmail, setAccountEmail] = useState(''),
    [sessionChecked, setSessionChecked] = useState(false);
  const authEpoch = useRef(0);
  const [authLoading, setAuthLoading] = useState(false),
    [authLoadError, setAuthLoadError] = useState(false);
  const [manualShareUrl, setManualShareUrl] = useState('');
  const [emailActions, setEmailActions] = useState(false);
  const [crop, setCrop] = useState<{ source: File | string; target: 'avatar' | 'cover' } | null>(
    null,
  );
  function startCrop(source: File | string, target: 'avatar' | 'cover') {
    if (busy) return;
    if (
      typeof source !== 'string' &&
      (!['image/jpeg', 'image/png', 'image/webp'].includes(source.type) ||
        source.size > MAX_SOURCE_PHOTO_BYTES)
    ) {
      setMsg(t('JPG, PNG ou WebP : maximum 40 Mo.', 'JPG، PNG ولا WebP: حتى 40 Mo.'));
      return;
    }
    setCrop({ source, target });
  }
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [promoToday, setPromoToday] = useState(todayMorocco);
  useEffect(() => {
    const timer = setInterval(() => setPromoToday(todayMorocco()), 30000);
    return () => clearInterval(timer);
  }, []);
  const [notifications, setNotifications] = useState<any[]>([]),
    [mailConfigured, setMailConfigured] = useState(false);
  const photoCaptureRef = useRef<HTMLInputElement>(null),
    videoCaptureRef = useRef<HTMLInputElement>(null);
  const uploadLock = useRef(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const t = (fr: string, da: string) => (ar ? da : fr);
  async function checkSession() {
    const epoch = ++authEpoch.current;
    try {
      const r = await fetch('/api/auth', { cache: 'no-store' });
      if (!r.ok) throw new Error();
      const b = (await r.json()) as { authenticated?: boolean; email?: unknown };
      if (epoch !== authEpoch.current) return;
      setAuth(b.authenticated === true);
      setAccountEmail(b.authenticated === true && typeof b.email === 'string' ? b.email : '');
      setSessionChecked(true);
    } catch {
      if (epoch === authEpoch.current) setSessionChecked(true);
    }
  }
  async function logout() {
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
  async function checkContactCard() {
    setCardCheck('loading');
    setMyContactCard(null);
    try {
      const r = await fetch('/api/data?exchange=1');
      const b: any = await r.json();
      if (r.status === 401) {
        setCardCheck('login');
        return;
      }
      if (!r.ok) throw new Error();
      if (b.card && b.card.id !== id) {
        setMyContactCard(b.card);
        setCardCheck('ready');
      } else setCardCheck('none');
    } catch {
      setCardCheck('error');
    }
  }
  useEffect(() => {
    if (modal === 'contact') {
      setUseMyCard(false);
      void checkContactCard();
    }
  }, [modal, id]);
  function toggleLanguage() {
    const nextAr = !ar;
    setAr(nextAr);
    setData((d: any) => ({ ...d, defaultLanguage: nextAr ? 'ar' : 'fr' }));
  }
  useEffect(() => {
    if (new URLSearchParams(location.search).get('lang') === 'ar') setAr(true);
  }, []);
  useEffect(() => {
    if (demoMode) setData({ ...blank, ...(ar ? demoCardArabic : demoCard) });
  }, [demoMode, ar]);
  useEffect(() => {
    document.documentElement.lang = ar ? 'ar' : 'fr';
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
  }, [ar]);
  useEffect(() => {
    if (cardId) {
      fetch('/api/data?id=' + cardId)
        .then((r) => r.json())
        .then((p: any) => {
          if (p.data) {
            const parsed = JSON.parse(p.data);
            setData(parsed);
            if (
              !new URLSearchParams(location.search).has('lang') &&
              (parsed.defaultLanguage || parsed.lang)
            ) {
              setAr(parsed.defaultLanguage === 'ar' || parsed.lang === 'ar');
            }
            setId(p.id);
          } else setMsg(p.error);
          setLoaded(true);
        });
    } else if (new URLSearchParams(location.search).has('app')) {
      setView('app');
      load();
    }
  }, []);
  useEffect(() => {
    if (id) QRCode.toDataURL(location.origin + '/c/' + id, { width: 240, margin: 2 }).then(setQr);
  }, [id]);
  async function load(authMode = 'login') {
    authEpoch.current++;
    setBusy(true);
    setAuthLoading(true);
    setAuthLoadError(false);
    try {
      const r = await fetch('/api/data');
      const b: any = await r.json();
      if (r.status === 401) {
        setAuth(false);
        setAccountEmail('');
        setSessionChecked(true);
        location.assign('/auth?mode=' + authMode + (ar ? '&lang=ar' : ''));
        return;
      } else if (!r.ok) {
        setAuthLoadError(true);
        setMsg(b.error);
      } else {
        setAuth(true);
        setAccountEmail(typeof b.email === 'string' ? b.email : b.profile?.email || '');
        setSessionChecked(true);
        setCanAdmin(!!b.admin);
        setSubscription(b.profile);
        if (b.profile) {
          const profileData = JSON.parse(b.profile.data);
          const hasQueryLang = new URLSearchParams(location.search).has('lang');
          if (!hasQueryLang && (profileData.defaultLanguage || profileData.lang)) {
            setAr(profileData.defaultLanguage === 'ar' || profileData.lang === 'ar');
          }
          setData({
            ...blank,
            ...profileData,
            defaultLanguage: profileData.defaultLanguage || profileData.lang || (ar ? 'ar' : 'fr'),
            promotions: normalizePromotions(profileData.promotions),
            services: normalizeCatalogue(profileData.services),
          });
          setId(b.profile.id);
          setPublished(!!b.profile.published);
        }
        setInbox(b.requests);
        setContacts(b.contacts || []);
        setNotifications(b.notifications || []);
        setMailConfigured(!!b.mailConfigured);
        setOrders(b.orders);
        setMsg('');
      }
    } catch {
      setAuthLoadError(true);
      setMsg(t('Service indisponible. Réessayez.', 'الخدمة ما متوفراش. عاود جرّب.'));
    }
    setBusy(false);
    setAuthLoading(false);
    setLoaded(true);
  }
  async function action(body: any) {
    setBusy(true);
    try {
      const r = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const b: any = await r.json();
      if (!r.ok) throw new Error(ar ? b.errorAr || b.error : b.error);
      return b;
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    try {
      const payloadData = { ...data, defaultLanguage: ar ? 'ar' : 'fr' };
      const b = await action({ action: 'save', data: payloadData, published });
      setId(b.id);
      setData(payloadData);
      setMsg(
        b.cleanupPending
          ? t(
              'Carte enregistrée. Le nettoyage du stockage sera réessayé à votre prochaine action.',
              'تسجلات الكارط. تنظيف التخزين غادي يتعاود فالإجراء الجاي.',
            )
          : t('Votre carte est enregistrée.', 'تسجلات الكارط ديالك.'),
      );
      void loadStorage();
    } catch (e: any) {
      setMsg(e.message);
    }
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
      if (!r.ok) throw new Error(ar ? b.errorAr || b.error : b.error);
      if (b.storage) setStorage(b.storage);
      setData((d: any) => ({
        ...d,
        [field]: field === 'photos' ? [...d.photos, b.url].slice(0, 10) : b.url,
      }));
      setMsg(t('Fichier ajouté. Enregistrez votre carte.', 'تزّاد الملف. سجّل الكارط ديالك.'));
      return true;
    } catch (e: any) {
      setMsg(e.message);
      return false;
    } finally {
      setBusy(false);
      uploadLock.current = false;
    }
  }
  async function uploadVideo(file: File) {
    if (uploadLock.current) return;
    const error = mediaError(file.type, file.size);
    if (!VIDEO_TYPES.includes(file.type) || error) {
      setMsg(
        error || t('Choisissez une vidéo MP4, WebM ou MOV.', 'اختار فيديو MP4، WebM ولا MOV.'),
      );
      return;
    }
    uploadLock.current = true;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', await compressPhoto(file));
      const r = await fetch('/api/upload', { method: 'POST', body: form });
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error || 'Importation impossible');
      if (b.storage) setStorage(b.storage);
      setData((d: any) => ({ ...d, recordedVideo: b.url }));
      setMsg(
        t(
          'Vidéo ajoutée. Enregistrez votre carte pour la publier.',
          'تزّاد الفيديو. سجّل الكارط ديالك باش تنشرو.',
        ),
      );
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      uploadLock.current = false;
      setBusy(false);
    }
  }
  async function uploadPhotos(files: File[]) {
    if (uploadLock.current || !files.length) return;
    const remaining = Math.max(0, 10 - data.photos.length);
    if (!remaining) {
      setMsg(t('La galerie contient déjà 10 photos.', 'الگالوري فيها 10 تصاور دابا.'));
      return;
    }
    uploadLock.current = true;
    setBusy(true);
    const errors: string[] = [];
    const valid = files.filter((f) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        errors.push(f.name + ': ' + t('format non accepté', 'نوع ما مقبولش'));
        return false;
      }
      if (f.size > MAX_SOURCE_PHOTO_BYTES) {
        errors.push(
          f.name + ': ' + t('plus de 40 Mo avant compression', 'أكثر من 40 Mo قبل الضغط'),
        );
        return false;
      }
      return true;
    });
    const chosen = valid.slice(0, remaining);
    const excess = Math.max(0, valid.length - remaining);
    let added = 0;
    setUploadProgress({ done: 0, total: chosen.length });
    try {
      for (let i = 0; i < chosen.length; i++) {
        const f = chosen[i];
        try {
          const form = new FormData();
          form.append('file', await compressPhoto(f));
          const r = await fetch('/api/upload', { method: 'POST', body: form });
          const b: any = await r.json();
          if (!r.ok) throw new Error(b.error || 'Échec');
          if (b.storage) setStorage(b.storage);
          setData((d: any) => ({ ...d, photos: [...d.photos, b.url].slice(0, 10) }));
          added++;
        } catch (e: any) {
          errors.push(f.name + ': ' + e.message);
        }
        setUploadProgress({ done: i + 1, total: chosen.length });
      }
      let message = added
        ? t(
            added + ' photo(s) ajoutée(s). Enregistrez votre carte.',
            'تزادو ' + added + ' تصاور. سجّل الكارط ديالك.',
          )
        : t('Aucune photo ajoutée.', 'ما تزادت حتى تصويرة.');
      if (excess)
        message +=
          ' ' +
          t(
            excess + ' photo(s) non importée(s) : limite de 10 photos.',
            excess + ' تصاور ما تزادوش: الحد هو 10 تصاور.',
          );
      if (errors.length) message += ' ' + errors.join(' · ');
      setMsg(message);
    } finally {
      setUploadProgress(null);
      setBusy(false);
      uploadLock.current = false;
    }
  }
  useEffect(() => {
    if (modal !== 'rdv' || !id) return;
    const controller = new AbortController();
    setSlotsBusy(true);
    setSlots([]);
    fetch('/api/availability?id=' + id + '&date=' + date + '&service=' + serviceIndex, {
      signal: controller.signal,
    })
      .then(async (r) => {
        const b: any = await r.json();
        if (!r.ok) throw new Error(ar ? b.errorAr || b.error : b.error);
        setSlots(b.slots);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setMsg(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSlotsBusy(false);
      });
    return () => controller.abort();
  }, [modal, id, date, serviceIndex]);
  function updateCatalogue(itemId: string, key: string, value: any) {
    setData((d: any) => ({
      ...d,
      services: d.services.map((item: any) =>
        item.id === itemId ? { ...item, [key]: value } : item,
      ),
    }));
  }
  async function uploadCatalogue(file: File, itemId: string) {
    if (uploadLock.current) return;
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > MAX_SOURCE_PHOTO_BYTES
    ) {
      setMsg(
        t(
          'JPG, PNG ou WebP, maximum 40 Mo avant compression.',
          'JPG، PNG ولا WebP، حتى 40 Mo قبل الضغط.',
        ),
      );
      return;
    }
    uploadLock.current = true;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', await compressPhoto(file));
      const r = await fetch('/api/upload', { method: 'POST', body: form });
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error || 'Importation impossible');
      if (b.storage) setStorage(b.storage);
      updateCatalogue(itemId, 'image', b.url);
      setMsg(
        t('Photo ajoutée. Enregistrez votre catalogue.', 'تزادت التصويرة. سجّل الكاتالوگ ديالك.'),
      );
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
      uploadLock.current = false;
    }
  }
  function updatePromotion(promoId: string, key: string, value: any) {
    setData((d: any) => ({
      ...d,
      promotions: (d.promotions || []).map((p: any) =>
        p.id === promoId ? { ...p, [key]: value } : p,
      ),
    }));
  }
  async function uploadPromotion(file: File, promoId: string) {
    if (uploadLock.current) return;
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > MAX_SOURCE_PHOTO_BYTES
    ) {
      setMsg(
        t(
          'JPG, PNG ou WebP, maximum 40 Mo avant compression.',
          'JPG، PNG ولا WebP، حتى 40 Mo قبل الضغط.',
        ),
      );
      return;
    }
    uploadLock.current = true;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', await compressPhoto(file));
      const r = await fetch('/api/upload', { method: 'POST', body: form });
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error || 'Importation impossible');
      if (b.storage) setStorage(b.storage);
      updatePromotion(promoId, 'image', b.url);
      setMsg(t('Photo ajoutée. Enregistrez votre carte.', 'تزادت التصويرة. سجّل الكارط ديالك.'));
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
      uploadLock.current = false;
    }
  }
  const promoStatusLabels: Record<string, [string, string]> = {
    draft: ['À compléter', 'خاصو يتعمّر'],
    inactive: ['Désactivée', 'مطفي'],
    scheduled: ['Programmée', 'مبرمج'],
    expired: ['Expirée', 'سالا'],
    active: ['Visible', 'باين'],
  };
  const field = (key: string, label: string, type = 'text') => (
    <label className="field">
      {label}
      <input
        type={type}
        value={data[key] || ''}
        onChange={(e) => setData({ ...data, [key]: e.target.value })}
      />
    </label>
  );
  const openApp = () => {
    setView('app');
    load();
    window.scrollTo(0, 0);
  };
  function accentText(color: string) {
    const hex = /^#[0-9a-f]{6}$/i.test(color || '') ? color : '#d5b66f';
    const rgb = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 > 0.179 ? '#111111' : '#ffffff';
  }
  async function sharePublicCard(d: any, preview: boolean) {
    if (preview || view === 'demo' || !id) {
      setMsg(
        t(
          'Aperçu : le partage sera disponible sur votre carte publique.',
          'معاينة: المشاركة غادي تخدم فالصفحة العمومية ديالك.',
        ),
      );
      return;
    }
    const url = location.origin + '/c/' + encodeURIComponent(id);
    setManualShareUrl('');
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: (d.business || d.name) + ' — SoraLink', url });
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setMsg(
        t(
          'Lien de la carte copié. Vous pouvez le coller dans votre message.',
          'تنسخ رابط الكارط. تقدر تلصقو فالرسالة ديالك.',
        ),
      );
    } catch {
      setManualShareUrl(url);
      setMsg(
        t(
          'Sélectionnez le lien sous le bouton pour le copier.',
          'اختار الرابط تحت الزر باش تنسخو.',
        ),
      );
    }
  }
  function Card(props: CardViewProps) {
    return (
      <CardView
        {...props}
        ar={ar}
        setAr={setAr}
        view={view}
        id={id}
        onMessage={setMsg}
        onRequest={(kind, item) => {
          setServiceIndex(0);
          setSelectedItem(item || null);
          setModal(kind);
        }}
        onDiscover={(d) => {
          setDemo(d);
          setView('demo');
          window.scrollTo(0, 0);
        }}
      />
    );
  }
  const sectionLabels: Record<string, [string, string]> = {
    coordinates: ['Coordonnées', 'معلومات التواصل'],
    social: ['Réseaux sociaux', 'مواقع التواصل'],
    promotions: ['Promotions', 'العروض'],
    services: ['Catalogue produits / services', 'كاتالوگ المنتجات / الخدمات'],
    photos: ['Galerie photos', 'التصاور'],
    pdf: ['Catalogue PDF', 'كاتالوگ PDF'],
    video: ['Vidéo', 'الفيديو'],
    links: ['Site web', 'الموقع'],
    appointments: ['Rendez-vous', 'المواعيد'],
  };
  function Customization() {
    const a = appearance(data);
    const select = (key: string, label: string, values: [string, string, string][]) => (
      <label className="field">
        {label}
        <select
          value={
            data[key] ||
            (
              {
                textSize: 'normal',
                buttonSize: 'normal',
                buttonStyle: 'filled',
                cardTheme: 'light',
                cardFont: 'modern',
                buttonShape: 'rounded',
                avatarShape: 'circle',
                defaultLanguage: ar ? 'ar' : 'fr',
              } as any
            )[key]
          }
          onChange={(e) => {
            const nextVal = e.target.value;
            if (key === 'defaultLanguage') setAr(nextVal === 'ar');
            setData({ ...data, [key]: nextVal });
          }}
        >
          {values.map(([value, fr, ar]) => (
            <option key={value} value={value}>
              {t(fr, ar)}
            </option>
          ))}
        </select>
      </label>
    );
    return (
      <div className="personalization">
        <h3>{t('Style de votre carte', 'ستايل الكارط ديالك')}</h3>
        <div className="form-grid">
          {select(
            'defaultLanguage',
            t('Langue par défaut de la carte', 'اللغة الافتراضية للكارط'),
            [
              ['fr', 'Français', 'الفرنسية'],
              ['ar', 'العربية / الدارجة', 'العربية / الدارجة'],
            ],
          )}
          {select('cardTheme', t('Fond de carte', 'خلفية الكارط'), [
            ['light', 'Clair', 'فاتح'],
            ['dark', 'Sombre', 'غامق'],
            ['sand', 'Crème', 'كريمي'],
          ])}
          {select('cardFont', t('Police', 'الخط'), [
            ['modern', 'Moderne', 'عصري'],
            ['classic', 'Classique', 'كلاسيكي'],
            ['simple', 'Simple', 'بسيط'],
          ])}
          {select('buttonShape', t('Forme des boutons', 'شكل الأزرار'), [
            ['rounded', 'Arrondis', 'مدوّرين'],
            ['square', 'Carrés', 'مربّعين'],
            ['pill', 'Très arrondis', 'مدوّرين بزاف'],
          ])}
          {select('avatarShape', t('Forme du portrait / logo', 'شكل التصويرة / اللوگو'), [
            ['circle', 'Rond', 'دائرة'],
            ['square', 'Carré arrondi', 'مربع مدوّر'],
          ])}
          {select('textSize', t('Taille du texte', 'حجم الكتابة'), [
            ['normal', 'Confortable', 'مريح'],
            ['large', 'Grande', 'كبيرة'],
            ['extra', 'Très grande', 'كبيرة بزاف'],
          ])}
          {select('buttonSize', t('Taille des boutons', 'حجم الأزرار'), [
            ['normal', 'Standard', 'عادي'],
            ['large', 'Grande', 'كبير'],
          ])}
          {select('buttonStyle', t('Style des boutons', 'ستايل الأزرار'), [
            ['filled', 'Plein', 'عامر'],
            ['outline', 'Contour', 'بالإطار'],
          ])}
          <label className="field">
            {t('Couleur de la carte', 'لون الكارط')}
            <input
              type="color"
              value={data.color || '#d5b66f'}
              onChange={(e) => setData({ ...data, color: e.target.value })}
            />
            <button
              type="button"
              className="text-button"
              onClick={() => setData({ ...data, color: '#d5b66f' })}
            >
              {t('Couleur par défaut', 'اللون الافتراضي')}
            </button>
          </label>
          <label className="field">
            {t('Couleur du fond', 'لون الخلفية')}
            <input
              type="color"
              value={
                a.fondColor ||
                (a.theme === 'dark' ? '#0f172a' : a.theme === 'sand' ? '#f5b86e' : '#e2c478')
              }
              onChange={(e) => setData({ ...data, fondColor: e.target.value })}
            />
            <button
              type="button"
              className="text-button"
              onClick={() => setData({ ...data, fondColor: '' })}
            >
              {t('Fond par défaut', 'الخلفية الافتراضية')}
            </button>
          </label>
          <label className="field">
            {t('Couleur des blocs', 'لون الكتل')}
            <input
              type="color"
              value={a.blockColor || (a.theme === 'dark' ? '#151d28' : '#ffffff')}
              onChange={(e) => setData({ ...data, blockColor: e.target.value })}
            />
            <button
              type="button"
              className="text-button"
              onClick={() => setData({ ...data, blockColor: '' })}
            >
              {t('Blocs par défaut', 'الكتل الافتراضية')}
            </button>
          </label>
          <label className="field">
            {t('Couleur des boutons', 'لون الأزرار')}
            <input
              type="color"
              value={a.buttonColor || data.color || '#d5b66f'}
              onChange={(e) => setData({ ...data, buttonColor: e.target.value })}
            />
            <button
              type="button"
              className="text-button"
              onClick={() => setData({ ...data, buttonColor: '' })}
            >
              {t('Boutons par défaut', 'الأزرار الافتراضية')}
            </button>
          </label>
          <label className="field">
            {t('Couleur du texte', 'لون الكتابة')}
            <input
              type="color"
              value={
                a.textColor ||
                (a.theme === 'dark' ? '#f5f6f8' : a.theme === 'sand' ? '#352b20' : '#1c2623')
              }
              onChange={(e) => setData({ ...data, textColor: e.target.value })}
            />
            <button
              type="button"
              className="text-button"
              onClick={() => setData({ ...data, textColor: '' })}
            >
              {t('Couleur automatique', 'لون أوتوماتيكي')}
            </button>
          </label>
        </div>
        <h3>{t('Coordonnées visibles', 'المعلومات اللي كيبانو')}</h3>
        <div className="visibility-options">
          {[
            ['hidePhone', 'Téléphone', 'التلفون'],
            ['hideEmail', 'E-mail', 'الإيميل'],
            ['hideLocation', 'Maps et adresse', 'Maps والعنوان'],
            ['hideSocial', 'Réseaux sociaux', 'مواقع التواصل'],
            ['hideWhatsApp', 'WhatsApp', 'WhatsApp'],
          ].map(([key, fr, da]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={!data[key]}
                onChange={(e) => setData({ ...data, [key]: !e.target.checked })}
              />
              {t(fr, da)}
            </label>
          ))}
        </div>
        <p className="hint">
          {t(
            'Les informations masquées restent dans votre espace et ne sont plus transmises avec la carte publique après enregistrement.',
            'المعلومات المخبيّة كاتبقى فالحساب ديالك وما كاتتسيفطش مع الكارط العمومية من بعد التسجيل.',
          )}
        </p>
      </div>
    );
  }
  function download(blob: Blob, name: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  return (
    <div
      className={'site' + (view === 'public' || view === 'demo' ? ' public-card-page' : '')}
      dir={ar ? 'rtl' : 'ltr'}
    >
      {view !== 'public' && view !== 'demo' && (
        <header>
          <a className="brand" dir="ltr" href="/">
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
                ['fonctionnalites', 'Fonctionnalités', 'المزايا'],
                ['tarifs', 'Tarifs', 'الأثمنة'],
                ['exemples', 'Exemples', 'أمثلة'],
                ['faq', 'FAQ', 'أسئلة'],
              ].map(([anchor, f, a]) => (
                <a href={(view === 'home' ? '' : '/') + '#' + anchor} key={anchor}>
                  {t(f, a)}
                </a>
              ))}
            </nav>
          )}
          <div className="header-actions">
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
                <a className="header-login" href="/?app=1">
                  {t('Mon espace', 'الحساب ديالي')}
                </a>
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
                    <a href="/?app=1">{t('Ouvrir mon espace', 'حل الحساب ديالي')}</a>
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
            {view === 'home' && (
              <a
                className="primary small header-start"
                href={auth ? '/?app=1' : '/auth?mode=signup' + (ar ? '&lang=ar' : '')}
              >
                {t('Créer ma carte', 'صايب الكارط')}
              </a>
            )}
          </div>
        </header>
      )}
      {crop && (
        <ImageCropper
          source={crop.source}
          target={crop.target}
          ar={ar}
          circle={appearance(data).avatarShape === 'circle'}
          onCancel={() => setCrop(null)}
          onApply={async (file) => {
            if (!(await upload(file, crop.target))) throw new Error('Importation impossible');
            setCrop(null);
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
      {view === 'home' && (
        <Suspense
          fallback={
            <main className="landing" role="status">
              {t('Chargement…', 'كنحمّلو…')}
            </main>
          }
        >
          <LandingPage
            ar={ar}
            auth={auth}
            Card={Card}
            blank={blank}
            onPricing={() => setView('pricing')}
          />
        </Suspense>
      )}
      {view === 'pricing' && (
        <main className="section">
          <span className="eyebrow">{t('DES OFFRES CLAIRES', 'عروض واضحة')}</span>
          <h1 className="page-title">
            {t('Choisissez votre point de départ.', 'اختار منين تبدا.')}
          </h1>
          <p className="muted">
            {t(
              'Tarifs de lancement proposés · paiement manuel · livraison séparée.',
              'أثمنة مقترحة للبداية · الأداء يدوي · التوصيل بوحدو.',
            )}
          </p>
          <div className="pricing-grid">
            {[
              ['Digital', 149, 'Votre page, en toute autonomie.', 'الصفحة ديالك، كتسيّرها بوحدك.'],
              ['Pack', 349, 'Le digital rencontre le papier.', 'الديجيتال مع الطباعة.'],
              ['Accompagnement', 549, 'Vous nous confiez la préparation.', 'خلّي علينا التحضير.'],
            ].map(([name, price, f, a], i) => (
              <article className={'price-card ' + (i === 1 ? 'featured' : '')} key={name}>
                {i === 1 && (
                  <span className="recommended">{t('LE PACK COMPLET', 'الپاك الكامل')}</span>
                )}
                <h2>{name}</h2>
                <p>{t(String(f), String(a))}</p>
                <div className="price">
                  {price}
                  <span> DH</span>
                </div>
                <p className="period">
                  {i === 0 ? t('par an', 'فالعام') : t('la première année', 'العام الأول')}
                </p>
                <ul>
                  {[
                    t('1 page · 10 photos · 10 services', 'صفحة وحدة · 10 تصاور · 10 خدمات'),
                    t('Catalogue PDF · QR · vidéo intégrée', 'كاتالوگ PDF · QR · فيديو'),
                    t('Demandes de devis et de commande', 'طلبات الثمن والطلبات'),
                    ...(i > 0
                      ? [
                          t(
                            '1 NFC personnalisée + 100 cartes imprimées',
                            'NFC شخصية + 100 كارط مطبوعة',
                          ),
                        ]
                      : []),
                    ...(i === 2
                      ? [
                          t(
                            'Préparation + 2 séries de corrections',
                            'التحضير + جوج مراحل ديال التصحيح',
                          ),
                        ]
                      : []),
                  ].map((f) => (
                    <li key={f}>
                      <Check size={16} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={i === 1 ? 'primary full' : 'secondary full'}
                  onClick={() => {
                    openApp();
                    setTab('orders');
                  }}
                >
                  {t('Choisir cette offre', 'اختار هاد العرض')}
                </button>
                <small>{t('Renouvellement : 149 DH/an', 'التجديد : 149 درهم فالعام')}</small>
              </article>
            ))}
          </div>
          <div className="callout">
            <Calendar size={30} />
            <div>
              <h3>{t('Pro Rendez-vous · +250 DH/an', 'Pro Rendez-vous · +250 درهم فالعام')}</h3>
              <p>
                {t(
                  'Un agenda, cinq prestations et des demandes à confirmer. Total Digital + Pro : 399 DH/an.',
                  'أجندة وحدة، خمس خدمات وطلبات مواعيد كتأكدها. Digital + Pro بـ 399 درهم فالعام.',
                )}
              </p>
            </div>
          </div>
          <details>
            <summary>{t('Renouvellement et assistance', 'التجديد والمساعدة')}</summary>
            <p>
              {t(
                '12 mois à partir de l’activation. Aucun prélèvement automatique. 15 jours de grâce puis suspension ; conservation 90 jours après échéance. Assistance du lundi au vendredi, 10 h–18 h, première réponse sous deux jours ouvrés. Conditions commerciales à finaliser avant lancement.',
                '12 شهر من التفعيل، بلا اقتطاع أوتوماتيكي. مهلة 15 يوم ومن بعدها التوقيف. المعلومات كتبقى 90 يوم من نهاية الاشتراك. المساعدة من الاثنين للجمعة من 10 حتى 18، أول جواب خلال يومين ديال الخدمة. الشروط النهائية قبل الإطلاق.',
              )}
            </p>
          </details>
        </main>
      )}
      {view === 'app' && (
        <Suspense
          fallback={
            <main className="workspace" role="status">
              {t('Chargement de votre espace…', 'كنحمّلو الحساب ديالك…')}
            </main>
          }
        >
          <DashboardEditor
            context={{
              Card,
              Customization,
              action,
              ar,
              auth,
              authLoadError,
              authLoading,
              busy,
              canAdmin,
              contacts,
              data,
              download,
              field,
              id,
              inbox,
              load,
              loaded,
              logout,
              mailConfigured,
              notifications,
              orders,
              photoCaptureRef,
              promoStatusLabels,
              promoToday,
              published,
              qr,
              save,
              sectionLabels,
              setData,
              setModal,
              setMsg,
              setPublished,
              setServiceIndex,
              setTab,
              socialFields,
              startCrop,
              storage,
              subscription,
              t,
              tab,
              updateCatalogue,
              updatePromotion,
              upload,
              uploadCatalogue,
              uploadPhotos,
              uploadProgress,
              uploadPromotion,
              uploadVideo,
              videoCaptureRef,
            }}
          />
        </Suspense>
      )}
      {(view === 'public' || view === 'demo') && (
        <main className="public-layout">
          {view === 'public' && !data.name ? (
            <div className="empty">
              <h2>
                {loaded
                  ? t('Page indisponible', 'الصفحة ما متوفراش')
                  : t('Chargement…', 'كنحمّلو…')}
              </h2>
            </div>
          ) : (
            <>
              <Card d={demo || data} withSections />
            </>
          )}
        </main>
      )}
      {modal && (
        <div className="modal-backdrop">
          <div className="modal" role="dialog" aria-modal="true" aria-label="Demande">
            <button
              className="close"
              aria-label="Fermer"
              onClick={() => {
                setModal('');
                setSelectedItem(null);
              }}
            >
              <X />
            </button>
            <span className="eyebrow">{data.name}</span>
            <h2>
              {modal === 'contact'
                ? t('Échanger nos coordonnées', 'نتبادلو معلومات التواصل')
                : modal === 'manual'
                  ? t('Ajouter un rendez-vous confirmé', 'زيد موعد مؤكد')
                  : modal === 'rdv'
                    ? t('Demander un rendez-vous', 'طلب موعد')
                    : modal === 'commande'
                      ? t('Votre demande de commande', 'الطلب ديالك')
                      : t('Demander un devis', 'طلب الثمن')}
            </h2>
            {modal === 'commande' && selectedItem && (
              <div className="catalogue-selection">
                <strong>{selectedItem.name}</strong>
                {selectedItem.category && <span>{selectedItem.category}</span>}
                {selectedItem.price && <span>{cataloguePrice(selectedItem.price)}</span>}
              </div>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                try {
                  await action({
                    action: modal === 'manual' ? 'manual' : 'request',
                    profile: id,
                    kind: modal === 'manual' ? 'rdv' : modal,
                    name: f.get('name'),
                    phone: f.get('phone'),
                    message: f.get('message'),
                    email: f.get('email'),
                    service: serviceIndex,
                    catalogueId: modal === 'commande' ? selectedItem?.id : undefined,
                    slot: f.get('slot'),
                    trap: f.get('company'),
                    shareCard: modal === 'contact' && useMyCard,
                    consent: modal === 'contact' ? f.get('consent') === 'on' : undefined,
                  });
                  setModal('');
                  setSelectedItem(null);
                  setMsg(
                    modal === 'contact'
                      ? t(
                          'Merci ! Vos coordonnées ont été transmises à ce professionnel.',
                          'شكراً! معلومات التواصل ديالك تسيفطات لهاد المهني.',
                        )
                      : modal === 'manual'
                        ? t('Rendez-vous enregistré et confirmé.', 'تسجّل الموعد وتأكد.')
                        : t(
                            'Demande envoyée. Le professionnel doit la confirmer.',
                            'تسيفط الطلب. خاص المهني يأكدو.',
                          ),
                  );
                  if (modal === 'manual') load();
                } catch (e: any) {
                  setMsg(e.message);
                }
              }}
            >
              {modal === 'contact' && (
                <div className="contact-card-choice">
                  {cardCheck === 'loading' ? (
                    <p className="hint">
                      {t('Recherche de votre carte…', 'كنقلبو على الكارط ديالك…')}
                    </p>
                  ) : myContactCard ? (
                    <>
                      <div className="row">
                        <button
                          type="button"
                          className={useMyCard ? 'primary small' : 'secondary small'}
                          onClick={() => setUseMyCard(true)}
                        >
                          {t('Partager ma carte SoraLink', 'شارك كارط SoraLink ديالي')}
                        </button>
                        <button
                          type="button"
                          className={!useMyCard ? 'primary small' : 'secondary small'}
                          onClick={() => setUseMyCard(false)}
                        >
                          {t('Remplir le formulaire', 'عمّر الفورميلير')}
                        </button>
                      </div>
                      {useMyCard && (
                        <div className="catalogue-selection">
                          <strong>{myContactCard.name}</strong>
                          {myContactCard.business && <span>{myContactCard.business}</span>}
                          <span dir="ltr">{myContactCard.phone}</span>
                          {myContactCard.email && <span dir="ltr">{myContactCard.email}</span>}
                          <p className="hint">
                            {t(
                              'Ces coordonnées et le lien de votre carte seront partagés.',
                              'هاد المعلومات والرابط ديال الكارط غادي يتشاركو.',
                            )}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="hint">
                        {cardCheck === 'login'
                          ? t(
                              'Vous avez déjà une carte SoraLink ? Connectez-vous pour la partager.',
                              'عندك كارط SoraLink؟ دخل للحساب باش تشاركها.',
                            )
                          : cardCheck === 'error'
                            ? t(
                                'Votre carte n’a pas pu être chargée. Réessayez ou remplissez le formulaire.',
                                'ما قدرناش نحمّلو الكارط. عاود حاول ولا عمّر الفورميلير.',
                              )
                            : t(
                                'Pour partager votre carte, elle doit être publiée avec un nom et un téléphone visible. Vous pouvez aussi remplir ce formulaire.',
                                'باش تشارك الكارط، خاصها تكون منشورة وفيها الاسم والتلفون باين. تقدر حتى تعمّر هاد الفورميلير.',
                              )}
                      </p>
                      <div className="row">
                        {cardCheck === 'login' && (
                          <a
                            className="secondary small"
                            href="/auth"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('Se connecter', 'دخل للحساب')}
                          </a>
                        )}
                        <button type="button" className="text-button" onClick={checkContactCard}>
                          {t('Actualiser mon compte', 'حدّث الحساب ديالي')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {!(modal === 'contact' && useMyCard) && (
                <>
                  <label className="field">
                    {t('Nom *', 'الاسم *')}
                    <input name="name" autoComplete="name" required maxLength={120} />
                  </label>
                  <label className="field">
                    {t('Téléphone *', 'التلفون *')}
                    <input name="phone" autoComplete="tel" required type="tel" maxLength={40} />
                  </label>
                  <label className="field">
                    {t('E-mail facultatif', 'الإيميل اختياري')}
                    <input name="email" autoComplete="email" type="email" maxLength={254} />
                  </label>
                </>
              )}
              {(modal === 'rdv' || modal === 'manual') && (
                <>
                  <label className="field">
                    {t('Prestation', 'الخدمة')}
                    <select
                      value={serviceIndex}
                      onChange={(e) => setServiceIndex(Number(e.target.value))}
                    >
                      {(data.appointmentServices || defaults.appointmentServices).map(
                        (v: any, i: number) => (
                          <option key={i} value={i}>
                            {v.name} · {v.duration} min
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  {modal === 'manual' ? (
                    <label className="field">
                      {t('Date et heure · Maroc', 'النهار والوقت · المغرب')}
                      <input
                        name="slot"
                        type="datetime-local"
                        step="900"
                        min={moroccoNow()}
                        required
                      />
                    </label>
                  ) : (
                    <>
                      <label className="field">
                        {t('Jour souhaité · heure du Maroc', 'النهار · توقيت المغرب')}
                        <input
                          type="date"
                          required
                          value={date}
                          min={moroccoNow().slice(0, 10)}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </label>
                      <label className="field">
                        {t('Créneau disponible', 'الوقت المتوفر')}
                        <select
                          key={date + '-' + serviceIndex + '-' + slots.join(',')}
                          name="slot"
                          required
                          disabled={slotsBusy || !slots.length}
                          defaultValue=""
                        >
                          <option value="">
                            {slotsBusy
                              ? t('Chargement…', 'كنحمّلو…')
                              : slots.length
                                ? t('Choisir un horaire', 'اختار الوقت')
                                : t(
                                    'Aucun créneau disponible ce jour',
                                    'ما كاين حتى وقت متوفر فهاد النهار',
                                  )}
                          </option>
                          {slots.map((v) => (
                            <option key={v} value={v}>
                              {v.slice(11)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  )}
                </>
              )}
              <label className="field">
                {t('Message facultatif', 'رسالة اختيارية')}
                <textarea
                  name="message"
                  maxLength={
                    modal === 'contact' ? 1000 : selectedItem && modal === 'commande' ? 1500 : 2000
                  }
                />
              </label>
              {modal === 'contact' && (
                <label className="contact-consent">
                  <input type="checkbox" name="consent" required />
                  {t(
                    'J’accepte de partager ces coordonnées avec ' +
                      (data.business || data.name) +
                      ' pour être recontacté au sujet de mon activité ou de ma demande.',
                    'كنوافق نشارك هاد المعلومات مع ' +
                      (data.business || data.name) +
                      ' باش يتواصل معايا بخصوص النشاط أو الطلب ديالي.',
                  )}
                </label>
              )}
              <input className="honeypot" name="company" tabIndex={-1} autoComplete="off" />
              <p className="hint">
                {t(
                  'Renseignez uniquement les informations nécessaires. Votre demande est visible par ce professionnel.',
                  'دخل غير المعلومات الضرورية. الطلب كيشوفو غير هاد المهني.',
                )}
              </p>
              <button
                className="primary full"
                disabled={
                  busy ||
                  (modal === 'contact' && useMyCard && !myContactCard) ||
                  (modal === 'rdv' && (slotsBusy || !slots.length))
                }
              >
                {busy
                  ? t('Envoi…', 'كيتسيفط…')
                  : modal === 'contact'
                    ? t('Partager mes coordonnées', 'شارك معلومات التواصل ديالي')
                    : t('Envoyer la demande', 'سيفط الطلب')}
              </button>
            </form>
          </div>
        </div>
      )}
      {view === 'public' || view === 'demo' ? null : (
        <footer className="site-footer">
          <div>
            <a className="brand" dir="ltr" href="/">
              Sora<span>Link</span>
            </a>
            <p>{t('Votre activité, à portée de main.', 'النشاط ديالك، قريب ليك.')}</p>
            <span>Oujda · Maroc</span>
          </div>
          <div className="footer-contact">
            <strong>{t('Parlons de votre carte', 'نهضرو على الكارط ديالك')}</strong>
            <a dir="ltr" href="mailto:soratap08@gmail.com">
              soratap08@gmail.com
            </a>
            <a dir="ltr" href="tel:+212661446664">
              +212 661 446 664
            </a>
            <a href="https://wa.me/212661446664" target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              WhatsApp
            </a>
          </div>
          <div className="footer-links">
            <a href="/conditions">{t('Conditions de service · pilote', 'شروط الخدمة · تجريبية')}</a>
            <a href="/confidentialite">{t('Confidentialité', 'الخصوصية')}</a>
            <a href="/#tarifs">{t('Offres et renouvellement', 'العروض والتجديد')}</a>
            {!cardId && <Pwa ar={ar} />}
          </div>
        </footer>
      )}
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
