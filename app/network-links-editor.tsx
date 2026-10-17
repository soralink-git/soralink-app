'use client';
import { useState, useRef, useEffect } from 'react';
import { Globe, Star, Plus, Pencil, Trash2, Search, X, Phone, Mail, MapPin } from 'lucide-react';
import { SocialIcon, WhatsAppIcon } from './card-helpers';
import { linkPlatforms } from './lib/network-links';
import {
  PROFILE_LINK_LIMIT,
  profileLinks,
  replaceProfileLinks,
  moveProfileLink,
  profileLinkValue,
  profileLinkLabel,
  type ProfileLink,
  type ProfileLinkKind,
} from './lib/profile-links';
import type { DashboardContext } from './dashboard-editor';
type Platform = { key: ProfileLinkKind; name: string; group: string; example: string };
const platforms: Platform[] = [
  { key: 'phone', name: '', group: 'direct', example: '+212 661 000 000' },
  { key: 'whatsapp', name: 'WhatsApp', group: 'direct', example: '+212 661 000 000' },
  { key: 'email', name: '', group: 'direct', example: 'contact@exemple.ma' },
  { key: 'address', name: '', group: 'direct', example: '' },
  ...linkPlatforms,
];
function name(platform: Platform, ar: boolean) {
  return profileLinkLabel(
    { id: '', kind: platform.key, value: '', visible: true, labelFr: '', labelAr: '' },
    ar,
  );
}
function Icon({ platform }: { platform: Platform }) {
  if (platform.key === 'phone') return <Phone size={24} />;
  if (platform.key === 'whatsapp') return <WhatsAppIcon />;
  if (platform.key === 'email') return <Mail size={24} />;
  if (platform.key === 'address') return <MapPin size={24} />;
  if (platform.key === 'website') return <Globe size={24} />;
  if (platform.key === 'googleReview') return <Star size={24} />;
  return <SocialIcon network={platform.key} />;
}
function modePlatforms(mode: string) {
  return platforms.filter((p) =>
    mode === 'direct' ? p.group === 'direct' || p.key === 'website' : p.group !== 'direct',
  );
}
export function LinkPlatformPicker({
  data,
  ar,
  onChoose,
  onClose,
  mode = 'network',
}: {
  data: any;
  ar: boolean;
  onChoose: (platform: Platform) => void;
  onClose: () => void;
  mode?: string;
}) {
  const [query, setQuery] = useState('');
  const t = (fr: string, a: string) => (ar ? a : fr);
  const existing = profileLinks(data);
  const filtered = modePlatforms(mode).filter((p) =>
    name(p, ar).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <section
      className="link-platform-picker"
      aria-label={t('Choisir une plateforme', 'اختار المنصة')}
    >
      <div className="link-picker-heading">
        <h3>{t('Que souhaitez-vous ajouter ?', 'شنو بغيتي تزيد؟')}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('Fermer le choix des plateformes', 'سدّ اختيار المنصة')}
        >
          <X size={20} />
        </button>
      </div>
      <label className="field link-platform-search">
        <span>
          <Search size={16} />
          {t('Rechercher une plateforme', 'قلّب على منصة')}
        </span>
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('Rechercher…', 'قلّب…')}
        />
      </label>
      {['direct', 'social', 'other'].map((group) => {
        const choices = filtered.filter((p) => p.group === group);
        if (!choices.length) return null;
        return (
          <div key={group}>
            <h4>
              {group === 'direct'
                ? t('Actions directes', 'أزرار التواصل')
                : group === 'social'
                  ? t('Réseaux sociaux', 'مواقع التواصل')
                  : t('Autres liens', 'روابط أخرى')}
            </h4>
            <div className="link-platform-grid">
              {choices.map((platform) => {
                const count = existing.filter((e) => e.kind === platform.key).length;
                return (
                  <button type="button" key={platform.key} onClick={() => onChoose(platform)}>
                    <Icon platform={platform} />
                    <span>{name(platform, ar)}</span>
                    {count > 0 && (
                      <small>
                        {count} {t('ajouté(s)', 'مضاف')}
                      </small>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {!filtered.length && (
        <p role="status">
          {t(
            'Aucune plateforme trouvée. Essayez un autre nom.',
            'ما لقينا حتى منصة. جرّب اسم آخر.',
          )}
        </p>
      )}
    </section>
  );
}
export default function NetworkLinksEditor({
  context,
  mode = 'network',
}: {
  context: DashboardContext;
  mode?: 'direct' | 'network';
}) {
  const { data, setData, busy, ar, t } = context;
  const [picker, setPicker] = useState(false),
    [editing, setEditing] = useState<{ platform: Platform; entry?: ProfileLink } | null>(null),
    [value, setValue] = useState(''),
    [labelFr, setLabelFr] = useState(''),
    [labelAr, setLabelAr] = useState(''),
    [mapsUrl, setMapsUrl] = useState(''),
    [destination, setDestination] = useState(''),
    [error, setError] = useState('');
  const addButton = useRef<HTMLButtonElement>(null),
    wasOpen = useRef(false);
  useEffect(() => {
    const open = picker || !!editing;
    if (wasOpen.current && !open) addButton.current?.focus();
    wasOpen.current = open;
  }, [picker, editing]);
  const entries = profileLinks(data),
    available = modePlatforms(mode),
    active = entries.filter((e) => available.some((p) => p.key === e.kind));
  function cancel() {
    setEditing(null);
    setPicker(false);
    setError('');
  }
  function choose(platform: Platform, entry?: ProfileLink) {
    setEditing({ platform, entry });
    setValue(entry?.value || '');
    setLabelFr(entry?.labelFr || '');
    setLabelAr(entry?.labelAr || '');
    setMapsUrl(entry?.mapsUrl || '');
    setDestination(entry?.mapDestination || '');
    setError('');
    setPicker(false);
  }
  function change(id: string, patch: Partial<ProfileLink>) {
    setData((d: any) =>
      replaceProfileLinks(
        d,
        profileLinks(d).map((e) => (e.id === id ? { ...e, ...patch } : e)),
      ),
    );
  }
  function reorder(source: string, target: string) {
    setData((d: any) => moveProfileLink(d, source, target));
  }
  return (
    <fieldset
      className={
        mode === 'direct'
          ? 'contact-action-editor network-links-editor'
          : 'social-links-editor network-links-editor'
      }
      disabled={busy}
      dir={ar ? 'rtl' : 'ltr'}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && (picker || editing)) {
          e.preventDefault();
          cancel();
        }
      }}
    >
      <legend>
        {mode === 'direct'
          ? t('Vos actions de contact', 'أزرار التواصل ديالك')
          : t('Réseaux et liens', 'مواقع التواصل والروابط')}
      </legend>
      <p className="hint">
        {t(
          'Ajoutez plusieurs comptes ou contacts du même type. Un libellé permet de les distinguer.',
          'تقدر تزيد بزاف ديال الحسابات ولا معلومات التواصل من نفس النوع. زيد تسمية باش تفرّق بينهم.',
        )}
      </p>
      {!picker && !editing && (
        <button
          ref={addButton}
          type="button"
          className="secondary link-add-button"
          disabled={entries.length >= PROFILE_LINK_LIMIT}
          onClick={() => setPicker(true)}
        >
          <Plus size={18} />
          {mode === 'direct'
            ? t('Ajouter une action', 'زيد زر التواصل')
            : t('Ajouter un lien', 'زيد رابط')}
        </button>
      )}
      {picker && (
        <LinkPlatformPicker
          data={data}
          ar={ar}
          mode={mode}
          onChoose={(p) => choose(p)}
          onClose={cancel}
        />
      )}
      {editing && (
        <form
          key={editing.entry?.id || editing.platform.key}
          className="link-edit-form"
          onSubmit={(e) => {
            e.preventDefault();
            const normalized = profileLinkValue(editing.platform.key, value);
            if (!normalized) {
              setError(
                t(
                  'Renseignez un lien ou une coordonnée valide.',
                  'دخل رابط ولا معلومات تواصل صحيحة.',
                ),
              );
              return;
            }
            const original = editing.entry;
            const next: ProfileLink = {
              ...(original || {}),
              id: original?.id || crypto.randomUUID(),
              kind: editing.platform.key,
              value: normalized,
              labelFr: labelFr.trim(),
              labelAr: labelAr.trim(),
              visible: original?.visible ?? true,
              ...(editing.platform.key === 'address'
                ? { mapsUrl: mapsUrl.trim(), mapDestination: destination.trim() }
                : {}),
            };
            setData((d: any) => {
              const current = profileLinks(d);
              if (!original && current.length >= PROFILE_LINK_LIMIT) return d;
              return replaceProfileLinks(
                d,
                original
                  ? current.map((link) => (link.id === original.id ? next : link))
                  : [...current, next],
              );
            });
            cancel();
          }}
        >
          <h3>
            <Icon platform={editing.platform} />
            {name(editing.platform, ar)}
          </h3>
          <label className="field">
            {t('Libellé (facultatif)', 'التسمية (اختيارية)')}
            <input
              maxLength={80}
              value={ar ? labelAr : labelFr}
              onChange={(e) => (ar ? setLabelAr(e.target.value) : setLabelFr(e.target.value))}
              placeholder={t(
                'Ex. : Boutique Oujda, Service commercial…',
                'مثلاً: محل وجدة، المصلحة التجارية…',
              )}
            />
          </label>
          <label className="field">
            {editing.platform.key === 'address'
              ? t('Adresse', 'العنوان')
              : t('Lien ou coordonnée', 'الرابط ولا معلومات التواصل')}
            <input
              autoFocus
              type="text"
              inputMode={
                ['phone', 'whatsapp'].includes(editing.platform.key)
                  ? 'tel'
                  : editing.platform.key === 'email'
                    ? 'email'
                    : editing.platform.key === 'address'
                      ? 'text'
                      : 'url'
              }
              autoCapitalize="none"
              dir={editing.platform.key === 'address' ? undefined : 'ltr'}
              maxLength={4000}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError('');
              }}
              placeholder={editing.platform.example}
              aria-invalid={!!error}
              aria-describedby={error ? 'network-link-error' : undefined}
            />
          </label>
          {editing.platform.key === 'address' && (
            <details>
              <summary>{t('Préciser l’itinéraire', 'تحديد الطريق')}</summary>
              <label className="field">
                {t('Lien Google Maps (facultatif)', 'رابط Google Maps (اختياري)')}
                <input
                  type="url"
                  dir="ltr"
                  maxLength={4000}
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                />
              </label>
              <label className="field">
                {t('Destination précise ou coordonnées GPS', 'الموقع بالتدقيق ولا إحداثيات GPS')}
                <input
                  maxLength={4000}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </label>
            </details>
          )}
          {error && (
            <p id="network-link-error" role="alert">
              {error}
            </p>
          )}
          <div className="row">
            <button className="primary" type="submit">
              {t('Valider', 'أكّد')}
            </button>
            <button className="secondary" type="button" onClick={cancel}>
              {t('Annuler', 'إلغاء')}
            </button>
          </div>
          <p className="hint">
            {t(
              'Les modifications sont enregistrées automatiquement après validation.',
              'التغييرات كيتسجلو تلقائياً من بعد التأكيد.',
            )}
          </p>
        </form>
      )}
      {!active.length && !picker && !editing && (
        <div className="network-links-empty">
          <Globe size={32} />
          <h3>
            {mode === 'direct'
              ? t('Ajoutez votre premier contact', 'زيد أول وسيلة تواصل')
              : t('Votre premier lien en quelques secondes', 'زيد أول رابط بسهولة')}
          </h3>
          <p>
            {t(
              'Choisissez le type, puis renseignez ses informations.',
              'اختار النوع ومن بعد عمّر المعلومات ديالو.',
            )}
          </p>
        </div>
      )}
      {active.map((entry, index) => {
        const platform = platforms.find((p) => p.key === entry.kind)!;
        const title = profileLinkLabel(entry, ar);
        return (
          <article
            className="network-link-card"
            key={entry.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!busy) reorder(e.dataTransfer.getData('text/soralink-network'), entry.id);
            }}
          >
            <div className="network-link-identity">
              <Icon platform={platform} />
              <div>
                <strong>{title}</strong>
                <span dir="ltr">{entry.value}</span>
              </div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={entry.visible}
                onChange={(e) => change(entry.id, { visible: e.target.checked })}
              />
              {t('Visible sur la carte', 'يبان فالكارط')}
            </label>
            <div className="network-link-actions">
              <button
                type="button"
                onClick={() => choose(platform, entry)}
                aria-label={t('Modifier ', 'بدّل ') + title}
              >
                <Pencil size={16} />
                {t('Modifier', 'بدّل')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setData((d: any) =>
                    replaceProfileLinks(
                      d,
                      profileLinks(d).filter((link) => link.id !== entry.id),
                    ),
                  );
                  if (editing?.entry?.id === entry.id) cancel();
                }}
                aria-label={t('Retirer ', 'حيّد ') + title}
              >
                <Trash2 size={16} />
                {t('Retirer', 'حيّد')}
              </button>
              <div className="social-move-actions">
                <button
                  type="button"
                  className="social-drag-handle"
                  draggable={!busy}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/soralink-network', entry.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  aria-label={t('Déplacer ', 'حرّك ') + title}
                >
                  ⠿
                </button>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => reorder(entry.id, active[index - 1].id)}
                  aria-label={t('Monter ', 'طلّع ') + title}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === active.length - 1}
                  onClick={() => reorder(entry.id, active[index + 1].id)}
                  aria-label={t('Descendre ', 'هبّط ') + title}
                >
                  ↓
                </button>
              </div>
            </div>
          </article>
        );
      })}
      {entries.length >= PROFILE_LINK_LIMIT && (
        <p role="status">
          {t('Limite de 40 liens et actions atteinte.', 'وصلتي للحد ديال 40 رابط وزر تواصل.')}
        </p>
      )}
      {mode === 'network' && (
        <details className="network-links-visibility">
          <summary>{t('Visibilité des réseaux', 'ظهور مواقع التواصل')}</summary>
          <label className="toggle">
            <input
              type="checkbox"
              checked={!data.hideSocial}
              onChange={(e) => {
                const visible = e.target.checked;
                setData((d: any) => ({ ...d, hideSocial: !visible }));
              }}
            />
            {t('Afficher mes réseaux sociaux', 'إظهار مواقع التواصل ديالي')}
          </label>
        </details>
      )}
      {mode === 'direct' && (
        <p className="hint">
          {t(
            'La première adresse e-mail reçoit les notifications. Le premier numéro WhatsApp visible reçoit les demandes du catalogue.',
            'أول إيميل كيتوصل بالإشعارات. أول رقم WhatsApp ظاهر كيتوصل بطلبات الكاتالوگ.',
          )}
        </p>
      )}
      {!!data.hideSocial && mode === 'network' && (
        <p role="status">
          {t('Vos réseaux sociaux sont masqués sur la carte.', 'مواقع التواصل مخبيّين فالكارط.')}
        </p>
      )}
    </fieldset>
  );
}
