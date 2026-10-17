'use client';
import ProfileLinksView from './profile-links-view';
import { visibleProfileLinks } from './lib/profile-links';
import CatalogVideos, { catalogVideoSources } from './catalog-videos';
import { catalogSettings } from './lib/catalog-menu';
import CatalogProducts, { CatalogDocuments } from './catalog-public';
import { catalogDocuments } from './lib/catalog-menu';
import { publicCardPath } from './lib/public-address';
import { vcardText } from './lib/vcard';
import { useState, useEffect } from 'react';
import { Nfc, Phone, Mail, MapPin, Download, Globe, Users, Share2, Star } from 'lucide-react';
import { socialLink } from './lib/social-links';
import { cardStyleId, socialOrder } from './lib/card-styles';
import { appearance } from './lib/personalization';
import { normalizeCatalogue, cataloguePrice } from './lib/catalogue';
import { activePromotions, promotionPrice, todayMorocco } from './lib/promotions';
import { recordedVideoUrl } from './lib/content-media';
import PhotoGallery, { PhotoPreview } from './photo-gallery';
import PdfCatalogue from './pdf-catalogue';
import CardBackground from './card-background';
import {
  socialFields,
  webLink,
  mapLinks,
  WhatsAppIcon,
  SocialIcon,
  accentText,
  download,
} from './card-helpers';
export type CardViewProps = {
  d: any;
  small?: boolean;
  preview?: boolean;
  onChoose?: () => void;
  withSections?: boolean;
};
export default function CardView({
  ar,
  setAr,
  view = 'public',
  id = '',
  publicName = '',
  onMessage,
  onRequest,
  onDiscover,
  ...props
}: CardViewProps & {
  ar: boolean;
  setAr: (value: boolean) => void;
  view?: string;
  id?: string;
  publicName?: string;
  onMessage: (message: string) => void;
  onRequest: (kind: string, item?: any) => void;
  onDiscover?: (d: any) => void;
}) {
  const t = (fr: string, da: string) => (ar ? da : fr),
    setMsg = onMessage;
  const [emailActions, setEmailActions] = useState(false),
    [manualShareUrl, setManualShareUrl] = useState(''),
    [promoToday, setPromoToday] = useState(todayMorocco);
  useEffect(() => {
    const timer = setInterval(() => setPromoToday(todayMorocco()), 30000);
    return () => clearInterval(timer);
  }, []);
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
    const url = location.origin + publicCardPath(id, publicName);
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
  function Card({
    d,
    small = false,
    preview = false,
    onChoose,
    withSections = false,
  }: {
    d: any;
    small?: boolean;
    preview?: boolean;
    onChoose?: () => void;
    withSections?: boolean;
  }) {
    const location = mapLinks(d),
      a = appearance(d);
    const isDarkBlock = a.blockColor ? accentText(a.blockColor) === '#ffffff' : a.theme === 'dark';
    const defaultTextFg = isDarkBlock ? '#f8fafc' : '#1e293b';
    const defaultTextMuted = isDarkBlock ? 'rgba(248, 250, 252, 0.72)' : 'rgba(30, 41, 59, 0.72)';
    return (
      <article
        className={
          'profile-card card-design custom-card theme-' +
          a.theme +
          ' text-size-' +
          a.textSize +
          ' button-size-' +
          a.buttonSize +
          ' button-style-' +
          a.buttonStyle +
          ' font-' +
          a.font +
          ' ' +
          (small ? 'compact' : '') +
          (withSections ? ' unified-card' : '') +
          (a.backgroundPhoto ? ' has-photo-background' : '') +
          (cardStyleId(d.template) ? ' card-layout-' + cardStyleId(d.template) : '')
        }
        style={
          {
            '--card-color': d.color || '#d5b66f',
            ...(a.fondColor ? { '--card-fond': a.fondColor } : {}),
            ...(a.blockColor
              ? {
                  '--block-bg': a.blockColor,
                  '--card-bg': a.blockColor,
                }
              : {}),
            '--accent': a.buttonColor || d.color || '#d5b66f',
            '--accent-text': accentText(a.buttonColor || d.color),
            '--button-bg': a.buttonColor || d.color || '#d5b66f',
            '--button-text': accentText(a.buttonColor || d.color),
            ...(a.textColor
              ? {
                  '--card-fg': a.textColor,
                  '--card-muted': a.textColor,
                  '--block-fg': a.textColor,
                }
              : a.blockColor
                ? {
                    '--card-fg': defaultTextFg,
                    '--card-muted': defaultTextMuted,
                    '--block-fg': defaultTextFg,
                  }
                : {}),
            '--button-radius': a.shape === 'pill' ? '30px' : a.shape === 'square' ? '0px' : '8px',
            '--avatar-radius': a.avatarShape === 'square' ? '12px' : '50%',
          } as any
        }
      >
        <CardBackground src={a.backgroundPhoto} opacity={a.backgroundOpacity} />
        <div className="card-cover" style={d.cover ? { backgroundImage: `url(${d.cover})` } : {}} />
        <div className="card-content">
          <section className="card-identity">
            <div className="avatar">
              {d.avatar ? (
                <img src={d.avatar} alt="" />
              ) : (
                d.name
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((s: string) => s[0])
                  .join('') || 'SL'
              )}
            </div>
            <span className="eyebrow">{d.business || t('Votre entreprise', 'المقاولة ديالك')}</span>
            <h2>{d.name || t('Votre nom', 'الاسم ديالك')}</h2>
            <p className="job">{d.job || t('Votre métier', 'المهنة ديالك')}</p>
            <p className="bio">
              {d.bio ||
                t('Présentez votre activité en quelques mots.', 'عرّف بالنشاط ديالك بكلمات بسيطة.')}
            </p>
          </section>
          {small && !preview && !withSections && <CardSection d={d} section="coordinates" />}
          {small && !preview && !withSections && <CardSection d={d} section="social" />}
          {small && !preview && !withSections ? (
            <button
              className="card-button"
              onClick={() => {
                if (onChoose) {
                  onChoose();
                  return;
                }
                onDiscover?.(d);
              }}
            >
              {onChoose
                ? t('Personnaliser ma carte', 'خصّص الكارط ديالي')
                : t('Découvrir la carte', 'شوف الكارط')}
            </button>
          ) : (
            <div className="card-actions">
              <div className="card-action-icons">
                <button
                  className="card-button card-save"
                  onClick={() => {
                    const blob = new Blob(
                      [
                        vcardText({
                          name: d.name,
                          ...(Array.isArray(d.profileLinks)
                            ? { entries: visibleProfileLinks(d) }
                            : {}),
                          phone: a.hidePhone ? '' : d.phone,
                          email: a.hideEmail ? '' : d.email,
                          business: d.business,
                          job: d.job,
                          address: a.hideLocation ? '' : d.address,
                          website: a.hidden.includes('links') ? '' : webLink(d.website),
                        }),
                      ],
                      { type: 'text/vcard' },
                    );
                    download(blob, 'contact.vcf');
                  }}
                >
                  <Download size={22} />
                  <span className="action-label">
                    {t('Enregistrer le contact', 'سجّل الكونطاكت')}
                  </span>
                </button>
                <button
                  className="exchange-button"
                  onClick={() => void sharePublicCard(d, preview)}
                >
                  <Share2 size={22} />
                  <span className="action-label">
                    {t('Partager cette carte', 'شارك هاد الكارط')}
                  </span>
                </button>
                <button
                  className="exchange-button"
                  onClick={() => {
                    if (preview || view === 'demo') {
                      setMsg(
                        t(
                          'Aperçu : le formulaire sera disponible sur votre carte publique.',
                          'معاينة: الفورميلير غادي يخدم فالصفحة العمومية ديالك.',
                        ),
                      );
                      return;
                    }
                    onRequest('contact');
                  }}
                >
                  <Users size={22} />
                  <span className="action-label">
                    {t('Échanger nos coordonnées', 'نتبادلو معلومات التواصل')}
                  </span>
                </button>
              </div>
              {!d.pro && (
                <button
                  className="card-button card-request"
                  onClick={() => {
                    if (preview) {
                      setMsg(
                        t(
                          'Aperçu : ce bouton sera disponible sur votre carte publique.',
                          'معاينة: هاد الزر غادي يخدم فالصفحة العمومية ديالك.',
                        ),
                      );
                      return;
                    }
                    if (view === 'demo') {
                      setMsg(
                        t(
                          'Exemple : créez votre carte pour recevoir des demandes.',
                          'هادشي مثال، صايب الكارط ديالك باش توصّل بالطلبات.',
                        ),
                      );
                      return;
                    }
                    onRequest(d.pro ? 'rdv' : 'devis');
                  }}
                >
                  {d.pro
                    ? t('Demander un rendez-vous', 'طلب موعد')
                    : t('Demander un devis', 'طلب الثمن')}
                </button>
              )}
              {manualShareUrl && !preview && view === 'public' && (
                <label className="field card-share-link">
                  {t('Lien de cette carte', 'رابط هاد الكارط')}
                  <input
                    aria-label={t('Lien à copier', 'الرابط للنسخ')}
                    dir="ltr"
                    readOnly
                    value={manualShareUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    onClick={(e) => e.currentTarget.select()}
                  />
                </label>
              )}
            </div>
          )}
          {withSections && <Details d={d} preview={preview} />}
          <div className="card-footer-brand">
            <a
              className="card-brand"
              dir="ltr"
              href={'/?lang=' + (ar ? 'ar' : 'fr')}
              aria-label={t('SoraLink — Accueil', 'SoraLink — الرئيسية')}
            >
              {t('Par SoraLink', 'من SoraLink')} <Nfc size={16} />
            </a>
          </div>
        </div>
      </article>
    );
  }
  function sectionHeading(d: any, key: string, fallback: string) {
    return d.sectionTitles?.[ar ? 'ar' : 'fr']?.[key] || fallback;
  }
  function CardSection({
    d,
    section,
    preview = false,
  }: {
    d: any;
    section: string;
    preview?: boolean;
  }) {
    const a = appearance(d),
      location = mapLinks(d);
    if (a.hidden.includes(section)) return null;
    if (Array.isArray(d.profileLinks) && ['coordinates', 'social'].includes(section))
      return (
        <ProfileLinksView
          data={d}
          group={section}
          ar={ar}
          heading={sectionHeading(d, section, '')}
          onMessage={setMsg}
        />
      );
    if (section === 'coordinates') {
      if (
        !(
          (!a.hidePhone && d.phone) ||
          (!a.hideEmail && d.email) ||
          (!a.hideWhatsApp && d.whatsapp) ||
          (!a.hideLocation && location.maps) ||
          d.googleReview
        )
      )
        return null;
      return (
        <div className="panel">
          {d.sectionTitles?.[ar ? 'ar' : 'fr']?.coordinates && (
            <h2>{sectionHeading(d, section, '')}</h2>
          )}
          <div className="contact-icons">
            {!a.hidePhone && d.phone && (
              <a
                href={'tel:' + d.phone}
                aria-label={t('Téléphone', 'الهاتف')}
                title={t('Téléphone', 'الهاتف')}
              >
                <Phone size={22} />
                <span className="contact-label">{t('Téléphone', 'الهاتف')}</span>
              </a>
            )}
            {!a.hideWhatsApp && d.whatsapp && (
              <a
                href={'https://wa.me/' + String(d.whatsapp).replace(/\D/g, '')}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <WhatsAppIcon />
                <span className="contact-label">WhatsApp</span>
              </a>
            )}
            {!a.hideEmail && d.email && (
              <a
                href={'mailto:' + String(d.email).trim()}
                aria-label={t('Contacter par e-mail', 'تواصل بالإيميل')}
                title={t('E-mail', 'البريد')}
                aria-expanded={emailActions}
                onClick={(e) => {
                  e.preventDefault();
                  setEmailActions(!emailActions);
                }}
              >
                <Mail size={22} />
                <span className="contact-label">{t('E-mail', 'البريد')}</span>
              </a>
            )}
            {!a.hideLocation && (location.directions || location.maps) && (
              <a
                href={location.directions || location.maps}
                target="_blank"
                rel="noreferrer"
                aria-label={t('Itinéraire', 'كيفاش توصل')}
                title={t('Itinéraire', 'كيفاش توصل')}
              >
                <MapPin size={22} />
                <span className="contact-label">{t('Itinéraire', 'كيفاش توصل')}</span>
              </a>
            )}
            {d.googleReview && (
              <a
                href={webLink(d.googleReview)}
                target="_blank"
                rel="noreferrer"
                aria-label={t('Avis Google 5★', 'تقييم Google 5★')}
                title={t('Laisser un avis Google 5 étoiles', 'خلّي تقييم 5 نجوم على Google')}
                className="google-review-contact-btn"
              >
                <Star size={22} fill="currentColor" />
                <span className="contact-label">{t('Avis 5★', 'تقييم 5★')}</span>
              </a>
            )}
          </div>
          {emailActions && !a.hideEmail && d.email && (
            <div className="email-actions">
              <label className="field">
                {t('Adresse e-mail', 'عنوان الإيميل')}
                <input
                  dir="ltr"
                  readOnly
                  value={String(d.email).trim()}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.currentTarget.select()}
                />
              </label>
              <div className="row">
                <a className="secondary small" href={'mailto:' + String(d.email).trim()}>
                  {t('Ouvrir ma messagerie', 'حل تطبيق الإيميل')}
                </a>
                <button
                  className="secondary small"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(String(d.email).trim());
                      setMsg(t('Adresse e-mail copiée.', 'تنسخ عنوان الإيميل.'));
                    } catch {
                      setMsg(
                        t(
                          'Sélectionnez l’adresse affichée pour la copier.',
                          'اختار عنوان الإيميل اللي باين باش تنسخو.',
                        ),
                      );
                    }
                  }}
                >
                  {t('Copier l’adresse', 'نسخ العنوان')}
                </button>
              </div>
              <p className="hint">
                {t(
                  'Si aucune application ne s’ouvre, copiez cette adresse dans votre messagerie.',
                  'إلا ما تحل حتى تطبيق، نسخ هاد العنوان لتطبيق الإيميل ديالك.',
                )}
              </p>
            </div>
          )}
          {!a.hideLocation && d.address && (
            <div className="location-links">
              <p className="muted">{d.address}</p>
            </div>
          )}
          {d.googleReview && (
            <div className="google-review-panel-card">
              <a
                href={webLink(d.googleReview)}
                target="_blank"
                rel="noreferrer"
                className="google-review-action"
              >
                <div className="google-review-stars" aria-hidden="true">
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                </div>
                <div className="google-review-content">
                  <span className="google-review-title">
                    {t('Laissez-nous un avis 5★ sur Google', 'قيّمنا 5 نجوم على Google')}
                  </span>
                  <span className="google-review-subtitle">
                    {t('Votre recommandation compte beaucoup !', 'الرأي ديالك كيهمنا بزاف!')}
                  </span>
                </div>
              </a>
            </div>
          )}
        </div>
      );
    }
    if (section === 'social') {
      if (a.hideSocial || !socialFields.some(([key]) => socialLink(key, d[key]))) return null;
      return (
        <div className="panel">
          {d.sectionTitles?.[ar ? 'ar' : 'fr']?.social && <h2>{sectionHeading(d, section, '')}</h2>}
          {!a.hideSocial && socialFields.some(([key]) => socialLink(key, d[key])) && (
            <div className="social-links contact-icons">
              {socialOrder(d.socialOrder)
                .map((network) => socialFields.find(([key]) => key === network)!)
                .filter(Boolean)
                .map(([key, label]) =>
                  socialLink(key, d[key]) ? (
                    <a
                      key={key}
                      href={socialLink(key, d[key])}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      title={label}
                    >
                      <SocialIcon network={key} />
                      <span className="contact-label">{label}</span>
                    </a>
                  ) : null,
                )}
            </div>
          )}
        </div>
      );
    }
    if (section === 'promotions')
      return (
        <>
          {activePromotions(d.promotions, promoToday).length > 0 && (
            <section className="card-promotions" aria-label={t('Promotions', 'العروض')}>
              <h3>{sectionHeading(d, section, t('Nos promos', 'العروض ديالنا'))}</h3>
              {activePromotions(d.promotions, promoToday).map((p) => (
                <article className="promotion-item" key={p.id}>
                  {p.image && <PhotoPreview src={p.image} alt={p.title} ar={ar} />}
                  <div>
                    <span className="promotion-label">{t('OFFRE SPÉCIALE', 'عرض خاص')}</span>
                    <h4>{p.title}</h4>
                    {p.description && <p>{p.description}</p>}
                    {(p.regularPrice || p.promoPrice) && (
                      <div className="promotion-prices">
                        {p.regularPrice && p.promoPrice ? (
                          <del>{promotionPrice(p.regularPrice)}</del>
                        ) : null}
                        <strong>{promotionPrice(p.promoPrice || p.regularPrice)}</strong>
                      </div>
                    )}
                    {p.endDate && (
                      <small>
                        {t('Jusqu’au ', 'حتى ')}
                        <time dateTime={p.endDate}>{p.endDate.split('-').reverse().join('/')}</time>
                      </small>
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      );
    if (section === 'appointments') {
      if (!d.pro) return null;
      return (
        <div className="panel">
          <h2>{sectionHeading(d, section, t('Rendez-vous', 'المواعيد'))}</h2>
          <button
            className="card-button"
            onClick={() => {
              if (preview) {
                setMsg(
                  t(
                    'Aperçu : ce bouton sera disponible sur votre carte publique.',
                    'معاينة: هاد الزر غادي يخدم فالصفحة العمومية ديالك.',
                  ),
                );
                return;
              }
              if (view === 'demo') {
                setMsg(
                  t(
                    'Exemple : créez votre carte pour recevoir des demandes.',
                    'هادشي مثال، صايب الكارط ديالك باش توصّل بالطلبات.',
                  ),
                );
                return;
              }
              onRequest(d.pro ? 'rdv' : 'devis');
            }}
          >
            {d.pro ? t('Demander un rendez-vous', 'طلب موعد') : t('Demander un devis', 'طلب الثمن')}
          </button>
        </div>
      );
    }
    return null;
  }
  function Details({ d, preview = false }: { d: any; preview?: boolean }) {
    const a = appearance(d);
    const isDarkBlock = a.blockColor ? accentText(a.blockColor) === '#ffffff' : a.theme === 'dark';
    const defaultTextFg = isDarkBlock ? '#f8fafc' : '#1e293b';
    const defaultTextMuted = isDarkBlock ? 'rgba(248, 250, 252, 0.72)' : 'rgba(30, 41, 59, 0.72)';
    return (
      <section
        className={
          'public-details custom-details theme-' +
          a.theme +
          ' text-size-' +
          a.textSize +
          ' button-size-' +
          a.buttonSize +
          ' button-style-' +
          a.buttonStyle +
          ' font-' +
          a.font
        }
        style={
          {
            '--card-color': d.color || '#d5b66f',
            ...(a.fondColor ? { '--card-fond': a.fondColor } : {}),
            ...(a.blockColor
              ? {
                  '--block-bg': a.blockColor,
                  '--card-bg': a.blockColor,
                }
              : {}),
            '--accent': a.buttonColor || d.color || '#d5b66f',
            '--accent-text': accentText(a.buttonColor || d.color),
            '--button-bg': a.buttonColor || d.color || '#d5b66f',
            '--button-text': accentText(a.buttonColor || d.color),
            ...(a.textColor
              ? {
                  '--card-fg': a.textColor,
                  '--card-muted': a.textColor,
                  '--block-fg': a.textColor,
                }
              : a.blockColor
                ? {
                    '--card-fg': defaultTextFg,
                    '--card-muted': defaultTextMuted,
                    '--block-fg': defaultTextFg,
                  }
                : {}),
            '--button-radius': a.shape === 'pill' ? '30px' : a.shape === 'square' ? '0px' : '8px',
          } as any
        }
      >
        {a.order
          .filter((key) => !a.hidden.includes(key))
          .map((key) => {
            if (['coordinates', 'social', 'appointments'].includes(key))
              return <CardSection key={key} d={d} section={key} preview={preview} />;
            if (key === 'services') {
              const items = normalizeCatalogue(d.services).filter((item) => item.name);
              const promos = !a.hidden.includes('promotions')
                ? activePromotions(d.promotions, promoToday)
                : [];
              const mediaVisible = catalogSettings(d).enabled;
              const videoSources =
                !a.hidden.includes('video') && mediaVisible
                  ? catalogVideoSources(d)
                  : { localVideo: '', youtubeId: '' };
              const hasVideo = !!(videoSources.localVideo || videoSources.youtubeId);
              const photos =
                mediaVisible && !a.hidden.includes('photos') && Array.isArray(d.photos)
                  ? d.photos.filter(Boolean)
                  : [];
              if (!items.length && !promos.length && !photos.length && !hasVideo) return null;
              return (
                <div className="panel" key={key}>
                  <h2>
                    {sectionHeading(d, 'services', t('Produits et services', 'المنتجات والخدمات'))}
                  </h2>
                  {promos.length > 0 && (
                    <section className="card-promotions" aria-label={t('Promotions', 'العروض')}>
                      <h3>{sectionHeading(d, 'promotions', t('Nos promos', 'العروض ديالنا'))}</h3>
                      {promos.map((p) => (
                        <article className="promotion-item" key={p.id}>
                          {p.image && <PhotoPreview src={p.image} alt={p.title} ar={ar} />}
                          <div>
                            <span className="promotion-label">
                              {t('OFFRE SPÉCIALE', 'عرض خاص')}
                            </span>
                            <h4>{p.title}</h4>
                            {p.description && <p>{p.description}</p>}
                            {(p.regularPrice || p.promoPrice) && (
                              <div className="promotion-prices">
                                {p.regularPrice && p.promoPrice ? (
                                  <del>{promotionPrice(p.regularPrice)}</del>
                                ) : null}
                                <strong>{promotionPrice(p.promoPrice || p.regularPrice)}</strong>
                              </div>
                            )}
                            {p.endDate && (
                              <small>
                                {t('Jusqu’au ', 'حتى ')}
                                <time dateTime={p.endDate}>
                                  {p.endDate.split('-').reverse().join('/')}
                                </time>
                              </small>
                            )}
                          </div>
                        </article>
                      ))}
                    </section>
                  )}
                  <CatalogProducts
                    data={d}
                    id={id}
                    ar={ar}
                    preview={preview || view === 'demo'}
                    onRequest={onRequest}
                    onMessage={setMsg}
                  />
                  {photos.length > 0 && (
                    <div className="catalogue-photos-integrated">
                      <h3>{sectionHeading(d, 'photos', t('En images', 'بالتصاور'))}</h3>
                      <PhotoGallery photos={photos} ar={ar} />
                    </div>
                  )}
                  {hasVideo && (
                    <CatalogVideos
                      data={d}
                      ar={ar}
                      title={sectionHeading(d, 'video', t('En vidéo', 'بالفيديو'))}
                    />
                  )}
                </div>
              );
            }
            if (key === 'promotions') {
              if (!a.hidden.includes('services')) return null;
              return <CardSection key={key} d={d} section={key} preview={preview} />;
            }
            if (key === 'photos') return null;
            if (key === 'pdf' && catalogDocuments(d).length)
              return (
                <div className="panel" key={key}>
                  <CatalogDocuments data={d} id={id} ar={ar} preview={preview} />
                </div>
              );
            if (key === 'video') return null;
            if (key === 'links' && Array.isArray(d.profileLinks))
              return (
                <ProfileLinksView
                  key={key}
                  data={d}
                  group="links"
                  ar={ar}
                  heading={sectionHeading(d, 'links', '')}
                  onMessage={setMsg}
                />
              );
            if (key === 'links' && webLink(d.website))
              return (
                <a
                  className="secondary full"
                  key={key}
                  href={webLink(d.website)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe size={18} />
                  <span className="contact-label">
                    {sectionHeading(d, 'links', t('Site web', 'الموقع'))}
                  </span>
                </a>
              );
            return null;
          })}
      </section>
    );
  }
  return <Card {...props} />;
}
