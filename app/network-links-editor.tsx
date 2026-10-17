'use client';
import { useState, useRef, useEffect } from 'react';
import { Globe, Star, Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { SocialIcon } from './card-helpers';
import {
  linkPlatforms,
  activeNetworkLinks,
  networkLinkURL,
  moveActiveSocialLink,
  type LinkPlatform,
} from './lib/network-links';
import type { DashboardContext } from './dashboard-editor';
function platformName(platform: LinkPlatform, ar: boolean) {
  return platform.key === 'website'
    ? ar
      ? 'موقع إلكتروني'
      : 'Site web'
    : platform.key === 'googleReview'
      ? ar
        ? 'تقييمات Google'
        : 'Avis Google'
      : platform.name;
}
function PlatformIcon({ platform }: { platform: LinkPlatform }) {
  return platform.key === 'website' ? (
    <Globe size={24} />
  ) : platform.key === 'googleReview' ? (
    <Star size={24} />
  ) : (
    <SocialIcon network={platform.key} />
  );
}
export function LinkPlatformPicker({
  data,
  ar,
  onChoose,
  onClose,
}: {
  data: any;
  ar: boolean;
  onChoose: (platform: LinkPlatform) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const t = (fr: string, a: string) => (ar ? a : fr);
  const added = new Set(activeNetworkLinks(data).map((platform) => platform.key));
  const filtered = linkPlatforms.filter((p) =>
    platformName(p, ar).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <section
      className="link-platform-picker"
      aria-label={t('Choisir une plateforme', 'اختار المنصة')}
    >
      <div className="link-picker-heading">
        <h3>{t('Quel lien souhaitez-vous ajouter ?', 'شنو الرابط اللي بغيتي تزيد؟')}</h3>
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
          placeholder={t('Instagram, site web…', 'Instagram، موقع إلكتروني…')}
        />
      </label>
      {(['social', 'other'] as const).map((group) => (
        <div key={group}>
          <h4>
            {group === 'social'
              ? t('Réseaux sociaux', 'مواقع التواصل')
              : t('Autres liens', 'روابط أخرى')}
          </h4>
          <div className="link-platform-grid">
            {filtered
              .filter((p) => p.group === group)
              .map((platform) => (
                <button
                  type="button"
                  key={platform.key}
                  disabled={added.has(platform.key)}
                  onClick={() => onChoose(platform)}
                >
                  <PlatformIcon platform={platform} />
                  <span>{platformName(platform, ar)}</span>
                  {added.has(platform.key) && <small>{t('Déjà ajouté', 'تزاد من قبل')}</small>}
                </button>
              ))}
          </div>
        </div>
      ))}
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
export default function NetworkLinksEditor({ context }: { context: DashboardContext }) {
  const { data, setData, busy, ar, t } = context;
  const [picker, setPicker] = useState(false),
    [editing, setEditing] = useState<LinkPlatform | null>(null),
    [value, setValue] = useState(''),
    [error, setError] = useState('');
  const addButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    const open = picker || !!editing;
    if (wasOpen.current && !open) addButton.current?.focus();
    wasOpen.current = open;
  }, [picker, editing]);
  const active = activeNetworkLinks(data),
    social = active.filter((p) => p.group === 'social');
  function cancel() {
    setEditing(null);
    setPicker(false);
    setError('');
    addButton.current?.focus();
  }
  function choose(platform: LinkPlatform) {
    setEditing(platform);
    setValue(data[platform.key] || '');
    setError('');
    setPicker(false);
  }
  function reorder(source: string, target: string) {
    setData((d: any) => moveActiveSocialLink(d, source, target));
  }
  return (
    <fieldset
      className="social-links-editor network-links-editor"
      disabled={busy}
      dir={ar ? 'rtl' : 'ltr'}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && (picker || editing)) {
          e.preventDefault();
          e.stopPropagation();
          cancel();
        }
      }}
    >
      <legend>{t('Réseaux et liens', 'مواقع التواصل والروابط')}</legend>
      <p className="hint">
        {t(
          'Choisissez une icône, ajoutez votre lien et retrouvez-le dans votre liste.',
          'اختار الأيقونة، زيد الرابط ديالك وغادي تلقاه فاللائحة.',
        )}
      </p>
      {!picker && !editing && (
        <button
          ref={addButton}
          type="button"
          className="secondary link-add-button"
          onClick={() => setPicker(true)}
          disabled={active.length === linkPlatforms.length}
        >
          <Plus size={18} />
          {t('Ajouter un lien', 'زيد رابط')}
        </button>
      )}
      {picker && <LinkPlatformPicker data={data} ar={ar} onChoose={choose} onClose={cancel} />}
      {editing && (
        <form
          className="link-edit-form"
          onSubmit={(e) => {
            e.preventDefault();
            const url = networkLinkURL(editing.key, value);
            if (!url) {
              setError(
                t(
                  'Saisissez un lien web valide, par exemple https://exemple.ma.',
                  'دخل رابط صحيح، بحال https://exemple.ma.',
                ),
              );
              return;
            }
            const key = editing.key;
            setData((d: any) => ({ ...d, [key]: url }));
            setEditing(null);
            setError('');
          }}
        >
          <h3>
            <PlatformIcon platform={editing} />
            {platformName(editing, ar)}
          </h3>
          <label className="field">
            {t('Collez votre lien', 'لسق الرابط ديالك')}
            <input
              autoFocus
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              dir="ltr"
              maxLength={4000}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError('');
              }}
              placeholder={editing.example}
              aria-invalid={!!error}
              aria-describedby={error ? 'network-link-error' : undefined}
            />
          </label>
          {error && (
            <p id="network-link-error" role="alert">
              {error}
            </p>
          )}
          <div className="row">
            <button className="primary" type="submit">
              {t('Valider le lien', 'أكّد الرابط')}
            </button>
            <button type="button" className="secondary" onClick={cancel}>
              {t('Annuler', 'إلغاء')}
            </button>
          </div>
          <p className="hint">
            {t(
              'Enregistrez ensuite les modifications pour mettre votre carte à jour.',
              'من بعد سجّل التغييرات باش تحدّث الكارط.',
            )}
          </p>
        </form>
      )}
      {!active.length && !picker && !editing && (
        <div className="network-links-empty">
          <Globe size={32} />
          <h3>{t('Votre premier lien en quelques secondes', 'زيد أول رابط بسهولة')}</h3>
          <p>
            {t(
              'Cliquez sur « Ajouter un lien » pour choisir votre plateforme.',
              'ضغط على «زيد رابط» واختار المنصة ديالك.',
            )}
          </p>
        </div>
      )}
      {active.map((platform) => {
        const key = platform.key,
          index = social.findIndex((p) => p.key === key);
        return (
          <article
            className="network-link-card"
            key={key}
            onDragOver={(e) => {
              if (platform.group === 'social') e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (!busy && platform.group === 'social')
                reorder(e.dataTransfer.getData('text/soralink-network'), key);
            }}
          >
            <div className="network-link-identity">
              <PlatformIcon platform={platform} />
              <div>
                <strong>{platformName(platform, ar)}</strong>
                <span dir="ltr">{data[key]}</span>
              </div>
            </div>
            <div className="network-link-actions">
              <button
                type="button"
                onClick={() => choose(platform)}
                aria-label={t('Modifier ', 'بدّل ') + platformName(platform, ar)}
              >
                <Pencil size={16} />
                {t('Modifier', 'بدّل')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setData((d: any) => ({ ...d, [key]: '' }));
                  if (editing?.key === key) cancel();
                }}
                aria-label={t('Retirer ', 'حيّد ') + platformName(platform, ar)}
              >
                <Trash2 size={16} />
                {t('Retirer', 'حيّد')}
              </button>
              {platform.group === 'social' && (
                <div className="social-move-actions">
                  <button
                    type="button"
                    className="social-drag-handle"
                    draggable={!busy}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/soralink-network', key);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    aria-label={t('Déplacer ', 'حرّك ') + platformName(platform, ar)}
                  >
                    ⠿
                  </button>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => reorder(key, social[index - 1].key)}
                    aria-label={t('Monter ', 'طلّع ') + platformName(platform, ar)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === social.length - 1}
                    onClick={() => reorder(key, social[index + 1].key)}
                    aria-label={t('Descendre ', 'هبّط ') + platformName(platform, ar)}
                  >
                    ↓
                  </button>
                </div>
              )}
            </div>
          </article>
        );
      })}
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
        <p className="hint">
          {t(
            'Le site web et les avis Google gardent leurs réglages habituels. Le masquage du site se règle dans Actions directes.',
            'الموقع وتقييمات Google كيبقاو بالإعدادات ديالهم. إخفاء الموقع كتلقاه فقسم أزرار التواصل.',
          )}
        </p>
      </details>
      {!!data.hideSocial && social.length > 0 && (
        <p role="status">
          {t(
            'Vos réseaux sociaux sont masqués sur la carte. Vous pouvez les afficher dans « Visibilité des réseaux ».',
            'مواقع التواصل مخبيّين فالкарط. تقدر تظهرهم من «ظهور مواقع التواصل».',
          )}
        </p>
      )}
    </fieldset>
  );
}
