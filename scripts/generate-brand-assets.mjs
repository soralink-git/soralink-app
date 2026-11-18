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
const favicon = await readFile('public/brand/soralink-symbol.svg', 'utf8');
await writeFile('public/favicon.svg', favicon);
const appIcon = await readFile('public/brand/soraconnect-avatar.svg', 'utf8');
for (const [file, width] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
  ['maskable-512.png', 512],
]) {
  await sharp(Buffer.from(appIcon))
    .resize(width, width)
    .png()
    .toFile('public/icons/' + file);
}
for (const name of ['soralink', 'soraprint', 'soraconnect']) {
  const master = await readFile('public/brand/' + name + '-color.svg', 'utf8');
  const logo = master
    .replace(/<svg[^>]*>/, '<g transform="translate(80 190) scale(1.6)">')
    .replace('</svg>', '</g>');
  const accent = { soralink: BRAND.orange, soraprint: '#f5c928', soraconnect: BRAND.vermilion }[
    name
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#fff"/><rect x="80" y="90" width="12" height="65" fill="${accent}"/>${logo}<path d="M80 480H1120" stroke="#ddd"/><text x="80" y="530" font-family="sans-serif" font-size="24" fill="#171717">GROUPE SORALINK · OUJDA, MAROC</text></svg>`;
  await sharp(Buffer.from(svg))
    .png()
    .toFile('public/brand/' + name + '-social.png');
}
await writeFile('public/og-soralink.png', await readFile('public/brand/soralink-social.png'));
console.log('Group favicon, SoraConnect app icons and three brand share images generated.');
