'use client';
import { useState, useId } from 'react';
import { Phone, Mail, MapPin, Globe, Star } from 'lucide-react';
import { SocialIcon, WhatsAppIcon } from './card-helpers';
import { serviceButtonStyle } from './lib/service-buttons';
import {
  visibleProfileLinks,
  profileLinkGroup,
  profileLinkHref,
  profileLinkLabel,
} from './lib/profile-links';
export default function ProfileLinksView({
  data,
  group,
  ar,
  heading = '',
  onMessage,
}: {
  data: any;
  group: string;
  ar: boolean;
  heading?: string;
  onMessage: (s: string) => void;
}) {
  const [email, setEmail] = useState('');
  const emailPanelId = useId();
  const t = (fr: string, a: string) => (ar ? a : fr);
  const entries = visibleProfileLinks(data).filter(
    (entry) => profileLinkGroup(entry.kind) === group,
  );
  const currentEmail = entries.find((entry) => entry.kind === 'email' && entry.id === email);
  if (!entries.length) return null;
  return (
    <div className="panel profile-links-panel">
      {heading && <h2>{heading}</h2>}
      <div className="profile-links-list">
        {entries.map((entry) => (
          <div className="profile-link-public" key={entry.id}>
            <a
              href={profileLinkHref(entry)}
              style={serviceButtonStyle(data, entry.kind)}
              target={['phone', 'email'].includes(entry.kind) ? undefined : '_blank'}
              rel="noopener noreferrer"
              aria-label={profileLinkLabel(entry, ar) + ' — ' + entry.value}
              title={profileLinkLabel(entry, ar) + ' — ' + entry.value}
              aria-expanded={entry.kind === 'email' ? email === entry.id : undefined}
              aria-controls={entry.kind === 'email' ? emailPanelId : undefined}
              onClick={(event) => {
                if (entry.kind === 'email') {
                  event.preventDefault();
                  setEmail(email === entry.id ? '' : entry.id);
                }
              }}
            >
              {entry.kind === 'phone' ? (
                <Phone size={22} />
              ) : entry.kind === 'whatsapp' ? (
                <WhatsAppIcon />
              ) : entry.kind === 'email' ? (
                <Mail size={22} />
              ) : entry.kind === 'address' ? (
                <MapPin size={22} />
              ) : entry.kind === 'website' ? (
                <Globe size={22} />
              ) : entry.kind === 'googleReview' ? (
                <Star size={22} />
              ) : (
                <SocialIcon network={entry.kind} />
              )}
            </a>
          </div>
        ))}
      </div>
      {currentEmail && (
        <div className="email-actions" id={emailPanelId}>
          <input
            readOnly
            dir="ltr"
            value={currentEmail.value}
            onFocus={(event) => event.currentTarget.select()}
            aria-label={t('Adresse e-mail', 'عنوان الإيميل')}
          />
          <div className="row">
            <a className="secondary small" href={profileLinkHref(currentEmail)}>
              {t('Ouvrir ma messagerie', 'حل تطبيق الإيميل')}
            </a>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(currentEmail.value);
                  onMessage(t('Adresse e-mail copiée.', 'تنسخ عنوان الإيميل.'));
                } catch {
                  onMessage(
                    t(
                      'Sélectionnez l’adresse affichée pour la copier.',
                      'اختار عنوان الإيميل باش تنسخو.',
                    ),
                  );
                }
              }}
            >
              {t('Copier l’adresse', 'نسخ العنوان')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
