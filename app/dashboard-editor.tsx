'use client';
import { useState, useEffect } from 'react';
import SaveBar from './save-bar';
import PinnedCardPreview from './pinned-card-preview';
import type { SaveState } from './lib/save-queue';
import CardSetup from './card-setup';
import CardQR from './card-qr';
import CardStylePicker from './card-style-picker';
import { ContactActionsEditor, SocialLinksEditor } from './contact-editors';
import CatalogEditor from './catalog-editor';
import CatalogOffersEditor from './catalog-offers-editor';
import type { CropTarget } from './lib/crop-geometry';
import AddressEditor from './address-editor';
import { publicCardPath } from './lib/public-address';
import LoadMore from './load-more';
import type { History, PageInfo } from './lib/pagination';
import { capabilities, offers, RENEWAL_PRICE } from './lib/offers';
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
  Palette,
  ImageIcon,
  Clock,
  Users,
  Settings,
  Copy,
  Camera,
  Crop,
  Package,
  LogOut,
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

export type DashboardContext = {
  Card: (props: CardViewProps) => JSX.Element;
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
  saveState?: SaveState;
  savePaused?: boolean;
  setCatalogWorking?: (value: boolean) => void;
  reloadSaved?: () => Promise<void>;
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
    rawSources,
    save,
    saveState,
    savePaused,
    setCatalogWorking,
    reloadSaved,
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
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupDismissed, setSetupDismissed] = useState(false);
  useEffect(() => {
    if (loaded && auth && !id && !setupDismissed) setSetupOpen(true);
  }, [loaded, auth, id, setupDismissed]);
  const showSetup = setupOpen || (loaded && auth && !id && !setupDismissed);
  const closeSetup = () => {
    setSetupOpen(false);
    setSetupDismissed(true);
  };
  const navigate = (next: string) => {
    closeSetup();
    setTab(next);
  };
  const rights = capabilities(subscription);
  const tabs = [
    ['interface', Palette, 'Logo et modèle', 'اللوگو والستايل', 'card'],
    ['coordinates', Users, 'Ma carte', 'الكارط ديالي', 'card'],
    ['actions', Phone, 'Actions directes', 'أزرار التواصل', 'card'],
    ['links', ExternalLink, 'Réseaux et liens', 'مواقع التواصل والروابط', 'card'],
    ['content', Package, 'Produits et services', 'المنتجات والخدمات', 'card'],
    ['contacts', Users, 'Mes contacts', 'الكونطاكت ديالي', 'clients'],
    ['requests', Calendar, 'Mes demandes', 'الطلبات ديالي', 'clients'],
    ['schedule', Clock, 'Mon agenda', 'الأجندة ديالي', 'clients'],
    ['share', Nfc, 'Partager ma carte', 'شارك الكارط ديالي', 'offer'],
    ['orders', FileText, 'Mon offre', 'العرض ديالي', 'offer'],
  ].filter(
    ([key]) =>
      (key !== 'content' || rights.catalogue) &&
      (!['contacts', 'requests', 'schedule'].includes(key as string) || rights.activity),
  ) as Array<[string, LucideIcon, string, string, string]>;
  const allowedTab = (next: string) =>
    (!['content', 'catalogue', 'promotions', 'media'].includes(next) || rights.catalogue) &&
    (!['contacts', 'requests', 'schedule'].includes(next) || rights.activity);
  useEffect(() => {
    if (!allowedTab(tab)) setTab('coordinates');
  }, [tab, subscription?.plan]);
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
        {auth && (
          <button
            type="button"
            className="setup-launch"
            disabled={busy}
            onClick={() => setSetupOpen(true)}
          >
            <Plus size={19} />
            <span>{t('Créer pas à pas', 'صايب خطوة بخطوة')}</span>
          </button>
        )}
        <nav
          className={'workspace-navigation' + (!rights.catalogue ? ' identity-navigation' : '')}
          aria-label={t('Rubriques de votre espace', 'أقسام الحساب ديالك')}
        >
          {tabs
            .filter(([key]) => ['coordinates', 'content', 'share'].includes(key))
            .map(([key, Icon, fr, da]) => (
              <button
                key={key}
                className={
                  (
                    key === 'coordinates'
                      ? ['coordinates', 'interface', 'actions', 'links'].includes(activeTab)
                      : activeTab === key
                  )
                    ? 'selected'
                    : ''
                }
                onClick={() => navigate(key)}
                aria-pressed={
                  key === 'coordinates'
                    ? ['coordinates', 'interface', 'actions', 'links'].includes(activeTab)
                    : activeTab === key
                }
              >
                <Icon size={19} />
                <span>{t(fr, da)}</span>
              </button>
            ))}
          {rights.activity && (
            <details
              className="workspace-secondary-nav"
              open={['contacts', 'requests', 'schedule', 'orders'].includes(activeTab)}
            >
              <summary>
                {t('Suivi de mon activité', 'تتبّع النشاط ديالي')}
                {inbox.some((r) => r.status === 'new') && (
                  <span className="nav-count">
                    {inbox.filter((r) => r.status === 'new').length}
                  </span>
                )}
              </summary>
              {tabs
                .filter(([key]) => ['contacts', 'requests', 'schedule'].includes(key))
                .map(([key, Icon, fr, da]) => (
                  <button
                    key={key}
                    className={activeTab === key ? 'selected' : ''}
                    onClick={() => navigate(key)}
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
                ))}
            </details>
          )}
        </nav>
        <button
          className={
            'secondary small full workspace-offer-link' +
            (activeTab === 'orders' ? ' selected' : '')
          }
          aria-pressed={activeTab === 'orders'}
          onClick={() => navigate('orders')}
        >
          <FileText size={19} />
          <span>{t('Mon offre', 'العرض ديالي')}</span>
        </button>
        {auth && (
          <button className="sidebar-logout" onClick={logout}>
            <LogOut size={16} />
            <span>{t('Se déconnecter', 'خرج من الحساب')}</span>
          </button>
        )}
        {canAdmin && (
          <a className="secondary small full" href="/admin">
            <Settings size={16} />
            <span>{t('Administration', 'الإدارة')}</span>
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
                'Bienvenue ! Complétez votre carte. Les modifications sont enregistrées automatiquement ; activez sa visibilité quand elle est prête.',
                'مرحبا! عمّر الكارط ديالك. التغييرات كيتسجلو تلقائياً، وفعّل الظهور ديالها ملي تكون واجدة.',
              )}
            </p>
          </div>
        )}
        <div className="workspace-head">
          <div>
            <span className="eyebrow">
              <span dir="ltr">SoraLink</span> / {t('ESPACE CLIENT', 'حساب الزبون')}
            </span>
            <h1>
              {showSetup ? t('Créer ma carte', 'صايب الكارط ديالي') : t(current[2], current[3])}
            </h1>
            <p className="workspace-intro">
              {t(
                'Personnalisez, enregistrez et partagez votre présence digitale.',
                'خصّص، سجّل وشارك الحضور الرقمي ديالك.',
              )}
            </p>
          </div>
        </div>
        {auth && (
          <SaveBar
            state={saveState}
            ar={ar}
            disabled={busy || !!savePaused || !data.name?.trim()}
            save={save}
            reload={reloadSaved}
          />
        )}
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
              {showSetup ? (
                <CardSetup context={context} onExit={closeSetup} />
              ) : (
                <>
                  {['coordinates', 'interface', 'actions', 'links'].includes(activeTab) && (
                    <nav
                      className="card-edit-navigation"
                      aria-label={t('Modifier ma carte', 'بدّل الكارط ديالي')}
                    >
                      {[
                        ['coordinates', 'Identité', 'الهوية'],
                        ['interface', 'Logo et modèle', 'اللوگو والستايل'],
                        ['actions', 'Coordonnées', 'معلومات التواصل'],
                        ['links', 'Réseaux et liens', 'مواقع التواصل والروابط'],
                      ].map(([key, fr, da]) => (
                        <button
                          type="button"
                          className={activeTab === key ? 'primary small' : 'secondary small'}
                          key={key}
                          aria-current={activeTab === key ? 'page' : undefined}
                          onClick={() => navigate(key)}
                        >
                          {t(fr, da)}
                        </button>
                      ))}
                    </nav>
                  )}
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
                            {t('Carte visible publiquement', 'الكارط باينة للعموم')}
                          </label>
                        </div>
                        <p className="hint">
                          {t(
                            'Complétez votre présentation, puis ajoutez votre logo et vos moyens de contact avec les onglets ci-dessus.',
                            'عمّر التقديم ديالك، ومن بعد زيد اللوگو ومعلومات التواصل من الاختيارات اللي فالفوق.',
                          )}
                        </p>
                        <h3>{t('Informations professionnelles', 'المعلومات المهنية')}</h3>
                        <div className="form-grid">
                          {field('name', t('Nom complet *', 'الاسم الكامل *'))}
                          {field('job', t('Profession', 'المهنة'))}
                          {field('business', t('Entreprise / cabinet', 'المقاولة / المكتب'))}
                        </div>
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
                            'Vos modifications sont enregistrées automatiquement.',
                            'التغييرات كيتسجلو تلقائياً.',
                          )}
                        </p>
                      </section>
                    </>
                  )}
                  {(activeTab === 'actions' || activeTab === 'links') && (
                    <section className="panel">
                      {activeTab === 'actions' ? (
                        <ContactActionsEditor context={context} />
                      ) : (
                        <SocialLinksEditor context={context} />
                      )}
                    </section>
                  )}
                  {rights.catalogue &&
                    (activeTab === 'content' ||
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
                          onMessage={setMsg}
                          onBusyChange={setCatalogWorking}
                          initialTab={
                            tab === 'media'
                              ? 'promotions'
                              : tab === 'promotions'
                                ? 'promotions'
                                : undefined
                          }
                          promotionsEditor={<CatalogOffersEditor context={context} />}
                        />
                      </>
                    )}
                  {(activeTab === 'interface' || tab === 'sections') && (
                    <>
                      <section className="panel">
                        <h2>{t('Logo et modèle de ma carte', 'اللوگو وستايل الكارط ديالي')}</h2>
                        <p className="hint">
                          {t(
                            'Choisissez un modèle et ajoutez vos images. L’équipe SoraLink gère les réglages avancés.',
                            'اختار الستايل وزيد التصاور ديالك. فريق SoraLink كيتكلف بالإعدادات المفصّلة.',
                          )}
                        </p>
                        <CardStylePicker data={data} setData={setData} ar={ar} busy={busy} />
                        <h3>{t('Portrait, logo et couverture', 'التصويرة، اللوگو والغلاف')}</h3>
                        <div className="form-grid" style={{ marginBottom: '16px' }}>
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
                                <img
                                  src={data.avatar}
                                  alt=""
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: data.avatarShape === 'square' ? '6px' : '50%',
                                    objectFit: 'cover',
                                    border: '1px solid var(--line, rgba(255,255,255,0.15))',
                                  }}
                                />
                                <button
                                  type="button"
                                  className="secondary small"
                                  disabled={busy}
                                  onClick={() =>
                                    startCrop(rawSources?.avatar || data.avatar, 'avatar')
                                  }
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
                                <img
                                  src={data.cover}
                                  alt=""
                                  style={{
                                    width: '56px',
                                    height: '28px',
                                    borderRadius: '4px',
                                    objectFit: 'cover',
                                    border: '1px solid var(--line, rgba(255,255,255,0.15))',
                                  }}
                                />
                                <button
                                  type="button"
                                  className="secondary small"
                                  disabled={busy}
                                  onClick={() =>
                                    startCrop(rawSources?.cover || data.cover, 'cover')
                                  }
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
                      </section>
                    </>
                  )}
                  {rights.activity && tab === 'contacts' && (
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
                                {t(
                                  'Accord de partage reçu le ',
                                  'توصلنا بالموافقة على المشاركة فـ ',
                                )}
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
                  {rights.activity && tab === 'requests' && (
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
                          ? t('Rendez-vous actifs', 'خيار المواعيد مفعّل')
                          : t(
                              'Rendez-vous à activer par SoraLink',
                              'خاص SoraLink يفعّل خيار المواعيد',
                            )}
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
                  {rights.activity && tab === 'schedule' && (
                    <section className="panel">
                      <h2>{t('Horaires et disponibilités', 'الأوقات والمواعيد')}</h2>
                      <p className="hint">
                        {t(
                          'Horaires au Maroc. Les visiteurs proposent un créneau, puis vous le confirmez. L’enregistrement des modifications est automatique.',
                          'الأوقات بتوقيت المغرب. الزوار كيطلبو الموعد ونتا كتأكدو. التغييرات كيتسجلو تلقائياً.',
                        )}
                      </p>
                      {[
                        'Dimanche',
                        'Lundi',
                        'Mardi',
                        'Mercredi',
                        'Jeudi',
                        'Vendredi',
                        'Samedi',
                      ].map((day, n) => (
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
                                aria-label={
                                  i ? t('Fermeture', 'الإغلاق') : t('Ouverture', 'الافتتاح')
                                }
                                value={data.hours[n][i]}
                                onChange={(e) => {
                                  const hours = { ...data.hours, [n]: [...data.hours[n]] };
                                  hours[n][i] = e.target.value;
                                  setData({ ...data, hours });
                                }}
                              />
                            ))}
                        </div>
                      ))}
                      <hr />
                      <div className="form-grid">
                        {field('breakStart', t('Début de pause', 'بداية الاستراحة'), 'time')}
                        {field('breakEnd', t('Fin de pause', 'نهاية الاستراحة'), 'time')}
                      </div>
                      {(data.breakStart || data.breakEnd) && (
                        <button
                          type="button"
                          className="text-button"
                          disabled={busy}
                          onClick={() =>
                            setData((d: any) => ({ ...d, breakStart: '', breakEnd: '' }))
                          }
                        >
                          {t('Supprimer la pause', 'حذف الاستراحة')}
                        </button>
                      )}
                      <label className="field">
                        {t(
                          'Jours de fermeture · une date par ligne (AAAA-MM-JJ)',
                          'أيام الإغلاق · تاريخ فكل سطر (AAAA-MM-JJ)',
                        )}
                        <textarea
                          value={(data.closures || []).join('\n')}
                          onChange={(e) =>
                            setData({ ...data, closures: e.target.value.split('\n') })
                          }
                        />
                      </label>
                      <div className="closure-remove-list">
                        {[
                          ...new Set<string>(
                            (data.closures || []).filter((date: string) => date.trim()),
                          ),
                        ].map((date: string, index: number) => (
                          <button
                            type="button"
                            key={index}
                            className="secondary small"
                            disabled={busy}
                            aria-label={
                              t('Supprimer la date de fermeture ', 'حذف يوم الإغلاق ') + date
                            }
                            onClick={() =>
                              setData((d: any) => ({
                                ...d,
                                closures: d.closures.filter(
                                  (value: string) => value.trim() && value !== date,
                                ),
                              }))
                            }
                          >
                            <span dir="ltr">{date}</span>
                            <X size={16} />
                          </button>
                        ))}
                      </div>
                      <h3>{t('Types de rendez-vous · maximum 5', 'أنواع المواعيد · حتى 5')}</h3>
                      {(data.appointmentServices || []).map((v: any, i: number) => (
                        <div className="service-edit" key={i}>
                          <input
                            aria-label={t('Prestation', 'الخدمة')}
                            value={v.name}
                            onChange={(e) => {
                              const a = [...data.appointmentServices];
                              a[i] = { ...v, name: e.target.value };
                              setData({ ...data, appointmentServices: a });
                            }}
                          />
                          <select
                            aria-label={t('Durée', 'المدة')}
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
                            type="button"
                            disabled={busy}
                            aria-label={
                              t('Supprimer la prestation ', 'حذف الخدمة ') + (v.name || i + 1)
                            }
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
                        disabled={busy || (data.appointmentServices || []).length >= 5}
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
                          'Le pack Suivi de mon activité doit être activé par SoraLink pour afficher les créneaux au public.',
                          'خاص SoraLink يفعّل باقة تتبّع النشاط باش تبان الأوقات للزوار.',
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
                            {published
                              ? t('Page en ligne', 'الصفحة منشورة')
                              : t('Brouillon', 'مسودة')}
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
                            <CardQR id={id} publicName={publicName} logo={data.avatar} ar={ar} />
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
                                        t(
                                          'Copiez le lien depuis le champ.',
                                          'نسخ الرابط من الخانة.',
                                        ),
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

                          <p className="hint">
                            {published
                              ? t(
                                  'La page est publiée après enregistrement.',
                                  'الصفحة كتتنشر من بعد التسجيل.',
                                )
                              : t(
                                  'Activez « Carte visible publiquement » pour rendre ce lien consultable après la sauvegarde automatique.',
                                  'فعّل «الكارط باينة للعموم» باش يخدم الرابط من بعد التسجيل التلقائي.',
                                )}
                          </p>
                        </>
                      ) : (
                        <p>
                          {t(
                            'Complétez votre nom : le lien et le QR seront créés lors du premier enregistrement automatique.',
                            'كمّل الاسم ديالك. الرابط ورمز QR غادي يتصايبو مع أول تسجيل تلقائي.',
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
                      <p className="hint">
                        {t(
                          'Première année incluse. Ensuite 149 DH/an avec toutes les fonctions du pack conservées. Carte NFC physique en supplément.',
                          'العام الأول داخل فالثمن. من بعد 149 درهم فالعام مع جميع وظائف الباقة. كارط NFC المادية بزيادة.',
                        )}
                      </p>
                      {subscription && (
                        <button
                          className="primary"
                          disabled={busy}
                          onClick={async () => {
                            try {
                              await action({
                                action: 'order',
                                plan: subscription.plan,
                                kind: 'renewal',
                              });
                              await load();
                              setMsg(
                                t(
                                  'Demande de renouvellement enregistrée. Paiement à confirmer.',
                                  'تسجّل طلب التجديد. خاص تأكيد الأداء.',
                                ),
                              );
                            } catch (e: any) {
                              setMsg(e.message);
                            }
                          }}
                        >
                          {t('Renouveler mon pack', 'جدّد الباقة ديالي')} · {RENEWAL_PRICE}{' '}
                          {t('DH/an', 'درهم فالعام')}
                        </button>
                      )}
                      <div className="order-options">
                        {offers.map(({ id: n, price: p }) => (
                          <button
                            key={n}
                            className="secondary"
                            disabled={busy}
                            onClick={async () => {
                              try {
                                await action({ action: 'order', plan: n });
                                await load();
                                setMsg(
                                  t(
                                    'Votre demande d’offre est enregistrée.',
                                    'تسجّل طلب العرض ديالك.',
                                  ),
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
                          <strong>
                            {o.kind === 'renewal' ? t('Renouvellement · ', 'تجديد · ') : ''}
                            {offerLabel(o.plan, ar)}
                            {o.amount != null ? ` · ${o.amount} ${t('DH', 'درهم')}` : ''}
                          </strong>
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
                            'Contact : contact@soralink.link. Paiement manuel après confirmation. Les frais de livraison sont précisés avant commande.',
                            'تواصل معنا: contact@soralink.link. الأداء يدوي بعد التأكيد. مصاريف التوصيل كتتحدّد قبل الطلب.',
                          )}
                        </p>
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
            <PinnedCardPreview ar={ar}>
              <div className="preview-heading">
                <span className="eyebrow">{t('APERÇU EN DIRECT', 'معاينة مباشرة')}</span>
                <span className="preview-live-dot" aria-hidden="true" />
              </div>
              <Card
                d={{
                  ...data,
                  activity: rights.activity,
                  pro: rights.appointments,
                  ...(!rights.catalogue
                    ? {
                        services: [],
                        promotions: [],
                        catalogDocuments: [],
                        pdf: '',
                        catalogSettings: { ...data.catalogSettings, enabled: false },
                      }
                    : {}),
                }}
                preview
                withSections
              />
              <details className="preview-qr">
                <summary>{t('Voir le QR de ma carte', 'شوف رمز QR ديال الكارط')}</summary>
                <CardQR id={id} publicName={publicName} logo={data.avatar} ar={ar} />
              </details>
              <p className="preview-caption">
                {t(
                  'Votre carte évolue pendant vos modifications.',
                  'الكارط كتبدّل مباشرة مع التعديلات ديالك.',
                )}
              </p>
            </PinnedCardPreview>
          </div>
        )}
      </div>
    </main>
  );
}
