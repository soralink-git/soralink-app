import LegalView from '../legal-view';
export const metadata = { title: 'Conditions de service — SoraLink · Version pilote' };
export default async function Page({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const params = await searchParams;
  return (
    <LegalView
      initialArabic={params.lang === 'ar'}
      french={
        <>
          <h1>Conditions de service · Version pilote</h1>
          <p className="legal-status">
            Informations provisoires. Les CGV définitives et l’identité complète du vendeur doivent
            être communiquées avant le lancement commercial.
          </p>
          <h2>Offres et règlement</h2>
          <p>
            Pack 1 « Une carte, une action » : 99 DH, paiement unique pour une carte NFC et un QR
            code vers une destination externe. Sans compte ni abonnement SoraLink. Livraison
            séparée. Pack 2 E‑Identité : 149 DH. Pack 3 Produits et services : 249 DH. Pack 4 Suivi
            de mon activité : 499 DH. Pour ces trois packs, la première année est incluse ; la carte
            NFC physique est en supplément. Paiement manuel par virement ou espèces après
            confirmation ; aucun prélèvement automatique.
          </p>
          <h2>Renouvellement et assistance</h2>
          <p>
            L’essai dure 14 jours, sans prolongation automatique. Le service digital payé dure 12
            mois à partir de l’activation. Les packs 2, 3 et 4 se renouvellent chacun à 149 DH/an,
            en conservant toutes les fonctions du pack choisi, les modifications de contenus et
            l’hébergement. Une période de grâce de 15 jours suit l’échéance payée, puis la page est
            suspendue. Assistance prévue du lundi au vendredi, 10 h–18 h, première réponse sous deux
            jours ouvrés. Matériau, finition, fabrication, livraison, frais et conditions de
            remplacement sont précisés avant validation de la commande.
          </p>
          <h2>Limites et disponibilité</h2>
          <p>
            Une carte digitale par compte. E‑Identité comprend le logo, le modèle, les coordonnées,
            les réseaux et les liens. Le pack Produits et services ajoute jusqu’à 40 articles, les
            catégories, les promotions et le catalogue PDF : 3 PDF de 25 Mo et 100 pages maximum par
            document, 400 Mo de stockage et 160 fichiers maximum par défaut, sous réserve des droits
            attribués. Les commandes et devis passent directement par WhatsApp. Le pack Suivi de mon
            activité ajoute les demandes et contacts centralisés, les notifications par e-mail et
            jusqu’à cinq prestations de rendez-vous. La page publique nécessite internet. Le NFC
            dépend du téléphone ; le QR ou le lien servent d’alternative.
          </p>
          <h2>Avant toute commande</h2>
          <p>
            Demandez le récapitulatif écrit de votre offre, les frais, les délais, les conditions de
            réclamation et l’identité du vendeur. Cette page ne remplace pas les CGV finales.
          </p>
          <p>
            <a href="mailto:contact@soralink.link">contact@soralink.link</a> ·{' '}
            <a href="https://wa.me/212661446664">WhatsApp</a>
          </p>
        </>
      }
      arabic={
        <>
          <section dir="rtl" lang="ar">
            <h2>شروط الخدمة · نسخة تجريبية</h2>
            <p>
              تقدر تجرّب الخدمة 14 يوم. من بعد خاص تفعيل اشتراك مؤدى عنه. المعلومات مؤقتة. الشروط
              النهائية ومعلومات البائع خاصها تتقدّم قبل الإطلاق التجاري. الباقة 1: كارط NFC لإجراء
              واحد بـ99 درهم مرة وحدة، بلا حساب ولا اشتراك، والتوصيل بوحدو. الباقة 2 للهوية الرقمية
              بـ149 درهم، الباقة 3 للمنتجات والخدمات بـ249 درهم، والباقة 4 لتتبّع النشاط والمواعيد
              بـ499 درهم. العام الأول داخل فالثمن. تجديد الباقات 2 و3 و4 بـ149 درهم فالعام مع جميع
              وظائف الباقة، تعديل المحتوى والاستضافة. كارط NFC المادية بزيادة. الأداء يدوي بعد
              التأكيد وبلا اقتطاع أوتوماتيكي. الباقة 2 فيها اللوگو، الستايل، معلومات التواصل،
              الشبكات والروابط. الباقة 3 كتزيد حتى 40 منتج وخدمة، التصنيفات، العروض، الكاتالوگ PDF
              والطلبات عبر WhatsApp. افتراضياً: 3 ملفات PDF، حتى 25 ميغا و100 صفحة لكل ملف، 400 ميغا
              و160 ملف فالتخزين، حسب الحقوق. الباقة 4 كتزيد الطلبات، معلومات الزبناء، إشعارات
              الإيميل وتدبير المواعيد حتى لخمس خدمات. الاشتراك كيدوم 12 شهر من التفعيل. من بعد الأجل
              كاينة مهلة 15 يوم قبل التوقيف. الاستعمال خاصو الإنترنت. المادة، مدة التوصيل ومصاريفو
              كيتأكدو قبل الطلب.
            </p>
          </section>
        </>
      }
    />
  );
}
