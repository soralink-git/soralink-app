'use client';
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
  Video,
  Package,
} from 'lucide-react';

import { type CardViewProps } from './card-view';
import { WhatsAppIcon } from './card-helpers';

import { recordedVideoUrl } from './lib/content-media';

import { whatsappNumber, whatsappNotification } from './lib/whatsapp-notification';
import { MAX_CATALOGUE_ITEMS } from './lib/catalogue';
import { appearance } from './lib/personalization';
import { MAX_PROMOTIONS, promotionStatus } from './lib/promotions';

export type DashboardContext = {
  Card: (props: CardViewProps) => JSX.Element;
  Customization: () => JSX.Element;
  action: (body: any) => Promise<any>;
  ar: boolean;
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
  inbox: any[];
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
  save: () => Promise<void>;
  sectionLabels: Record<string, [string, string]>;
  setData: Dispatch<any>;
  setModal: Dispatch<SetStateAction<string>>;
  setMsg: Dispatch<SetStateAction<string>>;
  setPublished: Dispatch<SetStateAction<boolean>>;
  setServiceIndex: Dispatch<SetStateAction<number>>;
  setTab: Dispatch<SetStateAction<string>>;
  socialFields: string[][];
  startCrop: (source: string | File, target: 'avatar' | 'cover') => void;
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
  } = context;
  const tabs = [
    ['coordinates', Phone, 'Coordonnées', 'معلومات التواصل', 'card'],
    ['content', Package, 'Contenu', 'المحتوى', 'card'],
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
                          <button
                            type="button"
                            className="secondary small"
                            disabled={busy}
                            onClick={() => startCrop(data.avatar, 'avatar')}
                          >
                            {t('Recadrer le portrait / logo', 'قصّ التصويرة / اللوگو')}
                          </button>
                        )}
                        {data.avatar && (
                          <button
                            type="button"
                            className="text-button"
                            disabled={busy}
                            onClick={() => setData({ ...data, avatar: '' })}
                          >
                            {t('Retirer le portrait / logo', 'حيّد التصويرة / اللوگو')}
                          </button>
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
                          <button
                            type="button"
                            className="secondary small"
                            disabled={busy}
                            onClick={() => startCrop(data.cover, 'cover')}
                          >
                            {t('Recadrer la couverture', 'قصّ الغلاف')}
                          </button>
                        )}
                        {data.cover && (
                          <button
                            type="button"
                            className="text-button"
                            disabled={busy}
                            onClick={() => setData({ ...data, cover: '' })}
                          >
                            {t('Retirer la couverture', 'حيّد الغلاف')}
                          </button>
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
                  <section className="panel">
                    <h2>{t('Mon catalogue', 'الكاتالوگ ديالي')}</h2>
                    <p className="hint">
                      {t(
                        'Présentez jusqu’à 10 produits ou services. Les visiteurs peuvent demander un article précis ; vous retrouvez sa référence dans Mes demandes. Enregistrez vos changements.',
                        'قدّم حتى 10 منتجات ولا خدمات. الزوار يقدرو يطلبو عرض معيّن، وكتلقاه فـ الطلبات ديالي. سجّل التغييرات.',
                      )}
                    </p>
                    {data.services.map((item: any, i: number) => (
                      <div className="catalogue-editor" key={item.id}>
                        <div className="panel-title">
                          <h3>
                            {t('Article ', 'عرض ')}
                            {i + 1}
                          </h3>
                          <button
                            className="secondary small"
                            disabled={busy}
                            onClick={() =>
                              setData((d: any) => ({
                                ...d,
                                services: d.services.filter((v: any) => v.id !== item.id),
                              }))
                            }
                          >
                            {t('Supprimer', 'مسح')}
                          </button>
                        </div>
                        <div className="form-grid">
                          <label className="field">
                            {t('Type', 'النوع')}
                            <select
                              value={item.type}
                              onChange={(e) => updateCatalogue(item.id, 'type', e.target.value)}
                            >
                              <option value="product">{t('Produit', 'منتج')}</option>
                              <option value="service">{t('Service', 'خدمة')}</option>
                            </select>
                          </label>
                          <label className="field">
                            {t('Nom *', 'الاسم *')}
                            <input
                              maxLength={120}
                              value={item.name}
                              onChange={(e) => updateCatalogue(item.id, 'name', e.target.value)}
                            />
                          </label>
                          <label className="field">
                            {t('Catégorie — facultative', 'الصنف — اختياري')}
                            <input
                              maxLength={80}
                              value={item.category}
                              onChange={(e) => updateCatalogue(item.id, 'category', e.target.value)}
                            />
                          </label>
                          <label className="field">
                            {t('Prix en DH — facultatif', 'الثمن بالدرهم — اختياري')}
                            <input
                              inputMode="decimal"
                              maxLength={12}
                              value={item.price}
                              onChange={(e) => updateCatalogue(item.id, 'price', e.target.value)}
                            />
                          </label>
                        </div>
                        <label className="field">
                          {t('Description', 'الوصف')}
                          <textarea
                            maxLength={800}
                            value={item.description}
                            onChange={(e) =>
                              updateCatalogue(item.id, 'description', e.target.value)
                            }
                          />
                        </label>
                        <label className="field">
                          {t('Photo — JPG, PNG, WebP · 10 Mo', 'تصويرة — JPG، PNG، WebP · 10 Mo')}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            disabled={busy}
                            onChange={(e) => {
                              const f = e.currentTarget.files?.[0];
                              e.currentTarget.value = '';
                              if (f) void uploadCatalogue(f, item.id);
                            }}
                          />
                        </label>
                        {item.image && (
                          <div className="promotion-photo">
                            <img src={item.image} alt={item.name || t('Article', 'عرض')} />
                            <button
                              className="secondary small"
                              disabled={busy}
                              onClick={() => updateCatalogue(item.id, 'image', '')}
                            >
                              {t('Retirer la photo', 'حيّد التصويرة')}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      className="secondary"
                      disabled={busy || data.services.length >= MAX_CATALOGUE_ITEMS}
                      onClick={() =>
                        setData((d: any) => ({
                          ...d,
                          services: [
                            ...d.services,
                            {
                              id: crypto.randomUUID(),
                              type: 'product',
                              name: '',
                              description: '',
                              category: '',
                              price: '',
                              image: '',
                            },
                          ],
                        }))
                      }
                    >
                      <Plus size={16} />
                      {t('Ajouter un produit ou service', 'زيد منتج ولا خدمة')} (
                      {data.services.length}/{MAX_CATALOGUE_ITEMS})
                    </button>
                  </section>

                  <section className="panel">
                    <h2>{t('Mes promos', 'العروض ديالي')}</h2>
                    <p className="hint">
                      {t(
                        'Vos offres apparaissent sous votre présentation. Les dates suivent l’heure du Maroc ; la date de fin est incluse. Enregistrez pour publier vos changements.',
                        'العروض كيبانو تحت التقديم ديالك. التواريخ بتوقيت المغرب، ونهار النهاية داخل فالعرض. سجّل باش تبان التغييرات.',
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

                  <section className="panel">
                    <h2>{t('Médias et documents', 'الوسائط والملفات')}</h2>
                    <div className="storage-summary">
                      <strong>{t('Stockage du compte', 'التخزين ديال الحساب')}</strong>
                      <p>
                        {storage
                          ? Math.ceil(storage.bytes / 1048576) +
                            ' / ' +
                            storage.limitBytes / 1048576 +
                            ' Mo · ' +
                            storage.files +
                            ' / ' +
                            storage.limitFiles +
                            ' ' +
                            t('fichiers', 'ملف')
                          : t(
                              '400 Mo maximum par compte · 80 fichiers',
                              'حتى 400 Mo لكل حساب · 80 ملف',
                            )}
                      </p>
                      <p className="hint">
                        {t(
                          'Après enregistrement, les médias retirés sont supprimés s’ils ne sont plus utilisés sur une carte. Les imports abandonnés depuis plus de 24 h sont nettoyés lors d’une prochaine action.',
                          'من بعد التسجيل، الملفات اللي حيّدتي كيتحيدو نهائياً إلا ما بقاوش مستعملين فشي كارط. الملفات اللي ترفعو وما تستعملوش كيتنقّاو من بعد 24 ساعة فإجراء جاي.',
                        )}
                      </p>
                    </div>
                    <div className="camera-actions">
                      <button
                        className="secondary"
                        disabled={busy || data.photos.length >= 10}
                        onClick={() => photoCaptureRef.current?.click()}
                      >
                        <Camera size={18} />
                        {t('Prendre une photo', 'خد تصويرة')}
                      </button>
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() => videoCaptureRef.current?.click()}
                      >
                        <Video size={18} />
                        {t('Filmer une vidéo', 'صوّر فيديو')}
                      </button>
                      <input
                        hidden
                        ref={photoCaptureRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="environment"
                        onChange={(e) => {
                          const file = e.currentTarget.files?.[0];
                          e.currentTarget.value = '';
                          if (file) void uploadPhotos([file]);
                        }}
                      />
                      <input
                        hidden
                        ref={videoCaptureRef}
                        type="file"
                        accept="video/*"
                        capture="environment"
                        onChange={(e) => {
                          const file = e.currentTarget.files?.[0];
                          e.currentTarget.value = '';
                          if (file) void uploadVideo(file);
                        }}
                      />
                    </div>
                    <p className="hint">
                      {t(
                        'Sur téléphone, utilisez la caméra. Sur PC, choisissez un fichier enregistré. Photos compressées automatiquement à 1 600 pixels maximum (40 Mo avant compression). Vidéo : 50 Mo maximum, format MP4 conseillé. Enregistrez ensuite votre carte.',
                        'فالتلفون استعمل الكاميرا. فالكمبيوتر اختار ملف مسجّل. التصاور كيتضغطو أوتوماتيكياً حتى 1600 بيكسل (حتى 40 Mo قبل الضغط) والفيديو حتى 50 Mo، والأفضل MP4. ومن بعد سجّل الكارط.',
                      )}
                    </p>
                    <div className="form-grid">
                      <label className="field">
                        {t('Galerie · 10 photos maximum', 'الگالوري · حتى 10 تصاور')}
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          disabled={busy || data.photos.length >= 10}
                          onChange={(e) => {
                            const files = Array.from(e.currentTarget.files || []);
                            e.currentTarget.value = '';
                            void uploadPhotos(files);
                          }}
                        />
                        <span className="hint">
                          {uploadProgress
                            ? t(
                                'Importation : ' + uploadProgress.done + '/' + uploadProgress.total,
                                'كنزيدو التصاور : ' +
                                  uploadProgress.done +
                                  '/' +
                                  uploadProgress.total,
                              )
                            : t(
                                'Sélectionnez plusieurs photos · JPG, PNG, WebP · 10 Mo par photo · ' +
                                  data.photos.length +
                                  '/10 utilisées',
                                'اختار تصاور بزاف · JPG، PNG، WebP · 10 Mo لكل تصويرة · ' +
                                  data.photos.length +
                                  '/10 مستعملين',
                              )}
                        </span>
                      </label>
                      <label className="field">
                        {t('Catalogue PDF · maximum 10 Mo', 'كاتالوگ PDF · حتى 10 Mo')}
                        <input
                          type="file"
                          disabled={busy}
                          accept="application/pdf"
                          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], 'pdf')}
                        />
                      </label>
                      <label className="field">
                        {t(
                          'Vidéo enregistrée · 1 vidéo, maximum 50 Mo',
                          'فيديو مسجّل · فيديو واحد، حتى 50 Mo',
                        )}
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          disabled={busy}
                          onChange={(e) => {
                            const file = e.currentTarget.files?.[0];
                            e.currentTarget.value = '';
                            if (file) void uploadVideo(file);
                          }}
                        />
                        <span className="hint">
                          {t(
                            'Une nouvelle vidéo remplace la vidéo actuelle sur votre carte après enregistrement.',
                            'الفيديو الجديد كيبدّل الفيديو الحالي فالـكارط من بعد التسجيل.',
                          )}
                        </span>
                      </label>
                      {field('video', t('Lien YouTube', 'رابط YouTube'), 'url')}
                    </div>
                    {recordedVideoUrl(data.recordedVideo) && (
                      <div className="recorded-video-preview">
                        <video
                          className="content-video"
                          src={data.recordedVideo}
                          controls
                          playsInline
                          preload="metadata"
                          aria-label={t('Aperçu de la vidéo', 'معاينة الفيديو')}
                        />
                        <button
                          className="secondary small"
                          disabled={busy}
                          onClick={() => setData({ ...data, recordedVideo: '' })}
                        >
                          {t('Retirer la vidéo', 'حيّد الفيديو')}
                        </button>
                      </div>
                    )}
                    <div className="gallery">
                      {data.photos.map((p: string, i: number) => (
                        <div key={p}>
                          <img src={p} alt={'Photo ' + (i + 1)} />
                          <button
                            onClick={() =>
                              setData({
                                ...data,
                                photos: data.photos.filter((_: any, n: number) => i !== n),
                              })
                            }
                            aria-label="Supprimer"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {data.pdf && (
                      <div className="row">
                        <a href={data.pdf} target="_blank">
                          {t('Voir le catalogue', 'شوف الكاتالوگ')}
                        </a>
                        <button onClick={() => setData({ ...data, pdf: '' })}>
                          {t('Retirer', 'حيّد')}
                        </button>
                      </div>
                    )}
                    <button className="primary full" disabled={busy} onClick={save}>
                      <Save size={17} />
                      {t('Enregistrer les modifications', 'سجّل التغييرات')}
                    </button>
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
                    <Customization />
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
                    {appearance(data).order.map((key, i) => {
                      const a = appearance(data),
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
                                aria-label={t('Position de ', 'ترتيب ') + t(...sectionLabels[key])}
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
                      ? t('Pro Rendez-vous actif', 'Pro Rendez-vous مفعّل')
                      : t('Option Pro à activer par SoraLink', 'خاص SoraLink يفعّل Pro')}
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
                            {r.kind.toUpperCase()} · {r.status}
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
                                encodeURIComponent('Votre demande — ' + data.name) +
                                '&body=' +
                                encodeURIComponent(
                                  'Bonjour ' +
                                    r.name +
                                    ',\nVotre rendez-vous : ' +
                                    (r.slot || 'à préciser') +
                                    ' (heure du Maroc).\nStatut : ' +
                                    (
                                      {
                                        confirmed: 'confirmé',
                                        cancelled: 'annulé',
                                        new: 'en attente',
                                        done: 'traité',
                                      } as any
                                    )[r.status] +
                                    '.\n' +
                                    data.name,
                                )
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
                              {t('Notifier par WhatsApp', 'خبر عبر واتساب')}
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
                                typeof window !== 'undefined' ? location.origin + '/c/' + id : ''
                              }
                            />
                          </label>
                          <div className="row">
                            <button
                              className="primary"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(location.origin + '/c/' + id);
                                  setMsg(t('Lien copié', 'تنسخ الرابط'));
                                } catch {
                                  setMsg('Copiez le lien depuis le champ');
                                }
                              }}
                            >
                              <Copy size={16} />
                              {t('Copier', 'نسخ')}
                            </button>
                            <a className="secondary" href={'/c/' + id} target="_blank">
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
                          {subscription.plan} ·{' '}
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
                        {n}
                        <b>{p} DH</b>
                      </button>
                    ))}
                  </div>
                  {orders.map((o) => (
                    <div className="request" key={o.id}>
                      <strong>{o.plan}</strong>
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
