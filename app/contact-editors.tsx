'use client';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';
import { WhatsAppIcon, SocialIcon } from './card-helpers';
import { appearance } from './lib/personalization';
import { socialOrder } from './lib/card-styles';
import type { DashboardContext } from './dashboard-editor';
export function ContactActionsEditor({ context }: { context: DashboardContext }) {
  const { data, setData, t, field, busy } = context;
  const rows = [
    {
      key: 'phone',
      hide: 'hidePhone',
      label: t('Appeler', 'عيّط'),
      fieldLabel: t('Téléphone', 'التلفون'),
      type: 'tel',
      icon: <Phone size={20} />,
    },
    {
      key: 'whatsapp',
      hide: 'hideWhatsApp',
      label: 'WhatsApp',
      fieldLabel: t('Numéro WhatsApp (+212…)', 'رقم WhatsApp (+212…)'),
      type: 'tel',
      icon: <WhatsAppIcon />,
    },
    {
      key: 'email',
      hide: 'hideEmail',
      label: t('E-mail', 'الإيميل'),
      fieldLabel: t('Adresse e-mail', 'عنوان الإيميل'),
      type: 'email',
      icon: <Mail size={20} />,
    },
    {
      key: 'address',
      hide: 'hideLocation',
      label: t('Localisation', 'الموقع'),
      fieldLabel: t('Adresse complète', 'العنوان كامل'),
      type: 'text',
      icon: <MapPin size={20} />,
    },
    {
      key: 'website',
      hide: '',
      label: t('Site web', 'الموقع الإلكتروني'),
      fieldLabel: t('Lien du site web', 'رابط الموقع الإلكتروني'),
      type: 'url',
      icon: <Globe size={20} />,
    },
  ];
  return (
    <fieldset className="contact-action-editor" disabled={busy}>
      <legend>{t('Vos actions de contact', 'أزرار التواصل ديالك')}</legend>
      <p className="hint">
        {t(
          'Activez les actions utiles et renseignez leurs coordonnées. Une action sans coordonnées reste invisible.',
          'فعّل الأزرار اللي محتاج وعمّر المعلومات ديالها. الزر اللي بلا معلومات ما كيبانش.',
        )}
      </p>
      {rows.map((row) => (
        <div className="contact-action-row" key={row.key}>
          <label className="toggle">
            {row.icon}
            <input
              type="checkbox"
              checked={row.hide ? !data[row.hide] : !appearance(data).hidden.includes('links')}
              onChange={(e) => {
                const visible = e.target.checked;
                setData((d: any) =>
                  row.hide
                    ? { ...d, [row.hide]: !visible }
                    : {
                        ...d,
                        hiddenSections: visible
                          ? appearance(d).hidden.filter((k: string) => k !== 'links')
                          : [...appearance(d).hidden, 'links'],
                      },
                );
              }}
            />
            {row.label}
          </label>
          {field(row.key, row.fieldLabel, row.type)}
          {row.key === 'address' && (
            <details>
              <summary>
                {t('Préciser le lien et l’itinéraire Google Maps', 'زيد رابط Google Maps والطريق')}
              </summary>
              {field('mapsUrl', t('Lien Google Maps', 'رابط Google Maps'), 'url')}
              {field(
                'mapDestination',
                t('Adresse précise ou coordonnées GPS', 'العنوان بالتدقيق ولا إحداثيات GPS'),
              )}
            </details>
          )}
        </div>
      ))}
      <p className="hint">
        {t(
          'Masquer une action conserve ses données dans votre espace. Enregistrez pour appliquer la visibilité publique.',
          'إخفاء زر كيخلّي المعلومات فالحساب ديالك. سجّل باش يتطبق التغيير فالصفحة العمومية.',
        )}
      </p>
    </fieldset>
  );
}
export function SocialLinksEditor({ context }: { context: DashboardContext }) {
  const { data, setData, socialFields, field, busy, t } = context;
  const ordered = socialOrder(data.socialOrder);
  function move(index: number, delta: number) {
    const next = [...ordered];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    setData((d: any) => ({ ...d, socialOrder: next }));
  }
  return (
    <fieldset className="social-links-editor" disabled={busy}>
      <legend>{t('Réseaux et liens', 'مواقع التواصل والروابط')}</legend>
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
          'Ajoutez vos liens et choisissez leur ordre avec les flèches. Les liens vides ne s’affichent pas.',
          'زيد الروابط ورتّبهم بالأسهم. الروابط الخاوية ما كيبانوش.',
        )}
      </p>
      {ordered.map((key, i) => {
        const label = socialFields.find(([k]) => k === key)?.[1] || key;
        return (
          <div
            className="social-editor-row"
            key={key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const from = ordered.indexOf(e.dataTransfer.getData('text/soralink-network'));
              if (from < 0 || from === i || busy) return;
              const next = [...ordered];
              const [moved] = next.splice(from, 1);
              next.splice(i, 0, moved);
              setData((d: any) => ({ ...d, socialOrder: next }));
            }}
          >
            <button
              type="button"
              className="social-drag-handle"
              draggable={!busy}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/soralink-network', key);
                e.dataTransfer.effectAllowed = 'move';
              }}
              aria-label={t('Déplacer ', 'حرّك ') + label}
            >
              ⠿
            </button>
            <SocialIcon network={key} />
            {field(key, label, 'url')}
            <div className="social-move-actions">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                aria-label={t('Monter ', 'طلّع ') + label}
              >
                ↑
              </button>
              <button
                type="button"
                disabled={i === ordered.length - 1}
                onClick={() => move(i, 1)}
                aria-label={t('Descendre ', 'هبّط ') + label}
              >
                ↓
              </button>
            </div>
          </div>
        );
      })}
      <details>
        <summary>{t('Avis Google', 'تقييمات Google')}</summary>
        {field('googleReview', t('Lien direct d’avis Google', 'رابط مباشر لتقييمات Google'), 'url')}
      </details>
    </fieldset>
  );
}
