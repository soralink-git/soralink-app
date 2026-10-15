type Request = {
  name?: string;
  phone?: string;
  kind?: string;
  status?: string;
  service?: string;
  slot?: string;
};
export function whatsappNumber(value: unknown): string {
  const raw = String(value || '').trim();
  if (!raw || !/^[+\d\s().-]+$/.test(raw)) return '';
  let n = raw.replace(/\D/g, '');
  if (n.startsWith('00')) n = n.slice(2);
  if (/^0[5-7]\d{8}$/.test(n)) n = '212' + n.slice(1);
  return /^[1-9]\d{7,14}$/.test(n) ? n : '';
}
export function requestKind(kind = '', ar = false): string {
  return (
    (ar
      ? ({ rdv: 'الموعد', devis: 'طلب الثمن', commande: 'الطلب', contact: 'التواصل' } as Record<
          string,
          string
        >)
      : ({
          rdv: 'rendez-vous',
          devis: 'demande de devis',
          commande: 'commande',
          contact: 'contact',
        } as Record<string, string>))[kind] || (ar ? 'الطلب' : 'demande')
  );
}
export function requestStatus(status = '', ar = false): string {
  return (
    (ar
      ? ({ new: 'فانتظار التأكيد', confirmed: 'مؤكد', cancelled: 'ملغي', done: 'تعالج' } as Record<
          string,
          string
        >)
      : ({
          new: 'en attente',
          confirmed: 'confirmé',
          cancelled: 'annulé',
          done: 'traité',
        } as Record<string, string>))[status] || (ar ? 'خاص المراجعة' : 'à vérifier')
  );
}
export function requestReply(r: Request, business: string, ar = false): string {
  const kind = requestKind(r.kind, ar);
  const status = requestStatus(r.status, ar);
  const lines = ar
    ? [
        'السلام عليكم ' + (r.name || '') + '،',
        'بخصوص ' + (kind || 'الطلب') + ' ديالك.',
        'الحالة: ' + status,
      ]
    : [
        'Bonjour ' + (r.name || '') + ',',
        'Concernant votre ' + (kind || 'demande') + '.',
        'Statut : ' + status + '.',
      ];
  if (r.service) lines.push((ar ? 'الخدمة / المنتوج: ' : 'Service / article : ') + r.service);
  if (r.slot)
    lines.push(
      (ar ? 'الموعد: ' : 'Date : ') +
        r.slot.replace('T', ar ? ' مع ' : ' à ') +
        (ar ? ' (بتوقيت المغرب)' : ' (heure du Maroc)'),
    );
  lines.push(business || 'SoraLink');
  return lines.join('\n');
}

export function whatsappNotification(r: Request, business: string, ar = false): string {
  const number = whatsappNumber(r.phone);
  if (!number) return '';
  return 'https://wa.me/' + number + '?text=' + encodeURIComponent(requestReply(r, business, ar));
}
