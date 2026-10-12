export function vcardText(data: { name?: unknown; phone?: unknown; email?: unknown }): string {
  const safe = (value: unknown) =>
    typeof value === 'string' ? value.replace(/[\r\n;,]/g, ' ') : '';
  return `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${safe(data.name)}\r\nTEL:${safe(data.phone)}\r\nEMAIL:${safe(data.email)}\r\nEND:VCARD`;
}
