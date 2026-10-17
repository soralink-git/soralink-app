import { whatsappNumber } from './whatsapp-notification';
import type { ProfileLink } from './profile-links';
export function vcardText(data: {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  business?: unknown;
  job?: unknown;
  address?: unknown;
  website?: unknown;
  entries?: ProfileLink[];
}): string {
  const safe = (value: unknown) =>
    typeof value === 'string' ? value.replace(/\\/g, '\\\\').replace(/[\r\n;,]/g, ' ') : '';
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + safe(data.name)];
  if (data.entries) {
    const numbers = new Set<string>();
    for (const entry of data.entries) {
      if (!entry.visible) continue;
      if (entry.kind === 'phone' || entry.kind === 'whatsapp') {
        const key = whatsappNumber(entry.value) || entry.value;
        if (!numbers.has(key)) {
          lines.push('TEL:' + safe(entry.value));
          numbers.add(key);
        }
      }
      if (entry.kind === 'email') lines.push('EMAIL:' + safe(entry.value));
      if (entry.kind === 'address') lines.push('ADR:;;' + safe(entry.value) + ';;;;');
      if (entry.kind === 'website' && /^https?:\/\//i.test(entry.value))
        lines.push('URL:' + safe(entry.value));
    }
  } else {
    lines.push('TEL:' + safe(data.phone), 'EMAIL:' + safe(data.email));
    if (data.business) lines.push('ORG:' + safe(data.business));
    if (data.job) lines.push('TITLE:' + safe(data.job));
    if (data.address) lines.push('ADR:;;' + safe(data.address) + ';;;;');
    if (typeof data.website === 'string' && /^https?:\/\//i.test(data.website))
      lines.push('URL:' + safe(data.website));
  }
  if (data.entries && data.business) lines.push('ORG:' + safe(data.business));
  if (data.entries && data.job) lines.push('TITLE:' + safe(data.job));
  lines.push('END:VCARD');
  // RFC 6350 folding: limit physical lines to 75 UTF-8 octets, never split a character.
  return lines
    .map((line) => {
      let out = '',
        bytes = 0;
      for (const char of line) {
        const code = char.codePointAt(0)!;
        const size = code > 0xffff ? 4 : code > 0x7ff ? 3 : code > 0x7f ? 2 : 1;
        if (bytes + size > 75) {
          out += '\r\n ';
          bytes = 1;
        }
        out += char;
        bytes += size;
      }
      return out;
    })
    .join('\r\n');
}
