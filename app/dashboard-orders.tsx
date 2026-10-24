'use client';
import { Phone } from 'lucide-react';
import type { DashboardContext } from './dashboard-editor';
import { offerLabel } from './lib/journey-links';
import { offers, RENEWAL_PRICE } from './lib/offers';
import LoadMore from './load-more';
import PaymentReceiptUpload from './payment-receipt-upload';

export default function DashboardOrders({
  context,
}: {
  context: Pick<
    DashboardContext,
    | 't'
    | 'subscription'
    | 'ar'
    | 'busy'
    | 'action'
    | 'load'
    | 'setMsg'
    | 'orders'
    | 'historyPages'
    | 'historyBusy'
    | 'loadMoreHistory'
  >;
}) {
  const {
    t,
    subscription,
    ar,
    busy,
    action,
    load,
    setMsg,
    orders,
    historyPages,
    historyBusy,
    loadMoreHistory,
  } = context;
  return (
    <section className="panel">
      <h2>{t('Mon offre et mes supports', 'العرض والكارطات ديالي')}</h2>
      {subscription && (
        <div className="callout">
          <div>
            <h3>
              {offerLabel(subscription.plan, ar)} ·{' '}
              {subscription.state === 'active'
                ? t('Actif', 'مفعّل')
                : subscription.state === 'suspended'
                  ? t('Suspendu', 'موقوف')
                  : t('Essai', 'تجربة')}
            </h3>
            <p>
              {subscription.expires
                ? t('Échéance : ', 'نهاية الاشتراك : ') + subscription.expires.slice(0, 10)
                : t('Échéance à définir par SoraLink', 'SoraLink غادي يحدّد نهاية الاشتراك')}
            </p>
          </div>
        </div>
      )}
      <p className="muted">
        {t(
          'Demandes enregistrées pour suivi. Aucun paiement n’est encaissé ici.',
          'الطلبات كتتسجّل للتتبع. ما كاين حتى أداء هنا.',
        )}
      </p>
      <p className="hint">
        {t(
          'Première année incluse. Ensuite 149 DH/an avec toutes les fonctions du pack conservées. Carte NFC physique en supplément.',
          'العام الأول داخل فالثمن. من بعد 149 درهم فالعام مع جميع وظائف الباقة. كارط NFC المادية بزيادة.',
        )}
      </p>
      {subscription && (
        <button
          className="primary"
          disabled={busy}
          onClick={async () => {
            try {
              await action({
                action: 'order',
                plan: subscription.plan,
                kind: 'renewal',
              });
              await load();
              setMsg(
                t(
                  'Demande de renouvellement enregistrée. Paiement à confirmer.',
                  'تسجّل طلب التجديد. خاص تأكيد الأداء.',
                ),
              );
            } catch (e: any) {
              setMsg(e.message);
            }
          }}
        >
          {t('Renouveler mon pack', 'جدّد الباقة ديالي')} · {RENEWAL_PRICE}{' '}
          {t('DH/an', 'درهم فالعام')}
        </button>
      )}
      <div className="order-options">
        {offers.map(({ id: n, price: p }) => (
          <button
            key={n}
            className="secondary"
            disabled={busy}
            onClick={async () => {
              try {
                await action({ action: 'order', plan: n });
                await load();
                setMsg(t('Votre demande d’offre est enregistrée.', 'تسجّل طلب العرض ديالك.'));
              } catch (e: any) {
                setMsg(e.message);
              }
            }}
          >
            {offerLabel(String(n), ar)}
            <b>
              {p} {t('DH', 'درهم')}
            </b>
          </button>
        ))}
      </div>
      {orders.map((o) => (
        <div className="request" key={o.id}>
          <strong>
            {o.kind === 'renewal' ? t('Renouvellement · ', 'تجديد · ') : ''}
            {offerLabel(o.plan, ar)}
            {o.amount != null ? ` · ${o.amount} ${t('DH', 'درهم')}` : ''}
          </strong>
          <span className="badge">
            {t(
              (
                {
                  pending: 'En attente',
                  paid: 'Paiement confirmé',
                  design: 'Visuel à valider',
                  production: 'En fabrication',
                  ready: 'Prête',
                  shipped: 'Expédiée',
                  delivered: 'Remise',
                  cancelled: 'Annulée',
                } as any
              )[o.status] || o.status,
              (
                {
                  pending: 'فانتظار الأداء',
                  paid: 'تخلّص',
                  design: 'التصميم',
                  production: 'فالتحضير',
                  ready: 'واجدة',
                  shipped: 'تسيفطات',
                  delivered: 'تسلّمات',
                  cancelled: 'تلغات',
                } as any
              )[o.status] || o.status,
            )}
          </span>
          <span>{o.created.slice(0, 10)}</span>
          <PaymentReceiptUpload
            orderId={o.id}
            ar={ar}
            pending={o.status === 'pending' && !o.applied}
          />
        </div>
      ))}
      <LoadMore
        page={historyPages?.orders}
        busy={busy || !!historyBusy}
        ar={ar}
        onClick={() => {
          void loadMoreHistory?.('orders');
        }}
      />
      <div className="callout">
        <Phone />
        <p>
          {t(
            'Contact : contact@soralink.link. Paiement manuel après confirmation. Les frais de livraison sont précisés avant commande.',
            'تواصل معنا: contact@soralink.link. الأداء يدوي بعد التأكيد. مصاريف التوصيل كتتحدّد قبل الطلب.',
          )}
        </p>
      </div>
    </section>
  );
}
