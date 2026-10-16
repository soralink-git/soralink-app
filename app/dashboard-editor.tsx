'use client';
import CatalogEditor from './catalog-editor';
import CatalogMediaEditor from './catalog-media-editor';
import BackgroundEditor from './background-editor';
import type { CropTarget } from './lib/crop-geometry';
import AddressEditor from './address-editor';
import { publicCardPath } from './lib/public-address';
import LoadMore from './load-more';
import type { History, PageInfo } from './lib/pagination';
import { offerLabel } from './lib/journey-links';
import type { JSX, Dispatch, SetStateAction, RefObject } from 'react';
import type { LucideIcon } from 'lucide-react';

import {
  Nfc,
  X,
  Phone,
  Calendar,
  Briefcase,
  Plus,
  LayoutDashboard,
  FileText,
  ExternalLink,
  Download,
  Save,
  Palette,
  ImageIcon,
  Clock,
  Users,
  Settings,
  Copy,
  Camera,
  Crop,
  Package,
} from 'lucide-react';

import { type CardViewProps } from './card-view';
import { WhatsAppIcon } from './card-helpers';

import {
  whatsappNumber,
  whatsappNotification,
  requestKind,
  requestStatus,
  requestReply,
} from './lib/whatsapp-notification';
import { appearance } from './lib/personalization';
import { MAX_PROMOTIONS, promotionStatus } from './lib/promotions';

export type DashboardContext = {
  Card: (props: CardViewProps) => JSX.Element;
  Customization: (props?: any) => JSX.Element | null;
  action: (body: any) => Promise<any>;
  ar: boolean;
  setAr?: (ar: boolean) => void;
  auth: boolean;
  authLoadError: boolean;
  authLoading: boolean;
  busy: boolean;
  canAdmin: boolean;
  contacts: any[];
  data: any;
  download: (blob: Blob, name: string) => void;
  field: (key: string, label: string, type?: string) => JSX.Element;
  id: string;
  publicName?: string;
  setPublicName?: (name: string) => void;
  inbox: any[];
  historyPages?: Partial<Record<History, PageInfo>>;
  historyBusy?: boolean;
  loadMoreHistory?: (kind: History) => Promise<void>;
  load: (authMode?: string) => Promise<void>;
  loaded: boolean;
  logout: () => Promise<void>;
  mailConfigured: boolean;
  notifications: any[];
  orders: any[];
  photoCaptureRef: RefObject<HTMLInputElement | null>;
  promoStatusLabels: Record<string, [string, string]>;
  promoToday: string;
  published: boolean;
  qr: string;
  rawSources?: { avatar?: File | string; cover?: File | string; backgroundPhoto?: File | string };
  save: () => Promise<void>;
  sectionLabels: Record<string, [string, string]>;
  setData: Dispatch<any>;
  setModal: Dispatch<SetStateAction<string>>;
  setMsg: Dispatch<SetStateAction<string>>;
  setPublished: Dispatch<SetStateAction<boolean>>;
  setServiceIndex: Dispatch<SetStateAction<number>>;
  setTab: Dispatch<SetStateAction<string>>;
  socialFields: string[][];
  startCrop: (source: string | File, target: CropTarget) => void;
  storage: any;
  subscription: any;
  t: (fr: string, da: string) => string;
  tab: string;
  updateCatalogue: (itemId: string, key: string, value: any) => void;
  updatePromotion: (promoId: string, key: string, value: any) => void;
  upload: (f: File, field: string) => Promise<boolean>;
  uploadCatalogue: (file: File, itemId: string) => Promise<void>;
  uploadPhotos: (files: File[]) => Promise<void>;
  uploadProgress: { done: number; total: number } | null;
  uploadPromotion: (file: File, promoId: string) => Promise<void>;
  uploadVideo: (file: File) => Promise<void>;
  videoCaptureRef: RefObject<HTMLInputElement | null>;
};
export default function DashboardEditor({ context }: { context: DashboardContext }) {
  const {
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
    publicName = '',
    setPublicName = () => {},
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
    promoStatusLabels,
    promoToday,
    published,
    qr,
    rawSources,
    save,
    sectionLabels,
    setAr,
    setData,
    setModal,
    setMsg,
    setPublished,
    setServiceIndex,
    setTab,
    socialFields,
    startCrop,
    subscription,
    t,
    tab,
    updateCatalogue,
    updatePromotion,
    upload,
    uploadCatalogue,
    uploadPromotion,
  } = context;
  const tabs = [
    ['coordinates', Phone, 'Coordonnées', 'معلومات التواصل', 'card'],
    ['content', Package, 'Produits et services', 'المنتجات والخدمات', 'card'],
    ['interface', Palette, 'Interface', 'الواجهة والمظهر', 'card'],
    ['contacts', Users, 'Mes contacts', 'الكونطاكت ديالي', 'clients'],
    ['requests', Calendar, 'Mes demandes', 'الطلبات ديالي', 'clients'],
    ['schedule', Clock, 'Mon agenda', 'الأجندة ديالي', 'clients'],
    ['share', Nfc, 'Partager', 'شارك', 'offer'],
    ['orders', FileText, 'Mon offre', 'العرض ديالي', 'offer'],
  ] satisfies Array<[string, LucideIcon, string, string, string]>;
  const activeTab =
    tab === 'profile'
      ? 'coordinates'
      : tab === 'sections'
        ? 'interface'
        : tab === 'catalogue' || tab === 'promotions' || tab === 'media'
          ? 'content'
          : tab;
  const current = tabs.find(([key]) => key === activeTab) || tabs[0];
  return (
    <main className="workspace workspace-design">
      <aside>
        <h3>{t('Mon espace', 'الحساب ديالي')}</h3>
        <nav
          className="workspace-navigation"
          aria-label={t('Rubriques de votre espace', 'أقسام الحساب ديالك')}
        >
          {tabs.map(([key, Icon, fr, da, group], index) => (
            <div key={key} className="workspace-nav-item">
              {(index === 0 || tabs[index - 1][4] !== group) && (
                <span className="workspace-nav-group">
                  {group === 'card'
                    ? t('Personnaliser', 'خصّص الكارط')
                    : group === 'clients'
                      ? t('Mes clients', 'الزبناء ديالي')
                      : t('Diffusion et offre', 'المشاركة والعرض')}
                </span>
              )}
              <button
                key={key}
                className={activeTab === key ? 'selected' : ''}
                onClick={() => setTab(key)}
                aria-pressed={activeTab === key}
              >
                <Icon size={19} />
                <span>{t(fr, da)}</span>
                {key === 'requests' && inbox.some((r) => r.status === 'new') && (
                  <span className="nav-count">
                    {inbox.filter((r) => r.status === 'new').length}
                  </span>
                )}
              </button>
            </div>
          ))}
        </nav>
        {auth && (
          <button className="text-button" onClick={logout}>
            {t('Se déconnecter', 'خرج من الحساب')}
          </button>
        )}
        {canAdmin && (
          <a className="secondary small full" href="/admin">
            <Settings size={16} />
            {t('Administration', 'الإدارة')}
          </a>
        )}
        <div className="sidebar-note">
          <Clock size={18} />
          <p>{t('Une page à jour fait la différence.', 'صفحة محيّنة كتدير الفرق.')}</p>
        </div>
      </aside>
      <div className="workspace-main">
        {loaded && auth && !id && (
          <div className="callout">
            <p>
              {t(
                'Bienvenue ! Complétez votre première carte ci-dessous, puis cliquez sur Enregistrer. Vous pourrez la publier et la partager ensuite.',
                'مرحبا! عمّر الكارط الأولى ديالك وضغط على سجّل. من بعد تقدر تنشرها وتشاركها.',
              )}
            </p>
          </div>
        )}
        <div className="workspace-head">
          <div>
            <span className="eyebrow">
              <span dir="ltr">SoraLink</span> / {t('ESPACE CLIENT', 'حساب الزبون')}
            </span>
            <h1>{t(current[2], current[3])}</h1>
            <p className="workspace-intro">
              {t(
                'Personnalisez, enregistrez et partagez votre présence digitale.',
                'خصّص، سجّل وشارك الحضور الرقمي ديالك.',
              )}
            </p>
          </div>
          {auth && (
            <button disabled={busy} className="primary" onClick={save}>
              <Save size={17} />
              {t('Enregistrer', 'سجّل')}
            </button>
          )}
        </div>
        {(!loaded || authLoading) && !auth ? (
          <div className="empty session-loading" role="status" aria-live="polite">
            <span className="session-loading-dot" />
            <h2>{t('Chargement de votre espace', 'كنحمّلو الحساب ديالك')}</h2>
            <p>
              {t(
                'Vérification de votre session et récupération de votre carte…',
                'كنتحققو من الدخول وكنجيبو الكارط ديالك…',
              )}
            </p>
          </div>
        ) : authLoadError && !auth ? (
          <div className="empty">
            <h2>{t('Votre espace n’a pas pu être chargé', 'ما قدرناش نحمّلو الحساب')}</h2>
            <p>{t('Réessayez de charger votre espace.', 'عاود جرّب تحمّل الحساب.')}</p>
            <button className="primary" onClick={() => load()}>
              {t('Réessayer', 'عاود جرّب')}
            </button>
          </div>
        ) : !auth ? (
          <div className="empty">
            <LayoutDashboard size={44} />
            <h2>{t('Votre espace professionnel', 'الحساب المهني ديالك')}</h2>
            <p>
              {t(
                'Connectez-vous avec votre e-mail ou créez votre compte SoraLink.',
                'دخل بالإيميل ديالك ولا صايب حساب SoraLink.',
              )}
            </p>
            <a className="primary" href="/auth" target="_top">
              {t('Se connecter / Créer un compte', 'دخل / صايب حساب')}
            </a>
            <button className="text-button" onClick={() => load()}>
              {t('Actualiser', 'حدّث')}
            </button>
          </div>
        ) : (
          <div className="workspace-editor-layout">
            <div className="workspace-tab-content">
              {(activeTab === 'coordinates' || tab === 'profile') && (
                <>
                  <section className="panel">
                    <div className="panel-title">
                      <h2>{t('Vos coordonnées et identité', 'معلومات التواصل والهوية')}</h2>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={published}
                          onChange={(e) => setPublished(e.target.checked)}
                        />
                        {t('Page publiée', 'الصفحة منشورة')}
                      </label>
                    </div>
                    <h3>{t('Portrait, logo et couverture', 'التصويرة، اللوگو والغلاف')}</h3>
                    <div className="form-grid">
                      <label className="field">
                        {t('Portrait / logo', 'التصويرة / اللوگو')}
                        <input
                          type="file"
                          disabled={busy}
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => {
                            const f = e.currentTarget.files?.[0];
                            e.currentTarget.value = '';
                            if (f) startCrop(f, 'avatar');
                          }}
                        />
                        {data.avatar && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'center',
                              marginTop: '6px',
                            }}
                          >
                            <button
                              type="button"
                              className="secondary small"
                              disabled={busy}
                              onClick={() => startCrop(rawSources?.avatar || data.avatar, 'avatar')}
                            >
                              <Crop size={15} />
                              {t('Recadrer le portrait / logo', 'قصّ التصويرة / اللوگو')}
                            </button>
                            <button
                              type="button"
                              className="text-button"
                              disabled={busy}
                              onClick={() => setData({ ...data, avatar: '' })}
                            >
                              {t('Retirer', 'حيّد')}
                            </button>
                          </div>
                        )}
                      </label>
                      <label className="field">
                        {t('Image de couverture', 'تصويرة الغلاف')}
                        <input
                          type="file"
                          disabled={busy}
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            const f = e.currentTarget.files?.[0];
                            e.currentTarget.value = '';
                            if (f) startCrop(f, 'cover');
                          }}
                        />
                        {data.cover && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'center',
                              marginTop: '6px',
                            }}
                          >
                            <button
                              type="button"
                              className="secondary small"
                              disabled={busy}
                              onClick={() => startCrop(rawSources?.cover || data.cover, 'cover')}
                            >
                              <Crop size={15} />
                              {t('Recadrer la couverture', 'قصّ الغلاف')}
                            </button>
                            <button
                              type="button"
                              className="text-button"
                              disabled={busy}
                              onClick={() => setData({ ...data, cover: '' })}
                            >
                              {t('Retirer', 'حيّد')}
                            </button>
                          </div>
                        )}
                      </label>
                    </div>
                    <h3>{t('Informations professionnelles', 'المعلومات المهنية')}</h3>
                    <div className="form-grid">
                      {field('name', t('Nom complet *', 'الاسم الكامل *'))}
                      {field('job', t('Profession', 'المهنة'))}
                      {field('business', t('Entreprise / cabinet', 'المقاولة / المكتب'))}
                      {field('phone', t('Téléphone', 'التلفون'), 'tel')}
                      {field('email', t('E-mail', 'الإيميل'), 'email')}
                      {field('whatsapp', 'WhatsApp (+212…)', 'tel')}
                      {field('address', t('Adresse', 'العنوان'))}
                      {field('website', t('Site web', 'الموقع'), 'url')}
                    </div>
                    <h3>{t('Réseaux sociaux', 'مواقع التواصل')}</h3>
                    <div className="form-grid">
                      {socialFields.map(([key, label]) => (
                        <div key={key}>{field(key, label, 'url')}</div>
                      ))}
                    </div>
                    <h3>{t('Localisation et itinéraire', 'الموقع والطريق')}</h3>
                    <div className="form-grid">
                      {field(
                        'mapsUrl',
                        t('Lien Google Maps (facultatif)', 'رابط Google Maps (اختياري)'),
                        'url',
                      )}
                      {field(
                        'mapDestination',
                        t(
                          'Adresse précise ou coordonnées GPS',
                          'العنوان بالتدقيق ولا إحداثيات GPS',
                        ),
                      )}
                    </div>
                    <p className="hint">
                      {t(
                        'Collez le lien partagé depuis Google Maps. Pour un itinéraire précis, renseignez l’adresse complète avec la ville ou les coordonnées latitude, longitude. Sinon, votre adresse est utilisée.',
                        'لسق الرابط من Google Maps. باش يكون الطريق دقيق، كتب العنوان كامل مع المدينة ولا إحداثيات GPS. إلا خليتيه خاوي، كنستعملو العنوان ديالك.',
                      )}
                    </p>
                    <h3>{t('Avis Google (Réputation)', 'تقييمات Google (السمعة)')}</h3>
                    <div className="form-grid">
                      {field(
                        'googleReview',
                        t('Lien direct d’avis Google', 'رابط مباشر لتقييمات Google'),
                        'url',
                      )}
                    </div>
                    <p className="hint">
                      {t(
                        'Collez votre lien d’avis Google Business (ex: https://g.page/r/.../review). Un badge 5 étoiles s’affichera sur votre carte pour inciter vos clients à vous laisser un avis positif.',
                        'لسق رابط تقييم Google ديال المحل ديالك. غادي يبان بانر ديال 5 نجوم باش يشجع الزبناء يخليو ليك تقييم.',
                      )}
                    </p>
                    <label className="field">
                      {t('Présentation', 'التقديم')}
                      <textarea
                        maxLength={800}
                        value={data.bio}
                        onChange={(e) => setData({ ...data, bio: e.target.value })}
                      />
                    </label>
                    <p className="hint">
                      {t(
                        'Renseignez vos coordonnées, logo, couverture et présentation. Enregistrez pour mettre à jour votre page.',
                        'عمّر المعلومات ديالك، اللوگو، الغلاف والتقديم. سجّل باش تحدّث الصفحة.',
                      )}
                    </p>
                    <button className="primary full" disabled={busy} onClick={save}>
                      <Save size={17} />
                      {t('Enregistrer les modifications', 'سجّل التغييرات')}
                    </button>
                  </section>
                </>
              )}
              {(activeTab === 'content' ||
                tab === 'catalogue' ||
                tab === 'promotions' ||
                tab === 'media') && (
                <>
                  <CatalogEditor
                    data={data}
                    setData={setData}
                    subscription={subscription}
                    ar={ar}
                    busy={busy}
                    save={save}
                    onMessage={setMsg}
                    mediaEditor={<CatalogMediaEditor context={context} />}
                    initialTab={tab === 'media' ? 'media' : undefined}
                  />

                  <section className="panel">
                    <h2>{t('Promotions & Offres du moment', 'العروض والتخفيضات الحالية')}</h2>
                    <p className="hint">
                      {t(
                        'Vos offres apparaissent en tête de votre catalogue sous Produits et services. Les dates suivent l’heure du Maroc ; la date de fin est incluse. Enregistrez pour publier vos changements.',
                        'العروض كيبانو فالأول ديال الكاتالوگ تحت قسم المنتجات والخدمات. التواريخ بتوقيت المغرب، ونهار النهاية داخل فالعرض. سجّل باش تبان التغييرات.',
                      )}
                    </p>
                    {data.promotions.map((p: any, i: number) => (
                      <div className="promotion-editor" key={p.id}>
                        <div className="panel-title">
                          <h3>
                            {t('Promotion ', 'عرض ')}
                            {i + 1}
                          </h3>
                          <span className="badge">
                            {t(...promoStatusLabels[promotionStatus(p, promoToday)])}
                          </span>
                        </div>
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={p.enabled}
                            onChange={(e) => updatePromotion(p.id, 'enabled', e.target.checked)}
                          />
                          {t('Activer cette promotion', 'فعّل هاد العرض')}
                        </label>
                        <label className="field">
                          {t('Titre *', 'العنوان *')}
                          <input
                            maxLength={120}
                            value={p.title}
                            onChange={(e) => updatePromotion(p.id, 'title', e.target.value)}
                          />
                        </label>
                        <label className="field">
                          {t('Description', 'الوصف')}
                          <textarea
                            maxLength={800}
                            value={p.description}
                            onChange={(e) => updatePromotion(p.id, 'description', e.target.value)}
                          />
                        </label>
                        <div className="form-grid">
                          {[
                            [
                              'regularPrice',
                              'Prix habituel (DH) — facultatif',
                              'الثمن العادي (درهم) — اختياري',
                            ],
                            [
                              'promoPrice',
                              'Prix promotionnel (DH) — facultatif',
                              'ثمن العرض (درهم) — اختياري',
                            ],
                          ].map(([key, fr, da]) => (
                            <label className="field" key={key}>
                              {t(fr, da)}
                              <input
                                inputMode="decimal"
                                maxLength={12}
                                value={p[key]}
                                onChange={(e) => updatePromotion(p.id, key, e.target.value)}
                              />
                            </label>
                          ))}
                          {[
                            ['startDate', 'Date de début — facultative', 'نهار البداية — اختياري'],
                            ['endDate', 'Date de fin — facultative', 'نهار النهاية — اختياري'],
                          ].map(([key, fr, da]) => (
                            <label className="field" key={key}>
                              {t(fr, da)}
                              <input
                                type="date"
                                value={p[key]}
                                min={key === 'endDate' ? p.startDate : undefined}
                                onChange={(e) => updatePromotion(p.id, key, e.target.value)}
                              />
                            </label>
                          ))}
                        </div>
                        <label className="field">
                          {t(
                            'Photo de la promotion — JPG, PNG, WebP · 10 Mo',
                            'تصويرة العرض — JPG، PNG، WebP · 10 Mo',
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            disabled={busy}
                            onChange={(e) => {
                              const f = e.currentTarget.files?.[0];
                              e.currentTarget.value = '';
                              if (f) void uploadPromotion(f, p.id);
                            }}
                          />
                        </label>
                        {p.image && (
                          <div className="promotion-photo">
                            <img src={p.image} alt={p.title || t('Promotion', 'عرض')} />
                            <button
                              className="secondary small"
                              disabled={busy}
                              onClick={() => updatePromotion(p.id, 'image', '')}
                            >
                              {t('Retirer la photo', 'حيّد التصويرة')}
                            </button>
                          </div>
                        )}
                        <button
                          className="text-button"
                          disabled={busy}
                          onClick={() =>
                            setData((d: any) => ({
                              ...d,
                              promotions: d.promotions.filter((x: any) => x.id !== p.id),
                            }))
                          }
                        >
                          {t('Supprimer cette promotion', 'مسح هاد العرض')}
                        </button>
                      </div>
                    ))}
                    <button
                      className="secondary"
                      disabled={busy || data.promotions.length >= MAX_PROMOTIONS}
                      onClick={() =>
                        setData((d: any) => ({
                          ...d,
                          promotions: [
                            ...d.promotions,
                            {
                              id: crypto.randomUUID(),
                              title: '',
                              description: '',
                              image: '',
                              regularPrice: '',
                              promoPrice: '',
                              startDate: '',
                              endDate: '',
                              enabled: true,
                            },
                          ],
                        }))
                      }
                    >
                      <Plus size={16} />
                      {t('Ajouter une promo', 'زيد عرض')} ({data.promotions.length}/{MAX_PROMOTIONS}
                      )
                    </button>
                    {!data.promotions.length && (
                      <p className="hint">
                        {t('Ajoutez votre première offre spéciale.', 'زيد أول عرض خاص ديالك.')}
                      </p>
                    )}
                  </section>
                </>
              )}
              {(activeTab === 'interface' || tab === 'sections') && (
                <>
                  <section className="panel">
                    <h2>{t('Interface et style de la carte', 'الواجهة وستايل الكارط')}</h2>
                    <p className="hint">
                      {t(
                        'Personnalisez l’apparence visuelle, les couleurs, les polices et l’affichage de votre carte.',
                        'خصّص المظهر، الألوان، الخطوط وطريقة العرض فالكارط ديالك.',
                      )}
                    </p>
                    <BackgroundEditor
                      data={data}
                      setData={setData}
                      ar={ar}
                      busy={busy}
                      startCrop={startCrop}
                      source={rawSources?.backgroundPhoto}
                    />
                    <Customization data={data} setData={setData} ar={ar} setAr={setAr} t={t} />
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button disabled={busy} className="primary" onClick={save}>
                        <Save size={17} />
                        {t('Enregistrer les modifications', 'سجّل التغييرات')}
                      </button>
                    </div>
                  </section>
                  <section className="panel">
                    <h2>{t('Mes sections', 'الأقسام ديالي')}</h2>
                    <p className="hint">
                      {t(
                        'Choisissez les sections visibles et leur ordre. L’identité reste en tête. Les sections vides ne s’affichent pas. Enregistrez pour appliquer les changements à la carte publique.',
                        'اختار الأقسام اللي يبانوا وترتيبهم. المعلومات كتبقى فاللول والأقسام الخاوية ما كيبانوش. سجّل باش يتطبق التغيير فالصفحة العمومية.',
                      )}
                    </p>
                    {appearance(data)
                      .order.filter((key) => !['photos', 'video'].includes(key))
                      .map((key, i) => {
                        const a = {
                            ...appearance(data),
                            order: appearance(data).order.filter(
                              (key) => !['photos', 'video'].includes(key),
                            ),
                          },
                          locked = key === 'appointments' && !data.pro;
                        const destinations: Record<string, string> = {
                          coordinates: 'coordinates',
                          social: 'coordinates',
                          promotions: 'content',
                          services: 'content',
                          photos: 'content',
                          pdf: 'content',
                          video: 'content',
                          links: 'coordinates',
                          appointments: 'schedule',
                        };
                        return (
                          <div className="section-editor-row" key={key}>
                            <div className="section-control">
                              <label>
                                <input
                                  type="checkbox"
                                  disabled={locked}
                                  checked={!locked && !a.hidden.includes(key)}
                                  onChange={(e) =>
                                    setData((d: any) => ({
                                      ...d,
                                      hiddenSections: e.target.checked
                                        ? a.hidden.filter((k: string) => k !== key)
                                        : [...a.hidden, key],
                                    }))
                                  }
                                />
                                {t(...sectionLabels[key])}
                                {locked && <small> · {t('Option Pro requise', 'خاص Pro')}</small>}
                              </label>
                              <label className="section-position">
                                {t('Position', 'الترتيب')}
                                <select
                                  value={i}
                                  disabled={locked}
                                  aria-label={
                                    t('Position de ', 'ترتيب ') + t(...sectionLabels[key])
                                  }
                                  onChange={(e) => {
                                    const index = Number(e.target.value);
                                    const order = [...a.order];
                                    order.splice(i, 1);
                                    order.splice(index, 0, key);
                                    setData((d: any) => ({ ...d, sectionOrder: order }));
                                  }}
                                >
                                  {a.order.map((_, n) => (
                                    <option key={n} value={n}>
                                      {n + 1}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            <label className="field">
                              {t('Titre personnalisé · français', 'عنوان شخصي · الدارجة')}
                              <input
                                maxLength={120}
                                disabled={locked}
                                value={data.sectionTitles?.[ar ? 'ar' : 'fr']?.[key] || ''}
                                placeholder={t(...sectionLabels[key])}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setData((d: any) => ({
                                    ...d,
                                    sectionTitles: {
                                      ...d.sectionTitles,
                                      [ar ? 'ar' : 'fr']: {
                                        ...d.sectionTitles?.[ar ? 'ar' : 'fr'],
                                        [key]: value,
                                      },
                                    },
                                  }));
                                }}
                              />
                            </label>
                            <button
                              className="text-button"
                              disabled={locked}
                              onClick={() => setTab(destinations[key])}
                            >
                              {t('Modifier le contenu', 'بدّل المحتوى')}
                            </button>
                          </div>
                        );
                      })}
                    <button className="primary full" disabled={busy} onClick={save}>
                      <Save size={17} />
                      {t('Enregistrer les modifications', 'سجّل التغييرات')}
                    </button>
                  </section>
                </>
              )}
              {tab === 'contacts' && (
                <section className="panel">
                  <div className="panel-title">
                    <h2>{t('Mes contacts', 'الكونطاكت ديالي')}</h2>
                    <button className="secondary small" onClick={() => load()} disabled={busy}>
                      {t('Actualiser', 'حدّث')}
                    </button>
                  </div>
                  <p className="hint">
                    {t(
                      'Coordonnées partagées volontairement depuis votre carte. Cette liste est réservée à votre compte.',
                      'معلومات التواصل اللي تشاركات معاك بموافقة أصحابها من الكارط ديالك. هاد اللائحة خاصة بالحساب ديالك.',
                    )}
                  </p>
                  {!contacts.length ? (
                    <div className="empty">
                      <Users size={38} />
                      <h3>
                        {t('Aucun contact reçu pour le moment', 'ما توصّلتي بحتى كونطاكت دابا')}
                      </h3>
                      <p>
                        {t(
                          'Partagez votre carte : vos visiteurs peuvent cliquer sur « Échanger nos coordonnées ».',
                          'شارك الكارط ديالك: الزوار يقدرو يضغطو على «نتبادلو معلومات التواصل».',
                        )}
                      </p>
                    </div>
                  ) : (
                    contacts.map((c) => (
                      <article className="request" key={c.id}>
                        <div>
                          <h3>{c.name}</h3>
                          <a href={'tel:' + c.phone} dir="ltr">
                            {c.phone}
                          </a>
                          {c.email && (
                            <p>
                              <a href={'mailto:' + c.email}>{c.email}</a>
                            </p>
                          )}
                          {c.message && <p>{c.message}</p>}
                          {c.sourceCardId && (
                            <p>
                              <a
                                href={'/c/' + encodeURIComponent(c.sourceCardId)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink size={15} />
                                {t('Voir sa carte SoraLink', 'شوف كارط SoraLink ديالو')}
                              </a>
                            </p>
                          )}
                          <p className="hint">
                            {t('Accord de partage reçu le ', 'توصلنا بالموافقة على المشاركة فـ ')}
                            {new Date(c.created).toLocaleString(ar ? 'ar-MA' : 'fr-MA', {
                              timeZone: 'Africa/Casablanca',
                            })}
                          </p>
                        </div>
                        <div className="request-actions">
                          {whatsappNumber(c.phone) && (
                            <a
                              className="secondary small whatsapp-notify"
                              href={'https://wa.me/' + whatsappNumber(c.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <WhatsAppIcon />
                              WhatsApp
                            </a>
                          )}
                          <button
                            className="secondary small"
                            disabled={busy}
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  t(
                                    'Supprimer définitivement ce contact ?',
                                    'بغيتي تحيد هاد الكونطاكت نهائياً؟',
                                  ),
                                )
                              )
                                return;
                              try {
                                await action({ action: 'deleteContact', id: c.id });
                                await load();
                                setMsg(t('Contact supprimé.', 'تحيد الكونطاكت.'));
                              } catch (e: any) {
                                setMsg(e.message);
                              }
                            }}
                          >
                            {t('Supprimer', 'حيّد')}
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                  <LoadMore
                    page={historyPages?.contacts}
                    busy={busy || !!historyBusy}
                    ar={ar}
                    onClick={() => {
                      void loadMoreHistory?.('contacts');
                    }}
                  />
                </section>
              )}
              {tab === 'requests' && (
                <section className="panel">
                  <div className="panel-title">
                    <h2>{t('Demandes et rendez-vous', 'الطلبات والمواعيد')}</h2>
                    {data.pro && (
                      <button
                        className="primary small"
                        onClick={() => {
                          setServiceIndex(0);
                          setModal('manual');
                        }}
                      >
                        <Plus size={16} />
                        {t('Ajouter un rendez-vous', 'زيد موعد')}
                      </button>
                    )}
                    <button className="secondary small" onClick={() => load()}>
                      {t('Actualiser', 'حدّث')}
                    </button>
                  </div>
                  <span className="badge">
                    {data.pro
                      ? t('Pro Rendez-vous actif', 'خيار المواعيد مفعّل')
                      : t('Option Pro à activer par SoraLink', 'خاص SoraLink يفعّل خيار المواعيد')}
                  </span>
                  <p className="hint">
                    {t(
                      'Le bouton WhatsApp prépare un message avec le statut actuel. Vérifiez-le puis appuyez sur Envoyer dans WhatsApp.',
                      'زر واتساب كيوجد رسالة بالحالة الحالية. راجعها ومن بعد ضغط على إرسال فواتساب.',
                    )}
                  </p>
                  <p className="hint">
                    {mailConfigured
                      ? t(
                          'Notifications e-mail activées : envoi sous quelques minutes. Le statut indique l’acceptation par le service, pas la livraison en boîte de réception.',
                          'الإشعارات مفعّلة: الإيميل كيتسيفط فدقايق. الحالة كتعني قبول الخدمة، ماشي الوصول للبريد.',
                        )
                      : t('Les demandes restent disponibles ici.', 'الطلبات كيبقاو هنا.')}
                  </p>
                  {!inbox.length ? (
                    <div className="empty">
                      <Calendar size={38} />
                      <h3>{t('Aucune demande pour le moment', 'ما كاين حتى طلب دابا')}</h3>
                      <p>
                        {t(
                          'Publiez votre carte puis partagez son lien.',
                          'نشر الكارط وشارك الرابط ديالها.',
                        )}
                      </p>
                    </div>
                  ) : (
                    inbox.map((r) => (
                      <article className="request" key={r.id}>
                        <div>
                          <span className="badge">
                            {requestKind(r.kind, ar)} · {requestStatus(r.status, ar)}
                          </span>
                          <h3>{r.name}</h3>
                          <a href={'tel:' + r.phone}>{r.phone}</a>
                          <p>{r.message}</p>
                          {r.service && (
                            <p>
                              {r.kind === 'rdv'
                                ? r.service + ' · ' + r.duration + ' min'
                                : t('Article demandé : ', 'العرض المطلوب: ') + r.service}
                            </p>
                          )}
                          {r.email && (
                            <a
                              href={
                                'mailto:' +
                                r.email +
                                '?subject=' +
                                encodeURIComponent(
                                  t('Votre demande — ', 'الطلب ديالك — ') + data.name,
                                ) +
                                '&body=' +
                                encodeURIComponent(requestReply(r, data.name, ar))
                              }
                            >
                              {t('Préparer un e-mail', 'وجد إيميل')} · {r.email}
                            </a>
                          )}
                          {r.slot && (
                            <p>
                              <Calendar size={15} /> {r.slot.replace('T', ' · ')} · Maroc
                            </p>
                          )}
                        </div>
                        <div className="request-actions">
                          {whatsappNotification(r, data.business || data.name, ar) ? (
                            <a
                              className="secondary small whatsapp-notify"
                              href={whatsappNotification(r, data.business || data.name, ar)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <WhatsAppIcon />
                              {t('Préparer un message WhatsApp', 'وجد رسالة واتساب')}
                            </a>
                          ) : (
                            <span className="hint">
                              {t(
                                'WhatsApp indisponible : numéro manquant ou invalide.',
                                'واتساب ما متوفرش: النمرة ناقصة أو ما صحيحةش.',
                              )}
                            </span>
                          )}
                          {notifications
                            .filter((n) => n.request_id === r.id)
                            .slice(0, 2)
                            .map((n, i) => (
                              <span className="badge" key={i}>
                                {(n.id.includes(':new:')
                                  ? t('E-mail professionnel : ', 'إيميل المهني: ')
                                  : t('E-mail visiteur : ', 'إيميل الزائر: ')) +
                                  t(
                                    (
                                      {
                                        pending: 'En attente',
                                        processing: 'En cours',
                                        accepted: 'Accepté par le service',
                                        failed: 'Échec d’envoi',
                                      } as any
                                    )[n.state] || n.state,
                                    (
                                      {
                                        pending: 'فانتظار الإرسال',
                                        processing: 'كيتسيفط',
                                        accepted: 'تقبلاتو الخدمة',
                                        failed: 'ما تسيفطش',
                                      } as any
                                    )[n.state] || n.state,
                                  )}
                              </span>
                            ))}
                          {[
                            ['confirmed', 'Confirmer', 'أكّد'],
                            ['done', 'Traiter', 'تعالج'],
                            ['cancelled', 'Annuler', 'لغي'],
                          ].map(([s, f, a]) => (
                            <button
                              className="secondary small"
                              key={s}
                              disabled={busy || r.status === s}
                              onClick={async () => {
                                try {
                                  await action({ action: 'status', id: r.id, status: s });
                                  await load();
                                } catch (e: any) {
                                  setMsg(e.message);
                                }
                              }}
                            >
                              {t(f, a)}
                            </button>
                          ))}
                        </div>
                      </article>
                    ))
                  )}
                  <LoadMore
                    page={historyPages?.requests}
                    busy={busy || !!historyBusy}
                    ar={ar}
                    onClick={() => {
                      void loadMoreHistory?.('requests');
                    }}
                  />
                </section>
              )}
              {tab === 'schedule' && (
                <section className="panel">
                  <h2>{t('Horaires et disponibilités', 'الأوقات والمواعيد')}</h2>
                  <p className="hint">
                    {t(
                      'Horaires au Maroc. Les visiteurs proposent un créneau, puis vous le confirmez. Enregistrez vos modifications.',
                      'الأوقات بتوقيت المغرب. الزوار كيطلبو الموعد ونتا كتأكدو. سجّل التغييرات.',
                    )}
                  </p>
                  {['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(
                    (day, n) => (
                      <div className="schedule-day" key={n}>
                        <label>
                          <input
                            type="checkbox"
                            checked={!!data.hours?.[n]}
                            onChange={(e) => {
                              const hours = { ...data.hours };
                              if (e.target.checked) hours[n] = ['09:00', '17:00'];
                              else delete hours[n];
                              setData({ ...data, hours });
                            }}
                          />
                          {t(
                            day,
                            [
                              'الأحد',
                              'الاثنين',
                              'الثلاثاء',
                              'الأربعاء',
                              'الخميس',
                              'الجمعة',
                              'السبت',
                            ][n],
                          )}
                        </label>
                        {data.hours?.[n] &&
                          [0, 1].map((i) => (
                            <input
                              key={i}
                              type="time"
                              step="900"
                              aria-label={i ? 'Fermeture' : 'Ouverture'}
                              value={data.hours[n][i]}
                              onChange={(e) => {
                                const hours = { ...data.hours, [n]: [...data.hours[n]] };
                                hours[n][i] = e.target.value;
                                setData({ ...data, hours });
                              }}
                            />
                          ))}
                      </div>
                    ),
                  )}
                  <hr />
                  <div className="form-grid">
                    {field('breakStart', t('Début de pause', 'بداية الاستراحة'), 'time')}
                    {field('breakEnd', t('Fin de pause', 'نهاية الاستراحة'), 'time')}
                  </div>
                  <label className="field">
                    {t(
                      'Jours de fermeture · une date par ligne (AAAA-MM-JJ)',
                      'أيام الإغلاق · تاريخ فكل سطر (AAAA-MM-JJ)',
                    )}
                    <textarea
                      value={(data.closures || []).join('\n')}
                      onChange={(e) => setData({ ...data, closures: e.target.value.split('\n') })}
                    />
                  </label>
                  <h3>{t('Types de rendez-vous · maximum 5', 'أنواع المواعيد · حتى 5')}</h3>
                  {(data.appointmentServices || []).map((v: any, i: number) => (
                    <div className="service-edit" key={i}>
                      <input
                        aria-label="Prestation"
                        value={v.name}
                        onChange={(e) => {
                          const a = [...data.appointmentServices];
                          a[i] = { ...v, name: e.target.value };
                          setData({ ...data, appointmentServices: a });
                        }}
                      />
                      <select
                        aria-label="Durée"
                        value={v.duration}
                        onChange={(e) => {
                          const a = [...data.appointmentServices];
                          a[i] = { ...v, duration: Number(e.target.value) };
                          setData({ ...data, appointmentServices: a });
                        }}
                      >
                        {[15, 30, 45, 60, 90, 120].map((n) => (
                          <option key={n} value={n}>
                            {n} min
                          </option>
                        ))}
                      </select>
                      <button
                        aria-label="Retirer"
                        onClick={() =>
                          setData({
                            ...data,
                            appointmentServices: data.appointmentServices.filter(
                              (_: any, n: number) => i !== n,
                            ),
                          })
                        }
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    className="secondary"
                    disabled={(data.appointmentServices || []).length >= 5}
                    onClick={() =>
                      setData({
                        ...data,
                        appointmentServices: [
                          ...(data.appointmentServices || []),
                          { name: '', duration: 30 },
                        ],
                      })
                    }
                  >
                    <Plus size={16} />
                    {t('Ajouter une prestation', 'زيد خدمة')}
                  </button>
                  <p className="hint">
                    {t(
                      'L’option Pro doit être activée par SoraLink pour afficher les créneaux au public.',
                      'خاص SoraLink يفعّل Pro باش يبان الوقت للزوار.',
                    )}
                  </p>
                </section>
              )}
              {tab === 'share' && (
                <section className="panel">
                  <AddressEditor
                    current={publicName}
                    onChange={setPublicName}
                    ar={ar}
                    disabled={!id || busy}
                  />
                  <div className="impact-stats-grid">
                    <div className="impact-stat-card">
                      <span className="impact-stat-value">{contacts.length}</span>
                      <span className="impact-stat-label">
                        {t('Contacts collectés', 'جهات اتصال مستلمة')}
                      </span>
                    </div>
                    <div className="impact-stat-card">
                      <span className="impact-stat-value">{inbox.length}</span>
                      <span className="impact-stat-label">
                        {t('Demandes reçues', 'طلبات متوصل بها')}
                      </span>
                    </div>
                    <div className="impact-stat-card">
                      <span className="impact-stat-value">{published ? '100%' : '0%'}</span>
                      <span className="impact-stat-label">
                        {published ? t('Page en ligne', 'الصفحة منشورة') : t('Brouillon', 'مسودة')}
                      </span>
                    </div>
                  </div>
                  <h2>
                    {t(
                      'Une page. Plusieurs façons de la partager.',
                      'صفحة وحدة. طرق بزاف للمشاركة.',
                    )}
                  </h2>
                  {id ? (
                    <>
                      <div className="share-box">
                        {qr && <img src={qr} alt="QR code" />}
                        <div>
                          <label className="field">
                            {t('Votre lien permanent', 'الرابط الدائم ديالك')}
                            <input
                              readOnly
                              value={
                                typeof window !== 'undefined'
                                  ? location.origin + publicCardPath(id, publicName)
                                  : ''
                              }
                            />
                          </label>
                          <div className="row">
                            <button
                              className="primary"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(
                                    location.origin + publicCardPath(id, publicName),
                                  );
                                  setMsg(t('Lien copié', 'تنسخ الرابط'));
                                } catch {
                                  setMsg(
                                    t('Copiez le lien depuis le champ.', 'نسخ الرابط من الخانة.'),
                                  );
                                }
                              }}
                            >
                              <Copy size={16} />
                              {t('Copier', 'نسخ')}
                            </button>
                            <a
                              className="secondary"
                              href={publicCardPath(id, publicName)}
                              target="_blank"
                            >
                              {t('Ouvrir', 'فتح')}
                              <ExternalLink size={15} />
                            </a>
                          </div>
                        </div>
                      </div>
                      <button
                        className="secondary"
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = qr;
                          a.download = 'soralink-qr.png';
                          a.click();
                        }}
                      >
                        <Download size={16} />
                        {t('Télécharger le QR', 'حمّل QR')}
                      </button>
                      <p className="hint">
                        {published
                          ? t(
                              'La page est publiée après enregistrement.',
                              'الصفحة كتتنشر من بعد التسجيل.',
                            )
                          : t(
                              'Activez « Page publiée » puis enregistrez pour rendre ce lien consultable.',
                              'فعّل «الصفحة منشورة» ومن بعد سجّل.',
                            )}
                      </p>
                    </>
                  ) : (
                    <p>
                      {t(
                        'Enregistrez votre carte pour créer votre lien et votre QR.',
                        'سجّل الكارط باش تصايب الرابط والـ QR.',
                      )}
                    </p>
                  )}
                </section>
              )}
              {tab === 'orders' && (
                <section className="panel">
                  <h2>{t('Mon offre et mes supports', 'العرض والكارطات ديالي')}</h2>
                  {subscription && (
                    <div className="callout">
                      <div>
                        <h3>
                          {offerLabel(subscription.plan, ar)} ·{' '}
                          {subscription.state === 'active'
                            ? t('Actif', 'مفعّل')
                            : subscription.state === 'suspended'
                              ? t('Suspendu', 'موقوف')
                              : t('Essai', 'تجربة')}
                        </h3>
                        <p>
                          {subscription.expires
                            ? t('Échéance : ', 'نهاية الاشتراك : ') +
                              subscription.expires.slice(0, 10)
                            : t(
                                'Échéance à définir par SoraLink',
                                'SoraLink غادي يحدّد نهاية الاشتراك',
                              )}
                        </p>
                      </div>
                    </div>
                  )}
                  <p className="muted">
                    {t(
                      'Demandes enregistrées pour suivi. Aucun paiement n’est encaissé ici.',
                      'الطلبات كتتسجّل للتتبع. ما كاين حتى أداء هنا.',
                    )}
                  </p>
                  <div className="order-options">
                    {[
                      ['Digital', 149],
                      ['Pack', 349],
                      ['Accompagnement', 549],
                      ['Pro', 250],
                    ].map(([n, p]) => (
                      <button
                        key={n}
                        className="secondary"
                        disabled={busy}
                        onClick={async () => {
                          try {
                            await action({ action: 'order', plan: n });
                            await load();
                            setMsg(
                              t('Votre demande d’offre est enregistrée.', 'تسجّل طلب العرض ديالك.'),
                            );
                          } catch (e: any) {
                            setMsg(e.message);
                          }
                        }}
                      >
                        {offerLabel(String(n), ar)}
                        <b>
                          {p} {t('DH', 'درهم')}
                        </b>
                      </button>
                    ))}
                  </div>
                  {orders.map((o) => (
                    <div className="request" key={o.id}>
                      <strong>{offerLabel(o.plan, ar)}</strong>
                      <span className="badge">
                        {t(
                          (
                            {
                              pending: 'En attente',
                              paid: 'Paiement confirmé',
                              design: 'Visuel à valider',
                              production: 'En fabrication',
                              ready: 'Prête',
                              shipped: 'Expédiée',
                              delivered: 'Remise',
                              cancelled: 'Annulée',
                            } as any
                          )[o.status] || o.status,
                          (
                            {
                              pending: 'فانتظار الأداء',
                              paid: 'تخلّص',
                              design: 'التصميم',
                              production: 'فالتحضير',
                              ready: 'واجدة',
                              shipped: 'تسيفطات',
                              delivered: 'تسلّمات',
                              cancelled: 'تلغات',
                            } as any
                          )[o.status] || o.status,
                        )}
                      </span>
                      <span>{o.created.slice(0, 10)}</span>
                    </div>
                  ))}
                  <LoadMore
                    page={historyPages?.orders}
                    busy={busy || !!historyBusy}
                    ar={ar}
                    onClick={() => {
                      void loadMoreHistory?.('orders');
                    }}
                  />
                  <div className="callout">
                    <Phone />
                    <p>
                      {t(
                        'Contact : soratap08@gmail.com. Paiement manuel après confirmation. Les coordonnées bancaires et frais de livraison restent à compléter.',
                        'معلومات التواصل التجاري، التحويل والتوصيل غادي يتزادو قبل الإطلاق.',
                      )}
                    </p>
                  </div>
                </section>
              )}
            </div>
            <div
              className="workspace-card-preview"
              role="region"
              aria-label={t('Aperçu de votre carte', 'معاينة الكارط ديالك')}
            >
              <div className="preview-heading">
                <span className="eyebrow">{t('APERÇU EN DIRECT', 'معاينة مباشرة')}</span>
                <span className="preview-live-dot" aria-hidden="true" />
              </div>
              <Card d={data} preview withSections />
              <p className="preview-caption">
                {t(
                  'Votre carte évolue pendant vos modifications.',
                  'الكارط كتبدّل مباشرة مع التعديلات ديالك.',
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
