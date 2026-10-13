'use client';
import { vcardText } from './lib/vcard';
import { useState, useEffect } from 'react';
import { Nfc, Phone, Mail, MapPin, Download, Globe, Users, Share2 } from 'lucide-react';
import { socialLink } from './lib/social-links';
import { appearance } from './lib/personalization';
import { normalizeCatalogue, cataloguePrice } from './lib/catalogue';
import { activePromotions, promotionPrice, todayMorocco } from './lib/promotions';
import { recordedVideoUrl } from './lib/content-media';
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
  onMessage,
  onRequest,
  onDiscover,
  ...props
}: CardViewProps & {
  ar: boolean;
  setAr: (value: boolean) => void;
  view?: string;
  id?: string;
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
          (withSections ? ' unified-card' : '')
        }
        style={
          {
            '--card-color': d.color || '#d5b66f',
            '--accent': a.buttonColor || d.color || '#d5b66f',
            '--accent-text': accentText(a.buttonColor || d.color),
            ...(a.textColor ? { '--card-fg': a.textColor, '--card-muted': a.textColor } : {}),
            '--button-radius': a.shape === 'pill' ? '30px' : a.shape === 'square' ? '0px' : '8px',
            '--avatar-radius': a.avatarShape === 'square' ? '12px' : '50%',
          } as any
        }
      >
        <div className="card-cover" style={d.cover ? { backgroundImage: `url(${d.cover})` } : {}}>
          <a
            className="card-brand"
            dir="ltr"
            href="/"
            aria-label={t('SoraLink — Accueil', 'SoraLink — الرئيسية')}
          >
            SoraLink <Nfc size={18} />
          </a>
          {(preview || view === 'public' || view === 'demo') && (
            <button
              type="button"
              className="card-language"
              onClick={() => setAr(!ar)}
              aria-label={ar ? 'Passer en français' : 'بدّل للدارجة'}
            >
              <Globe size={16} />
              <span lang={ar ? 'fr' : 'ar'} dir={ar ? 'ltr' : 'rtl'}>
                {ar ? 'FR' : 'العربية'}
              </span>
            </button>
          )}
        </div>
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
              <button
                className="card-button card-save"
                onClick={() => {
                  const blob = new Blob(
                    [
                      vcardText({
                        name: d.name,
                        phone: a.hidePhone ? '' : d.phone,
                        email: a.hideEmail ? '' : d.email,
                      }),
                    ],
                    { type: 'text/vcard' },
                  );
                  download(blob, 'contact.vcf');
                }}
              >
                <Download size={16} />
                {t('Enregistrer le contact', 'سجّل الكونطاكت')}
              </button>
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
              <button className="exchange-button" onClick={() => void sharePublicCard(d, preview)}>
                <Share2 size={18} />
                {t('Partager cette carte', 'شارك هاد الكارط')}
              </button>
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
                <Users size={18} />
                {t('Échanger nos coordonnées', 'نتبادلو معلومات التواصل')}
              </button>
            </div>
          )}
          {withSections && <Details d={d} preview={preview} />}
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
    if (section === 'coordinates') {
      if (
        !(
          (!a.hidePhone && d.phone) ||
          (!a.hideEmail && d.email) ||
          (!a.hideWhatsApp && d.whatsapp) ||
          (!a.hideLocation && location.maps)
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
              <a href={'tel:' + d.phone} aria-label={t('Téléphone', 'التلفون')}>
                <Phone size={18} />
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
              </a>
            )}
            {!a.hideEmail && d.email && (
              <a
                href={'mailto:' + String(d.email).trim()}
                aria-label={t('Contacter par e-mail', 'تواصل بالإيميل')}
                aria-expanded={emailActions}
                onClick={(e) => {
                  e.preventDefault();
                  setEmailActions(!emailActions);
                }}
              >
                <Mail size={18} />
              </a>
            )}
            {!a.hideLocation && location.maps && (
              <a href={location.maps} target="_blank" rel="noreferrer" aria-label="Adresse">
                <MapPin size={18} />
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
          {!a.hideLocation && location.maps && (
            <div className="location-links">
              {d.address && <p className="muted">{d.address}</p>}
              <div className="row">
                <a
                  className="secondary small"
                  href={location.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin size={16} />
                  {t('Voir sur Maps', 'شوف فـ Maps')}
                </a>
                {location.directions && (
                  <a
                    className="secondary small"
                    href={location.directions}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin size={16} />
                    {t('Itinéraire', 'كيفاش توصل')}
                  </a>
                )}
              </div>
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
              {socialFields.map(([key, label]) =>
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
                  {p.image && <img src={p.image} alt={p.title} loading="lazy" />}
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
            '--accent': a.buttonColor || d.color || '#d5b66f',
            '--accent-text': accentText(a.buttonColor || d.color),
            ...(a.textColor ? { '--card-fg': a.textColor, '--card-muted': a.textColor } : {}),
            '--button-radius': a.shape === 'pill' ? '30px' : a.shape === 'square' ? '0px' : '8px',
          } as any
        }
      >
        {a.order
          .filter((key) => !a.hidden.includes(key))
          .map((key) => {
            if (['coordinates', 'social', 'promotions', 'appointments'].includes(key))
              return <CardSection key={key} d={d} section={key} preview={preview} />;
            if (key === 'services' && d.services?.length) {
              const items = normalizeCatalogue(d.services).filter((item) => item.name);
              if (!items.length) return null;
              const categories = [...new Set(items.map((item) => item.category))];
              return (
                <div className="panel" key={key}>
                  <h2>
                    {sectionHeading(d, 'services', t('Produits et services', 'المنتجات والخدمات'))}
                  </h2>
                  {categories.map((category) => (
                    <section className="catalogue-category" key={category || 'uncategorized'}>
                      {(category || categories.length > 1) && (
                        <h3>{category || t('Autres', 'أخرى')}</h3>
                      )}
                      <div className="catalogue-grid">
                        {items
                          .filter((item) => item.category === category)
                          .map((item) => (
                            <article className="catalogue-item" key={item.id}>
                              {item.image && (
                                <img src={item.image} alt={item.name} loading="lazy" />
                              )}
                              <div>
                                <span className="catalogue-kind">
                                  {item.type === 'product'
                                    ? t('Produit', 'منتج')
                                    : t('Service', 'خدمة')}
                                </span>
                                <h3>{item.name}</h3>
                                {item.description && <p>{item.description}</p>}
                                {item.price && (
                                  <strong className="catalogue-price">
                                    {cataloguePrice(item.price)}
                                  </strong>
                                )}
                                <button
                                  className="secondary full"
                                  onClick={() => {
                                    if (preview) {
                                      setMsg(
                                        t(
                                          'Aperçu : les visiteurs pourront demander cet article sur votre carte publiée.',
                                          'معاينة: الزوار يقدرو يطلبو هاد العرض فالصفحة المنشورة.',
                                        ),
                                      );
                                      return;
                                    }
                                    if (view === 'demo') {
                                      setMsg(t('Exemple de carte.', 'مثال ديال كارط.'));
                                      return;
                                    }
                                    onRequest('commande', item);
                                  }}
                                >
                                  {item.type === 'product'
                                    ? t('Demander ce produit', 'طلب هاد المنتج')
                                    : t('Demander ce service', 'طلب هاد الخدمة')}
                                </button>
                              </div>
                            </article>
                          ))}
                      </div>
                    </section>
                  ))}
                </div>
              );
            }
            if (key === 'photos' && d.photos?.length)
              return (
                <div className="panel" key={key}>
                  <h2>{sectionHeading(d, 'photos', t('En images', 'بالتصاور'))}</h2>
                  <div className="gallery">
                    {d.photos.map((url: string) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt="Réalisation" />
                      </a>
                    ))}
                  </div>
                </div>
              );
            if (key === 'pdf' && d.pdf)
              return (
                <div className="panel" key={key}>
                  <h2>{sectionHeading(d, 'pdf', t('Catalogue', 'الكاتالوگ'))}</h2>
                  <iframe className="pdf" title="Catalogue PDF" src={d.pdf} />
                </div>
              );
            if (key === 'video' && (d.video || recordedVideoUrl(d.recordedVideo))) {
              let youtubeId = '';
              try {
                const u = new URL(d.video);
                youtubeId =
                  (u.hostname === 'youtu.be'
                    ? u.pathname.slice(1)
                    : ['youtube.com', 'www.youtube.com'].includes(u.hostname)
                      ? u.searchParams.get('v')
                      : null) || '';
              } catch {}
              const localVideo = recordedVideoUrl(d.recordedVideo);
              if (!localVideo && !/^[\w-]{11}$/.test(youtubeId)) return null;
              return (
                <div className="panel" key={key}>
                  <h2>{sectionHeading(d, 'video', t('En vidéo', 'بالفيديو'))}</h2>
                  {localVideo && (
                    <video
                      className="content-video"
                      src={localVideo}
                      controls
                      playsInline
                      preload="metadata"
                      aria-label={t('Vidéo de présentation', 'فيديو للتقديم')}
                    >
                      {t(
                        'Votre navigateur ne prend pas en charge cette vidéo.',
                        'المتصفح ديالك ما كيدعمش هاد الفيديو.',
                      )}
                      <a href={localVideo}>{t('Ouvrir la vidéo', 'حل الفيديو')}</a>
                    </video>
                  )}
                  {/^[\w-]{11}$/.test(youtubeId) && (
                    <iframe
                      className="video"
                      title="Vidéo YouTube"
                      src={'https://www.youtube-nocookie.com/embed/' + youtubeId}
                      allowFullScreen
                    />
                  )}
                </div>
              );
            }
            if (key === 'links' && webLink(d.website))
              return (
                <a
                  className="secondary full"
                  key={key}
                  href={webLink(d.website)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe size={17} />
                  {sectionHeading(d, 'links', t('Site web', 'الموقع'))}
                </a>
              );
            return null;
          })}
      </section>
    );
  }
  return <Card {...props} />;
}
