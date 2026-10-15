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
            Digital : 149 DH/an. Pack : 349 DH la première année. Accompagnement : 549 DH la
            première année. Le Pack comprend le service Digital, une carte NFC personnalisée et 100
            cartes imprimées avec QR. Accompagnement ajoute la préparation et deux séries de
            corrections. Pro Rendez-vous : +250 DH/an. Paiement manuel par virement ou espèces après
            confirmation ; aucun prélèvement automatique.
          </p>
          <h2>Renouvellement et assistance</h2>
          <p>
            L’essai dure 14 jours, sans prolongation automatique. Le service digital payé dure 12
            mois à partir de l’activation et se renouvelle à 149 DH/an, avec l’option Pro facturée
            séparément. Assistance prévue du lundi au vendredi, 10 h–18 h, première réponse sous
            deux jours ouvrés. Matériau, finition, fabrication, livraison, frais et conditions de
            remplacement sont précisés avant validation de la commande.
          </p>
          <h2>Limites et disponibilité</h2>
          <p>
            Une carte digitale par compte ; jusqu’à 10 photos, 10 articles, 10 promotions et 400 Mo
            de stockage, avec 80 fichiers maximum. Pro inclut jusqu’à cinq prestations de
            rendez-vous dans l’agenda SoraLink. La page publique nécessite une connexion internet.
            Le NFC dépend du téléphone ; le QR ou le lien servent d’alternative. Le profil digital
            n’est pas proposé à vie.
          </p>
          <h2>Avant toute commande</h2>
          <p>
            Demandez le récapitulatif écrit de votre offre, les frais, les délais, les conditions de
            réclamation et l’identité du vendeur. Cette page ne remplace pas les CGV finales.
          </p>
          <p>
            <a href="mailto:soratap08@gmail.com">soratap08@gmail.com</a> ·{' '}
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
              النهائية ومعلومات البائع خاصها تتقدّم قبل الإطلاق التجاري. الديجيتال بـ149 درهم
              فالعام، الپاك بـ349 درهم فالعام الأول، والخدمة الكاملة بـ549 درهم فالعام الأول. خيار
              المواعيد كيزيد 250 درهم فالعام. الأداء يدوي بعد التأكيد، بلا اقتطاع أوتوماتيكي.
              المادة، التوصيل، الثمن، المدة وشروط التعويض كيتأكدو قبل الطلب. الصفحة الديجيتال
              باشتراك سنوي، ماشي مدى الحياة.
            </p>
          </section>
        </>
      }
    />
  );
}
