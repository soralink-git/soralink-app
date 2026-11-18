import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const req = createRequire(import.meta.url);
const ts = req('typescript');
const brandModule = { exports: {} };
const brandCode = ts.transpileModule(await readFile('app/lib/brand.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
new Function('exports', brandCode)(brandModule.exports);
const { BRAND } = brandModule.exports;
const sharpPackage = (await readdir('node_modules/.pnpm')).find((entry) =>
  /^sharp@0\.35\.5(?:_|$)/.test(entry),
);
if (!sharpPackage) throw new Error('Install the locked project dependencies first.');
const sharp = req(resolve('node_modules/.pnpm', sharpPackage, 'node_modules/sharp'));
const favicon = await readFile('public/favicon.svg', 'utf8');
for (const [file, width] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  await sharp(Buffer.from(favicon))
    .resize(width, width)
    .png()
    .toFile('public/icons/' + file);
}
const inner = favicon.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${BRAND.orange}"/><g transform="translate(18 18)">${inner}</g></svg>`;
await sharp(Buffer.from(maskable)).resize(512, 512).png().toFile('public/icons/maskable-512.png');
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="${BRAND.charcoal}"/>
<rect width="1200" height="12" fill="${BRAND.vermilion}"/>
<g transform="translate(66 60) scale(.9)">${inner}</g>
<g font-family="DejaVu Sans, sans-serif">
<text x="143" y="103" font-size="38" font-weight="700" fill="${BRAND.white}">SoraLink</text>
<text x="64" y="231" font-size="64" font-weight="800" fill="${BRAND.orange}">Votre carte digitale.</text>
<text x="64" y="311" font-size="48" font-weight="700" fill="${BRAND.white}">Votre activité,</text>
<text x="64" y="374" font-size="48" font-weight="700" fill="${BRAND.white}">en un lien.</text>
<text x="66" y="441" font-size="22" fill="#c1c5cd">Carte NFC · QR code · Produits et services</text>
<rect x="66" y="495" width="236" height="58" rx="12" fill="${BRAND.orange}"/>
<text x="184" y="532" text-anchor="middle" font-size="25" font-weight="700" fill="${BRAND.charcoal}">soralink.link</text>
<rect x="859" y="128" width="274" height="382" rx="22" fill="${BRAND.slate}" stroke="#485160"/>
<rect x="880" y="149" width="232" height="112" rx="12" fill="${BRAND.vermilion}"/>
<circle cx="996" cy="261" r="40" fill="${BRAND.orange}" stroke="${BRAND.slate}" stroke-width="8"/>
<text x="996" y="273" text-anchor="middle" font-size="28" font-weight="800" fill="${BRAND.charcoal}">SL</text>
<rect x="930" y="322" width="132" height="9" rx="4" fill="${BRAND.white}"/>
<rect x="917" y="346" width="158" height="7" rx="3" fill="#c1c5cd"/>
<rect x="889" y="382" width="214" height="40" rx="10" fill="${BRAND.orange}"/>
<rect x="889" y="436" width="100" height="40" rx="10" fill="#191e27" stroke="#485160"/>
<rect x="1003" y="436" width="100" height="40" rx="10" fill="#191e27" stroke="#485160"/>
</g></svg>`;
await sharp(Buffer.from(og)).png().toFile('public/og-soralink.png');
await writeFile('public/favicon.svg', favicon);
console.log('SoraLink favicon, app icons and sharing image generated from the brand palette.');
