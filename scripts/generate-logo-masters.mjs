import { readFile, writeFile } from 'node:fs/promises';
const parts = JSON.parse(await readFile('scripts/brand/reference-shapes.json', 'utf8'));
const paths = (key, fill) =>
  parts[key].map((p) => `<path d="${p.d}" transform="${p.transform}" fill="${fill}"/>`).join('');
const widths = { Link: 454, Print: 468, Connect: 553 };
for (const [division, color] of [
  ['Link', '#F47721'],
  ['Print', '#F5C928'],
  ['Connect', '#D93636'],
]) {
  const name = 'sora' + division.toLowerCase(),
    width = widths[division];
  for (const [variant, ink, accent, background] of [
    ['color', '#171717', color, null],
    ['black', '#171717', '#171717', null],
    ['white', '#FFFFFF', '#FFFFFF', null],
    ['on-dark', '#FFFFFF', color, null],
    ['dark', '#FFFFFF', color, '#171717'],
  ]) {
    const symbol = paths('symbol', accent),
      word = paths('sora', ink),
      suffix = paths(division, ink);
    const body =
      symbol +
      `<g transform="translate(144 32)">${word}<g transform="translate(160 0)">${suffix}</g></g>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 149" role="img"><title>Sora${division}</title>${background ? `<rect width="${width}" height="149" fill="${background}"/>` : ''}${body}</svg>`;
    await writeFile(`public/brand/${name}-${variant}.svg`, svg);
  }
  for (const [n, c] of [
    [name, color],
    ...(division === 'Link'
      ? [
          ['monochrome', '#171717'],
          ['white', '#FFFFFF'],
        ]
      : []),
  ]) {
    await writeFile(
      `public/brand/${n}-symbol.svg`,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 131 149"><title>Le S de la planche choisie</title>${paths('symbol', c)}</svg>`,
    );
  }
  const ink = division === 'Print' ? '#171717' : '#FFFFFF';
  await writeFile(
    `public/brand/${name}-avatar.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><title>Sora${division}</title><rect width="256" height="256" rx="52" fill="${color}"/><g transform="translate(55 45) scale(1.11)">${paths('symbol', ink)}</g></svg>`,
  );
}
console.log(
  'Logo masters regenerated from the selected reference contours, without a substitute font.',
);
