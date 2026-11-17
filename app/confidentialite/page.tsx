import LegalView from '../legal-view';
export const metadata = {
  title: 'Confidentialité — SoraLink · Version pilote',
  description:
    'Politique de confidentialité SoraLink : compte, carte publique, demandes reçues, fichiers et services utilisés.',
  alternates: { canonical: 'https://soralink.link/confidentialite' },
};
export default async function Page({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const params = await searchParams;
  return (
    <LegalView
      initialArabic={params.lang === 'ar'}
      french={
        <>
          <h1>Confidentialité</h1>
          <p className="legal-status">
            Notice de la version pilote. L’identité du responsable, les durées de conservation et
            les formalités applicables restent à finaliser avant commercialisation.
          </p>
          <h2>Votre compte et votre carte</h2>
          <p>
            L’e-mail sert à l’inscription et à la connexion. Vous choisissez les coordonnées et
            contenus publiés sur votre carte. Les champs masqués ne sont pas transmis dans les
            données de la carte publique après enregistrement. Une information publiée reste
            consultable et peut être copiée par les visiteurs.
          </p>
          <h2>Demandes et échanges de coordonnées</h2>
          <p>
            Les formulaires transmettent au professionnel concerné le nom, le téléphone, le message
            et l’e-mail éventuellement renseigné. L’échange de coordonnées demande un accord
            explicite. Le professionnel retrouve les données dans son espace et peut supprimer les
            contacts reçus.
          </p>
          <h2>Fichiers et stockage</h2>
          <p>
            Les fichiers non publiés sont réservés au propriétaire connecté. La dépublication ou la
            suspension retire l’accès public à leurs liens, sauf si le même fichier reste publié sur
            une autre carte. Les photos sont optimisées dans votre navigateur avant l’envoi. Les
            médias retirés sont supprimés après enregistrement lorsqu’ils ne sont plus utilisés. Les
            nouveaux imports abandonnés sont nettoyés après 24 heures lors d’une prochaine action
            dans le compte. Les anciens fichiers sans propriétaire identifiable sont conservés pour
            éviter une suppression erronée.
          </p>
          <h2>Services utilisés</h2>
          <p>
            Supabase assure l’authentification. L’hébergement utilise Cloudflare, avec une base D1
            et un stockage R2. Les liens WhatsApp, Maps et réseaux sociaux ouvrent des services
            externes soumis à leurs propres règles. Les cookies de session servent à vous connecter
            ; les données du compte ne sont pas mises en cache hors connexion par la PWA.
          </p>
          <h2>Nous contacter</h2>
          <p>
            Pour demander une correction, un accès à vos données ou une suppression, écrivez à{' '}
            <a href="mailto:contact@soralink.link">contact@soralink.link</a>. La demande de
            suppression du compte est traitée par contact ; aucun effacement automatique à 90 jours
            n’est annoncé comme actif.
          </p>
        </>
      }
      arabic={
        <>
          <section dir="rtl" lang="ar">
            <h1>الخصوصية</h1>
            <p className="legal-status">
              هاد الإشعار ديال النسخة التجريبية. هوية المسؤول، مدد الاحتفاظ والإجراءات المطلوبة باقي
              خاصها تتكمّل قبل الإطلاق التجاري.
            </p>
            <h2>الحساب والكارط ديالك</h2>
            <p>
              الإيميل كيتستعمل للتسجيل والدخول. كتختار معلومات التواصل والمحتوى اللي كيتنشر فالكارط.
              المعلومات المخبيّة ما كاتتسيفطش فبيانات الكارط العمومية من بعد التسجيل. المعلومات
              المنشورة يقدر الزوار يشوفوها وينسخوها.
            </p>
            <h2>الطلبات وتبادل معلومات التواصل</h2>
            <p>
              الاستمارات كترسل الاسم، التلفون، الرسالة والإيميل إلا تعمّر للمهني المعني. تبادل
              معلومات التواصل كيحتاج موافقة صريحة. المهني كيلقى المعلومات فالحساب ديالو ويقدر يحذف
              الكونطاكت اللي توصّل بيهم.
            </p>
            <h2>الملفات والتخزين</h2>
            <p>
              الملفات اللي ما منشوراش كيبقى الولوج ليها غير للمالك اللي داخل للحساب. إلغاء النشر ولا
              توقيف الكارط كيوقف الولوج العمومي للروابط، إلا بقى نفس الملف منشور فكارط أخرى. الصور
              كتتصغّر فالمتصفح قبل الإرسال. الملفات المحيّدة كيتحذفو من بعد التسجيل إلا ما بقاوش
              مستعملين. الملفات الجديدة اللي تخلّاو عليها كيتنقّاو من بعد 24 ساعة مع عملية جاية
              فالحساب. الملفات القديمة اللي ما معروفش مالكها كيبقاو محفوظين باش ما يتحذفوش بالغلط.
            </p>
            <h2>الخدمات المستعملة</h2>
            <p>
              Supabase كيتكلف بالدخول للحساب. الاستضافة فـ Cloudflare مع قاعدة D1 وتخزين R2. روابط
              WhatsApp وMaps والشبكات كتفتح خدمات خارجية عندها الشروط ديالها. كوكيز الجلسة كيتستعملو
              للدخول؛ بيانات الحساب ما كتتخزّنش للاستعمال بلا إنترنت فـ PWA.
            </p>
            <h2>تواصل معانا</h2>
            <p>
              للتصحيح، الاطلاع على المعلومات ولا طلب الحذف، راسل{' '}
              <a href="mailto:contact@soralink.link">contact@soralink.link</a>. حذف الحساب كيتعالج
              بالتواصل؛ ما كاينش حذف أوتوماتيكي معلن عليه من بعد 90 يوم.
            </p>
          </section>
        </>
      }
    />
  );
}
