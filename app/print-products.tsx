import Image from 'next/image';
import { printProducts, printQuoteHref } from './lib/print-products';
import './print-products.css';

export default function PrintProducts({ ar = false }: { ar?: boolean }) {
  const t = (fr: string, arabic: string) => (ar ? arabic : fr);
  const lang = ar ? 1 : 0;
  return (
    <>
      <section
        className="group-section print-catalogue"
        id="offre"
        aria-labelledby="print-products-title"
      >
        <div className="group-section-label">01 / {t('NOS PRODUITS', 'المنتوجات ديالنا')}</div>
        <h2 id="print-products-title">
          {t('Choisissez votre support.', 'اختارو المطبوع المناسب ليكم.')}
        </h2>
        <p className="print-section-intro">
          {t(
            'Quatre familles pour donner forme à vos idées. Chaque demande est étudiée avant confirmation du support, du prix et du délai.',
            'أربع فئات باش نعطيو شكل للأفكار ديالكم. كل طلب كيتدرس قبل تأكيد الورق، الثمن والآجال.',
          )}
        </p>
        <p className="print-reference-notice" role="note">
          {t(
            'Visuels de référence : illustrations générées pour présenter des idées de produits. Les supports et finitions sont confirmés sur devis.',
            'صور مرجعية مولدة للتوضيح وتقديم أفكار للمنتوجات. الورق والتشطيبات كيتأكدو فعرض الثمن.',
          )}
        </p>
        <div className="print-product-grid">
          {printProducts.map((product) => (
            <article
              className="print-product-card"
              key={product.reference}
              id={product.reference.toLowerCase()}
            >
              <figure>
                <Image
                  unoptimized
                  src={product.image}
                  alt={product.alt[lang]}
                  width={1200}
                  height={800}
                  loading="lazy"
                />
                <figcaption>{t('Illustration conceptuelle', 'صورة توضيحية')}</figcaption>
              </figure>
              <div className="print-product-copy">
                <div className="print-product-reference">
                  <span dir="ltr">{product.reference}</span>
                  <span>{t('Sur devis', 'حسب عرض الثمن')}</span>
                </div>
                <h3>{product.title[lang]}</h3>
                <p>{product.description[lang]}</p>
                <ul>
                  {product.details.map(([fr, arabic]) => (
                    <li key={fr}>{t(fr, arabic)}</li>
                  ))}
                </ul>
                <a
                  className="group-button"
                  href={printQuoteHref(product, ar)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t(
                    'Demander un devis : ' + product.title[0],
                    'طلب عرض ثمن: ' + product.title[1],
                  )}
                >
                  {t('Demander un devis ↗', 'طلب عرض ثمن ↗')}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="group-section print-quote-process" aria-labelledby="print-process-title">
        <div className="group-section-label">
          02 / {t('VOTRE PROJET, PAS À PAS', 'المشروع ديالكم، خطوة بخطوة')}
        </div>
        <h2 id="print-process-title">{t('On prépare ensemble.', 'نوجدو المشروع مجموعين.')}</h2>
        <div className="print-process-grid">
          {[
            [
              '01',
              'Vous partagez votre besoin.',
              'كتشاركو الاحتياج ديالكم.',
              'Produit, quantité, format, date souhaitée et visuel disponible : ces éléments nous aident à étudier votre demande.',
              'المنتوج، الكمية، القياس، التاريخ والتصميم إلا كان واجد: هاد المعلومات كتعاوننا ندرسو الطلب.',
            ],
            [
              '02',
              'Nous étudions les possibilités.',
              'كندرسو الإمكانيات.',
              'Le devis précise le support, les finitions retenues, le prix et le délai proposés.',
              'عرض الثمن كيوضح الورق، التشطيبات، الثمن والآجال المقترحة.',
            ],
            [
              '03',
              'Vous validez le visuel.',
              'كتأكدو التصميم.',
              'La composition et les détails de la commande sont validés avec vous avant la production.',
              'التصميم وتفاصيل الطلب كيتأكدو معاكم قبل الإنتاج.',
            ],
          ].map(([n, f, a, d, da]) => (
            <article key={n}>
              <span dir="ltr">{n}</span>
              <h3>{t(f, a)}</h3>
              <p>{t(d, da)}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="group-section print-digital-link">
        <div>
          <div className="group-section-label">
            03 / {t('LE LIEN EN PLUS', 'الرابط اللي كيكمل')}
          </div>
          <h2>{t('Et si votre papier ouvrait une porte ?', 'وعلاش المطبوع ما يفتحش باب جديد؟')}</h2>
          <p>
            {t(
              'Un QR code peut relier votre carte, votre étiquette ou votre invitation à un profil, un catalogue ou une page en ligne. Étudions ce lien avec SoraConnect.',
              'رمز QR يقدر يربط البطاقة، الملصق ولا الدعوة بصفحة مهنية، كاتالوغ ولا صفحة فالإنترنت. ندرسو هاد الرابط مع SoraConnect.',
            )}
          </p>
        </div>
        <a className="group-button" href={'/soraconnect' + (ar ? '?lang=ar' : '')}>
          {t('Découvrir SoraConnect ↗', 'اكتاشفو SoraConnect ↗')}
        </a>
      </section>
    </>
  );
}
