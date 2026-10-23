import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';
// Print-ready A5 at roughly 300 dpi. Browser font shaping preserves Arabic text.
export async function qrStandPDF(url: string, business: string, ar: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 1748;
  canvas.height = 2480;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw Error('Canvas unavailable');
  await document.fonts.load('700 64px ' + (ar ? 'Cairo' : 'Roboto'));
  const font = ar ? 'Cairo, sans-serif' : 'Roboto, sans-serif';
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, 1748, 2480);
  ctx.textAlign = 'center';
  ctx.direction = ar ? 'rtl' : 'ltr';
  ctx.font = '700 110px Roboto, sans-serif';
  ctx.fillStyle = '#ff9125';
  ctx.fillText('SoraLink', 874, 220);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 76px ' + font;
  const title = (business || 'SoraLink').trim().slice(0, 120);
  const words = title.split(/\s+/);
  let line = '',
    lines: string[] = [];
  for (const word of words) {
    const candidate = (line + ' ' + word).trim();
    if (ctx.measureText(candidate).width > 1440 && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  for (const [i, text] of lines.slice(0, 2).entries()) {
    ctx.fillText(text, 874, 380 + i * 100, 1440);
  }
  ctx.font = '400 54px ' + font;
  ctx.fillText(
    ar ? 'سكانيو وشوفو البطاقة ديالنا' : 'Scannez et découvrez notre carte',
    874,
    650,
    1480,
  );
  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, url, {
    width: 1220,
    margin: 4,
    errorCorrectionLevel: 'H',
    color: { dark: '#000000', light: '#ffffff' },
  });
  ctx.drawImage(qr, 264, 790, 1220, 1220);
  ctx.fillStyle = '#ff9125';
  ctx.font = '700 56px ' + font;
  ctx.fillText(
    ar ? 'البطاقة المهنية ديالنا فرابط واحد' : 'Notre carte professionnelle, en un lien',
    874,
    2160,
    1480,
  );
  ctx.fillStyle = '#ffffff';
  ctx.font = '400 42px Roboto, sans-serif';
  ctx.direction = 'ltr';
  ctx.fillText(new URL(url).hostname, 874, 2310);
  const pdf = await PDFDocument.create();
  pdf.setTitle('SoraLink - QR A5');
  pdf.setAuthor('SoraLink');
  const image = await pdf.embedPng(canvas.toDataURL('image/png'));
  const page = pdf.addPage([419.5276, 595.2756]);
  page.drawImage(image, { x: 0, y: 0, width: 419.5276, height: 595.2756 });
  const bytes = await pdf.save();
  return new Blob([bytes.slice().buffer], { type: 'application/pdf' });
}
