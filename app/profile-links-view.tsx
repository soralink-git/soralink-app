'use client';
import { useState } from 'react';
import { Phone, Mail, MapPin, Globe, Star } from 'lucide-react';
import { SocialIcon, WhatsAppIcon } from './card-helpers';
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
  const t = (fr: string, a: string) => (ar ? a : fr);
  const entries = visibleProfileLinks(data).filter(
    (entry) => profileLinkGroup(entry.kind) === group,
  );
  if (!entries.length) return null;
  return (
    <div className="panel profile-links-panel">
      {heading && <h2>{heading}</h2>}
      <div className="profile-links-list">
        {entries.map((entry) => (
          <div className="profile-link-public" key={entry.id}>
            <a
              href={profileLinkHref(entry)}
              target={['phone', 'email'].includes(entry.kind) ? undefined : '_blank'}
              rel="noopener noreferrer"
              aria-label={profileLinkLabel(entry, ar)}
              onClick={(e) => {
                if (entry.kind === 'email') {
                  e.preventDefault();
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
              <span>
                <strong>{profileLinkLabel(entry, ar)}</strong>
                <small dir={entry.kind === 'address' ? undefined : 'ltr'}>{entry.value}</small>
              </span>
            </a>
            {email === entry.id && entry.kind === 'email' && (
              <div className="email-actions">
                <input
                  readOnly
                  dir="ltr"
                  value={entry.value}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label={t('Adresse e-mail', 'عنوان الإيميل')}
                />
                <div className="row">
                  <a className="secondary small" href={profileLinkHref(entry)}>
                    {t('Ouvrir ma messagerie', 'حل تطبيق الإيميل')}
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(entry.value);
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
        ))}
      </div>
    </div>
  );
}
