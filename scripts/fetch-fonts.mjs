// One-off maintenance script: vendors the web fonts so the app no longer loads
// Google Fonts CSS at runtime. Run manually, then commit public/fonts + app/fonts.css.
import { writeFile, mkdir } from 'node:fs/promises';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const URL =
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400..700&family=Roboto:wght@400..900&family=Cairo:wght@400..800&display=swap';

const css = await fetch(URL, { headers: { 'User-Agent': UA } }).then((r) => r.text());
const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]+\})/g)];

const pick = (family, subset) =>
  blocks.find(
    ([, name, block]) => name === subset && new RegExp(`font-family:\\s*'${family}'`).test(block),
  )?.[2];

const targets = [
  { family: 'DM Sans', subset: 'latin', file: 'dm-sans-latin.woff2' },
  { family: 'Roboto', subset: 'latin', file: 'roboto-latin.woff2' },
  { family: 'Cairo', subset: 'arabic', file: 'cairo-arabic.woff2' },
];

await mkdir('public/fonts', { recursive: true });
const faces = [];
for (const target of targets) {
  const block = pick(target.family, target.subset);
  if (!block) throw new Error(`@font-face introuvable: ${target.family}/${target.subset}`);
  const url = block.match(/url\((https:[^)]+)\)/)[1];
  const bytes = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()));
  await writeFile('public/fonts/' + target.file, bytes);
  const face = block
    .replace(/url\(https:[^)]+\)/, `url('/fonts/${target.file}')`)
    .replace(/font-display:\s*swap;?/, 'font-display: swap;')
    .replace(/\s+/g, ' ')
    .trim();
  faces.push(face);
  console.log(`${target.file}: ${(bytes.length / 1024).toFixed(1)} Ko`);
}

await writeFile(
  'app/fonts.css',
  '/* Vendored from Google Fonts; see scripts/fetch-fonts.mjs. */\n' + faces.join('\n') + '\n',
);
console.log('app/fonts.css écrit');
