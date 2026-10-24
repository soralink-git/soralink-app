'use client';
import { Copy, ExternalLink } from 'lucide-react';
import AddressEditor from './address-editor';
import CardQR from './card-qr';
import type { DashboardContext } from './dashboard-editor';
import { publicCardPath } from './lib/public-address';

export default function DashboardShare({
  context,
}: {
  context: Pick<
    DashboardContext,
    'publicName' | 'setPublicName' | 'ar' | 'id' | 'busy' | 't' | 'published' | 'data' | 'setMsg'
  >;
}) {
  const {
    publicName = '',
    setPublicName = () => {},
    ar,
    id,
    busy,
    t,
    published,
    data,
    setMsg,
  } = context;
  return (
    <section className="panel">
      <AddressEditor current={publicName} onChange={setPublicName} ar={ar} disabled={!id || busy} />
      <p className="share-visibility" role="status">
        {t('Après enregistrement : ', 'من بعد التسجيل: ')}
        <strong>
          {published ? t('carte publique', 'الكارط عمومية') : t('carte privée', 'الكارط خاصة')}
        </strong>
      </p>
      <h2>{t('Une page. Plusieurs façons de la partager.', 'صفحة وحدة. طرق بزاف للمشاركة.')}</h2>
      {id ? (
        <>
          <div className="share-box">
            <CardQR
              id={id}
              publicName={publicName}
              logo={data.avatar}
              business={data.business || data.name}
              ar={ar}
            />
            <div>
              <label className="field">
                {t('Votre lien permanent', 'الرابط الدائم ديالك')}
                <input
                  readOnly
                  dir="ltr"
                  onFocus={(event) => event.currentTarget.select()}
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
                      setMsg(t('Copiez le lien depuis le champ.', 'نسخ الرابط من الخانة.'));
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
                  rel="noopener noreferrer"
                >
                  {t('Ouvrir', 'فتح')}
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>
          </div>

          <p className="hint">
            {published
              ? t('La page est publiée après enregistrement.', 'الصفحة كتتنشر من بعد التسجيل.')
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
  );
}
