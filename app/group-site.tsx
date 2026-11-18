import GroupBrand from './group-brand';
import Image from 'next/image';
import './group-site.css';

type Division = 'Link' | 'Print' | 'Connect';
export default function GroupSite({
  division = 'Link',
  ar = false,
}: {
  division?: Division;
  ar?: boolean;
}) {
  const t = (fr: string, arabic: string) => (ar ? arabic : fr);
  const suffix = ar ? '?lang=ar' : '';
  const root = division === 'Link';
  const print = division === 'Print';
  const path = root ? '/' : '/sora' + division.toLowerCase();
  const wa =
    'https://wa.me/212661446664?text=' +
    encodeURIComponent(
      t(
        'Bonjour, je souhaite discuter de mon projet avec Sora' + division + '.',
        'السلام عليكم، بغيت نتواصل مع Sora' + division + ' على المشروع ديالي.',
      ),
    );
  const categories = print
    ? [
        [
          '01',
          'Votre image, sur papier.',
          'صورتكم على الورق.',
          'Cartes de visite, flyers, papeterie et supports de communication : parlons du format et de la quantité adaptés à votre projet.',
          'بطاقات الزيارة، المنشورات والمطبوعات: نتفاهمو على الشكل والكمية المناسبة للمشروع ديالكم.',
        ],
        [
          '02',
          'Des attentions personnelles.',
          'هدايا بلمستكم.',
          'Cadeaux personnalisés et créations événementielles. Chaque demande fait l’objet d’une vérification de faisabilité avant devis.',
          'هدايا شخصية وإبداعات للمناسبات. كنراجعو إمكانية الإنجاز قبل ما نقدمو عرض الثمن.',
        ],
        [
          '03',
          'De la matière au lien.',
          'من المنتوج للرابط.',
          'Étiquettes, stickers et petites séries. Ajoutez un QR code pour relier votre support à votre présence numérique.',
          'ملصقات وكميات صغيرة. زيدو رمز QR باش تربطو المطبوع بالحضور الرقمي ديالكم.',
        ],
      ]
    : [
        [
          '01',
          'Une carte. Tous vos liens.',
          'بطاقة واحدة، جميع الروابط.',
          'Une page professionnelle pour partager vos coordonnées, votre activité et vos liens par QR code ou NFC.',
          'صفحة مهنية لمشاركة معلومات التواصل والنشاط والروابط عبر QR أو NFC.',
        ],
        [
          '02',
          'Votre offre à découvrir.',
          'خليو الناس يكتاشفو العرض ديالكم.',
          'Présentez votre catalogue, vos photos et vos documents. Les possibilités dépendent de l’offre activée sur votre compte.',
          'قدمو الكاتالوغ، الصور والوثائق. الإمكانيات كتختلف حسب العرض المفعل فالحساب.',
        ],
        [
          '03',
          'Des outils à votre mesure.',
          'حلول على قياسكم.',
          'Vous avez besoin d’un site, d’une automatisation ou d’un outil métier ? Nous étudions votre besoin avant de proposer une solution.',
          'محتاجين موقع، أتمتة ولا أداة للخدمة؟ كندرسو الاحتياج قبل اقتراح الحل.',
        ],
      ];
  return (
    <div className={'group-site group-' + division.toLowerCase()} dir={ar ? 'rtl' : 'ltr'}>
      <header className="group-header">
        <a href={'/' + suffix} aria-label="Groupe SoraLink">
          <GroupBrand division={division} />
        </a>
        <nav aria-label={t('Navigation du groupe', 'تصفح المجموعة')}>
          <a href={'/soraprint' + suffix}>SoraPrint</a>
          <a href={'/soraconnect' + suffix}>SoraConnect</a>
          <a href={path + (ar ? '?lang=fr' : '?lang=ar')} lang={ar ? 'fr' : 'ar'}>
            {ar ? 'Français' : 'العربية'}
          </a>
        </nav>
        <a className="group-account" href={'/?app=1' + (ar ? '&lang=ar' : '')}>
          {t('Mon espace ↗', 'الحساب ديالي ↗')}
        </a>
      </header>
      <main id="main-content" tabIndex={-1}>
        <section className="group-hero">
          <div className="group-kicker">
            {root
              ? t('GROUPE SORALINK · OUJDA, MAROC', 'مجموعة SORALINK · وجدة، المغرب')
              : t('UNE DIVISION DU GROUPE SORALINK', 'قسم من مجموعة SORALINK')}
          </div>
          <h1>
            {root ? (
              <>
                {t('Vos idées prennent', 'الأفكار ديالكم كتولي')}
                <br />
                <em>{t('forme. Et vie.', 'واقع. وكتوصل.')}</em>
              </>
            ) : print ? (
              <>
                {t('Petit tirage.', 'كميات صغيرة.')}
                <br />
                <em>{t('Grandes idées.', 'أفكار كبيرة.')}</em>
              </>
            ) : (
              <>
                {t('Votre activité.', 'النشاط ديالكم.')}
                <br />
                <em>{t('De nouveaux liens.', 'روابط جديدة.')}</em>
              </>
            )}
          </h1>
          <p className="group-intro">
            {root
              ? t(
                  'L’impression et le numérique se rencontrent. À Oujda, nous réunissons deux savoir-faire pour donner de la visibilité à vos projets, sur papier comme à l’écran.',
                  'الطباعة والرقمي كيتلاقاو. من وجدة، كنجمعو جوج مجالات باش نعطيو لمشاريعكم حضور، على الورق وفالشاشة.',
                )
              : print
                ? t(
                    'Pas besoin de commander en grande quantité pour voir grand. Construisons ensemble des supports qui vous ressemblent.',
                    'ما محتاجينش تطلبو كميات كبيرة باش تكون عندكم أفكار كبيرة. نصايبو معاكم مطبوعات كتعبر عليكم.',
                  )
                : t(
                    'Des cartes digitales et des solutions numériques pour rapprocher les professionnels de leurs clients. Simples à partager, utiles au quotidien.',
                    'بطاقات رقمية وحلول كتقرب المهنيين من الزبناء ديالهم. سهلة فالمشاركة ومفيدة كل نهار.',
                  )}
          </p>
          <div className="group-actions">
            <a className="group-button" href={root ? '#divisions' : print ? wa : '/demo' + suffix}>
              {root
                ? t('Découvrir nos deux univers ↓', 'اكتاشفو المجالين ↓')
                : print
                  ? t('Parlons de votre projet ↗', 'نهضرو على المشروع ديالكم ↗')
                  : t('Explorer la démo ↗', 'شوفو المثال التجريبي ↗')}
            </a>
            <a href={root ? wa : print ? '#offre' : '/?app=1' + (ar ? '&lang=ar' : '')}>
              {root
                ? t('Parlons de votre projet ↗', 'نهضرو على المشروع ديالكم ↗')
                : print
                  ? t('Explorer les possibilités ↓', 'شوفو الإمكانيات ↓')
                  : t('Accéder à mon espace ↗', 'دخلو للحساب ↗')}
            </a>
          </div>
          <div className="group-art" aria-hidden="true">
            <span className="group-paper">
              SoraPrint<span>↗</span>
            </span>
            <span className="group-pixel">
              SoraConnect<span>↗</span>
            </span>
            <span className="group-art-caption">
              {t('DU PHYSIQUE AU NUMÉRIQUE', 'من الملموس للرقمي')}
            </span>
          </div>
        </section>
        {root ? (
          <>
            <section className="group-section" id="divisions">
              <div className="group-section-label">
                01 / {t('DEUX SAVOIR-FAIRE, UNE VISION', 'جوج مجالات، رؤية وحدة')}
              </div>
              <div className="group-divisions">
                <a className="group-division print" href={'/soraprint' + suffix}>
                  <GroupBrand division="Print" />
                  <h2>{t('L’idée devient tangible.', 'الفكرة كتولي ملموسة.')}</h2>
                  <p>
                    {t(
                      'Impression, papeterie et personnalisation. Des supports à imaginer ensemble, même en petites quantités.',
                      'طباعة، مطبوعات ومنتوجات شخصية. نصمموها معاكم حتى بكميات صغيرة.',
                    )}
                  </p>
                  <span>{t('Découvrir SoraPrint ↗', 'اكتاشفو SoraPrint ↗')}</span>
                </a>
                <a className="group-division connect" href={'/soraconnect' + suffix}>
                  <GroupBrand division="Connect" />
                  <h2>{t('Le contact devient lien.', 'التواصل كيولي رابط.')}</h2>
                  <p>
                    {t(
                      'Cartes digitales, QR et NFC. Une présence numérique pour présenter votre activité et faciliter le contact.',
                      'بطاقات رقمية، QR وNFC. حضور رقمي لتقديم النشاط وتسهيل التواصل.',
                    )}
                  </p>
                  <span>{t('Découvrir SoraConnect ↗', 'اكتاشفو SoraConnect ↗')}</span>
                </a>
              </div>
            </section>
            <section className="group-section group-bridge">
              <div className="group-section-label">02 / {t('MIEUX ENSEMBLE', 'أحسن مجموعين')}</div>
              <h2>
                {t('Un support en main.', 'مطبوع فاليد.')}
                <br />
                {t('Un monde derrière.', 'وعالم من وراه.')}
              </h2>
              <p>
                {t(
                  'Une carte imprimée qui ouvre votre profil. Un packaging qui mène à votre catalogue. Un support de comptoir qui facilite le contact. Le physique et le numérique prolongent la même expérience.',
                  'بطاقة مطبوعة كتحل الصفحة ديالكم. تغليف كيوصل للكاتالوغ. حامل فوق الكونطوار كيسهل التواصل. الملموس والرقمي كيكملو نفس التجربة.',
                )}
              </p>
              <small>
                {t(
                  'Exemples d’usages proposés, selon faisabilité et devis.',
                  'أمثلة للاستعمال، حسب إمكانية الإنجاز وعرض الثمن.',
                )}
              </small>
            </section>
          </>
        ) : (
          <>
            <section className="group-section" id="offre">
              <div className="group-section-label">01 / {t('LES POSSIBILITÉS', 'الإمكانيات')}</div>
              <div className="group-categories">
                {categories.map(([n, f, a, d, da]) => (
                  <article key={n}>
                    <span>{n}</span>
                    <h2>{t(f, a)}</h2>
                    <p>{t(d, da)}</p>
                  </article>
                ))}
              </div>
              {print && (
                <p className="group-note">
                  {t(
                    'Formats, matières, quantités, prix et délais sont confirmés sur devis avant toute commande. Les prestations nécessitant un équipement non validé ne sont pas proposées comme disponibles.',
                    'الأشكال، المواد، الكميات، الأثمنة والآجال كتتأكد فعرض الثمن قبل الطلب.',
                  )}
                </p>
              )}
            </section>
            {!print && (
              <section className="group-section group-product">
                <div>
                  <div className="group-section-label">
                    02 / {t('LA PLATEFORME EXISTANTE', 'المنصة الحالية')}
                  </div>
                  <h2>{t('Découvrez avant de choisir.', 'اكتاشفو قبل ما تختارو.')}</h2>
                  <p>
                    {t(
                      'La plateforme de cartes digitales du groupe rejoint l’univers SoraConnect. Vos liens publics et votre espace restent accessibles. Les offres et conditions actuelles sont consultables ci-dessous.',
                      'منصة البطاقات الرقمية ديال المجموعة كتلتحق بـ SoraConnect. الروابط العمومية والحساب كيبقاو متاحين. العروض والشروط الحالية تلقاوها لتحت.',
                    )}
                  </p>
                  <a className="group-button" href={'/?offre=1' + (ar ? '&lang=ar' : '')}>
                    {t('Voir la plateforme et ses offres ↗', 'شوفو المنصة والعروض ↗')}
                  </a>
                </div>
                <Image
                  unoptimized
                  src="/soralink-pack-hero.webp"
                  alt={t(
                    'Présentation de la carte NFC et de la page professionnelle SoraLink',
                    'تقديم بطاقة NFC والصفحة المهنية SoraLink',
                  )}
                  width="1679"
                  height="937"
                  loading="lazy"
                />
              </section>
            )}
          </>
        )}
        <section className="group-section group-contact">
          <div className="group-section-label">{t('FAISONS CONNAISSANCE', 'نتعارفو')}</div>
          <h2>
            {t('Votre prochain projet', 'المشروع الجاي ديالكم')}
            <br />
            {t('commence ici.', 'كيبدا هنا.')}
          </h2>
          <a className="group-button" href={wa}>
            WhatsApp ↗
          </a>
          <a href="mailto:contact@soralink.link">contact@soralink.link</a>
          <span>{t('Oujda · Maroc', 'وجدة · المغرب')}</span>
        </section>
      </main>
      <footer className="group-footer">
        <GroupBrand />
        <p>
          {t(
            'Le lien entre vos idées et leurs possibilités.',
            'الرابط بين أفكاركم والإمكانيات ديالها.',
          )}
        </p>
        <nav>
          <a href={'/conditions' + suffix}>{t('Conditions de la plateforme', 'شروط المنصة')}</a>
          <a href={'/confidentialite' + suffix}>{t('Confidentialité', 'الخصوصية')}</a>
          <a href="tel:+212661446664" dir="ltr">
            +212 661 446 664
          </a>
        </nav>
      </footer>
    </div>
  );
}
