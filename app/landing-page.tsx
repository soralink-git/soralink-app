'use client';
import './landing.css';
import OfferGrid from './offer-grid';
import {
  ExternalLink,
  Users,
  ShoppingBag,
  RefreshCw,
  Check,
  X,
  UtensilsCrossed,
  Store,
  Briefcase,
  TrendingUp,
  Star,
} from 'lucide-react';
import { WhatsAppIcon } from './card-helpers';

export default function LandingPage({ ar, auth }: { ar: boolean; auth: boolean }) {
  const t = (fr: string, da: string) => (ar ? da : fr);
  return (
    <main id="main-content" tabIndex={-1} className="landing landing-simple">
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="landing-kicker">
            <span aria-hidden="true" />
            {t('Carte NFC, QR code et page digitale', 'كارط NFC، كود QR وصفحة رقمية')}
          </span>
          <h1>
            {t(
              'Ne perdez plus jamais un client après un premier contact.',
              'ما تفلت حتى زبون من بعد أول تواصل.',
            )}
          </h1>
          <p>
            {t(
              'Votre activité, à portée de main : partagez vos coordonnées, votre catalogue et votre localisation en 1 seconde par NFC ou QR code. Vos clients enregistrent votre contact et commandent sur WhatsApp sans installer d’application.',
              'النشاط ديالك، قريب ليك : شارك معلوماتك، الكاتالوج ديالك وموقعك فثانية وحدة بـ NFC ولا كود QR. الزبناء ديالك كيسجلو رقمك وكيطلبو عبر WhatsApp بلا ما يحتاجو يتيليشارجيو أي تطبيق.',
            )}
          </p>
          <div className="landing-actions">
            <a
              className="primary"
              href={
                'https://wa.me/212661446664?text=' +
                encodeURIComponent(
                  t(
                    'Bonjour, je souhaite commander une carte SoraLink NFC pour mon activité. Pouvez-vous me présenter les offres ?',
                    'السلام عليكم، بغيت نطلب كارط SoraLink NFC للنشاط ديالي. ممكن تعطيني معلومات على العروض؟',
                  ),
                )
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              {t('Commander sur WhatsApp', 'طلب عبر WhatsApp')}
            </a>
            <a className="secondary" href={'/demo' + (ar ? '?lang=ar' : '')}>
              {t('Explorer la démo', 'شوف المثال التجريبي')}
              <ExternalLink size={16} />
            </a>
          </div>
          <div className="landing-reassurance" role="note" aria-label="Garanties SoraLink">
            <span className="reassurance-item">
              <span className="check-badge">✓</span>
              {t('Prêt en 24h', 'جاهزة فـ 24 ساعة')}
            </span>
            <span className="sep" aria-hidden="true">
              ·
            </span>
            <span className="reassurance-item">
              <span className="check-badge">✓</span>
              {t('Zéro application à installer', 'بلا أي تطبيق')}
            </span>
            <span className="sep" aria-hidden="true">
              ·
            </span>
            <span className="reassurance-item">
              <span className="check-badge">✓</span>
              {t('Livraison partout au Maroc', 'توصيل لجميع مدن المغرب')}
            </span>
          </div>
        </div>
        <div className="landing-brand-visual" id="exemples">
          <img
            src="/soralink-pack-hero.webp"
            width="1679"
            height="937"
            fetchPriority="high"
            alt={t(
              'Carte de visite digitale NFC et QR code SoraLink posée à côté d’un smartphone affichant un profil professionnel au Maroc.',
              'بطاقة عمل رقمية وكارطات SoraLink بتقنية NFC مع رمز QR بجانب هاتف ذكي يعرض صفحة مهنية في المغرب.',
            )}
          />
        </div>
      </section>

      <section
        className="landing-quick-benefits"
        id="fonctionnalites"
        aria-label={t('SoraLink en bref', 'SoraLink باختصار')}
      >
        {[
          [
            Users,
            'Partagez vos contacts',
            'شارك معلومات التواصل',
            'Téléphone, WhatsApp et réseaux.',
            'التلفون، WhatsApp ومواقع التواصل.',
          ],
          [
            ShoppingBag,
            'Présentez vos offres',
            'قدّم العروض ديالك',
            'Produits, services et catalogue PDF.',
            'منتجات، خدمات وكاتالوگ PDF.',
          ],
          [
            RefreshCw,
            'Modifiez à tout moment',
            'بدّل وقتما بغيتي',
            'Le même lien et la même carte.',
            'نفس الرابط ونفس الكارط.',
          ],
        ].map(([Icon, fr, da, text, textAr], i) => {
          const Symbol = Icon as typeof Users;
          return (
            <article key={i}>
              <Symbol size={28} aria-hidden="true" />
              <h2>{t(fr as string, da as string)}</h2>
              <p>{t(text as string, textAr as string)}</p>
            </article>
          );
        })}
      </section>

      {/* Section B: Comparatif Carte Papier vs SoraLink */}
      <section className="landing-comparison" id="comparatif">
        <div className="landing-heading">
          <span className="landing-kicker">
            <span aria-hidden="true" />
            {t('LE COMPARATIF', 'مقارنة مباشرة')}
          </span>
          <h2>
            {t(
              'Pourquoi remplacer vos cartes papier dès aujourd’hui ?',
              'علاش تبدّل الكارط الورقية من اليوم؟',
            )}
          </h2>
          <p>
            {t(
              'La carte de visite papier finit trop souvent oubliée. Découvrez l’impact immédiat du digital pour votre activité.',
              'الكارط الورقية كتمشي بزاف دالمرات فالقمامة ولا كتنسى. شوف الفرق الحقيقي اللي كيديرو الرقمي للنشاط ديالك.',
            )}
          </p>
        </div>
        <div className="comparison-table">
          <div className="comparison-col paper-col">
            <div className="col-header">
              <span className="col-badge bad" aria-hidden="true">
                ✕
              </span>
              <h3>{t('Carte papier traditionnelle', 'الكارط الورقية التقليدية')}</h3>
            </div>
            <ul>
              <li>
                <X size={18} className="icon-bad" aria-hidden="true" />
                <span>
                  {t(
                    'Finie au fond d’une poche ou à la poubelle.',
                    'كتنسى فالجيب ولا كتلاح فالقمامة.',
                  )}
                </span>
              </li>
              <li>
                <X size={18} className="icon-bad" aria-hidden="true" />
                <span>
                  {t(
                    'Numéro ou adresse modifiés = tout réimprimer.',
                    'تبدلات النمرة ولا العنوان = خاص تعاود تطبع كلشي.',
                  )}
                </span>
              </li>
              <li>
                <X size={18} className="icon-bad" aria-hidden="true" />
                <span>
                  {t(
                    'Aucun aperçu de vos prix ou réalisations.',
                    'حتى فكرة على الأثمنة، التصاور ولا الخدمات ديالك.',
                  )}
                </span>
              </li>
              <li>
                <X size={18} className="icon-bad" aria-hidden="true" />
                <span>
                  {t('Aucun suivi de vos prospects.', 'حتى متابعة للزبناء المهتمين ولا فرص البيع.')}
                </span>
              </li>
            </ul>
          </div>
          <div className="comparison-col soralink-col">
            <div className="col-header">
              <span className="col-badge good" aria-hidden="true">
                ✓
              </span>
              <h3>{t('SoraLink NFC & Digitale', 'SoraLink الذكية والرقمية')}</h3>
            </div>
            <ul>
              <li>
                <Check size={18} className="icon-good" aria-hidden="true" />
                <span>
                  <strong>{t('Enregistrée en 1 clic', 'كتسجل فكليك واحد')}</strong>{' '}
                  {t('dans le répertoire du client (vCard).', 'فدليل الهاتف ديال الزبون (vCard).')}
                </span>
              </li>
              <li>
                <Check size={18} className="icon-good" aria-hidden="true" />
                <span>
                  <strong>
                    {t(
                      'Informations modifiables pendant l’abonnement',
                      'المعلومات قابلة للتعديل طول مدة الاشتراك',
                    )}
                  </strong>{' '}
                  {t('sans changer de carte.', 'بلا ما تبدل الكارط.')}
                </span>
              </li>
              <li>
                <Check size={18} className="icon-good" aria-hidden="true" />
                <span>
                  <strong>
                    {t(
                      'Catalogue produits, PDF et bouton WhatsApp',
                      'كاتالوج منتجات، PDF وزر WhatsApp',
                    )}
                  </strong>{' '}
                  {t('intégrés.', 'مدمجين.')}
                </span>
              </li>
              <li>
                <Check size={18} className="icon-good" aria-hidden="true" />
                <span>
                  <strong>
                    {t('Demandes de devis et rendez-vous', 'طلبات الأثمنة وحجز المواعيد')}
                  </strong>{' '}
                  {t('centralisés.', 'مجموعة فمكان واحد.')}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section C: Cas d'usage par métier */}
      <section className="landing-usecases" id="metiers">
        <div className="landing-heading">
          <span className="landing-kicker">
            <span aria-hidden="true" />
            {t('ADAPTÉ À VOTRE MÉTIER', 'لكل المجالات')}
          </span>
          <h2>{t('Une solution pensée pour votre activité', 'حل مفصّل على النشاط ديالك')}</h2>
          <p>
            {t(
              'Que vous receviez vos clients dans un établissement ou en déplacement, SoraLink s’adapte à votre métier.',
              'سواء كنت كتستقبل الزبناء فمحلك ولا كتحرك عندهم، SoraLink كيتماشى مع خدمتك.',
            )}
          </p>
        </div>
        <div className="usecase-grid">
          <article>
            <div className="usecase-icon-box">
              <UtensilsCrossed size={24} aria-hidden="true" />
            </div>
            <h3>{t('Restauration & Cafés', 'المطاعم والمقاهي')}</h3>
            <p>
              {t(
                'Menu digi…4207 tokens truncated…on>
    </main>
  );
}
