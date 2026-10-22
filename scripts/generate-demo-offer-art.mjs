import { writeFileSync } from 'node:fs';
const base = 'public/demo/soralink/premium/';
const orange = '#ff9125';
const logo = (x, y, size = 54) =>
  `<g transform="translate(${x} ${y}) scale(${size / 64})"><rect width="64" height="64" rx="16" fill="${orange}"/><path d="M23 17h-5a10 10 0 0 0-10 10v10a10 10 0 0 0 10 10h11M41 17h5a10 10 0 0 1 10 10v10a10 10 0 0 1-10 10H35M24 38l16-12" fill="none" stroke="#111" stroke-width="6" stroke-linecap="round"/></g>`;
const text = (x, y, value, size = 24, color = '#17191c', bold = false) =>
  `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${bold ? 700 : 400}" fill="${color}">${value}</text>`;
const line = (x, y, w, color = '#e1e3e7', h = 8) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${color}"/>`;
const circle = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const shell = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><defs><filter id="shadow" x="-50%" y="-50%" width="200%" height="220%"><feDropShadow dx="0" dy="22" stdDeviation="24" flood-color="#15191d" flood-opacity=".13"/></filter></defs><rect width="1200" height="900" fill="#f4f2ee"/><ellipse cx="620" cy="790" rx="350" ry="40" fill="#dedbd5" opacity=".45"/>${body}${logo(65, 65, 42)}${text(122, 95, 'SoraLink', 30, '#17191c', true)}</svg>`;
const phone = (inside) =>
  `<g filter="url(#shadow)"><rect x="438" y="128" width="324" height="655" rx="48" fill="#16191d"/><rect x="449" y="139" width="302" height="633" rx="38" fill="white"/><rect x="551" y="151" width="99" height="20" rx="10" fill="#16191d"/>${inside}<rect x="552" y="749" width="98" height="5" rx="3" fill="#16191d"/></g>`;
const identity = `<rect x="449" y="191" width="302" height="115" fill="#242c39"/>${logo(565, 266, 70)}${text(538, 377, 'SoraLink', 30, '#17191c', true)}${text(507, 410, 'contact@soralink.link', 17, '#68707b')}${line(495, 438, 210)}${line(525, 458, 150)}${[506, 569, 632, 695].map((x, i) => `${circle(x, 523, 25, orange)}${text(x - 7, 530, ['↗', '@', '+', '•'][i], 21, '#111', true)}`).join('')}<rect x="482" y="581" width="236" height="92" rx="16" fill="#f5f6f7"/>${logo(501, 601, 48)}${text(563, 629, 'soralink.link', 18, '#17191c', true)}`;
writeFileSync(
  base + 'identite.svg',
  shell(
    phone(identity) +
      `<g filter="url(#shadow)"><rect x="200" y="480" width="225" height="146" rx="22" fill="#242c39"/>${logo(222, 505, 42)}${text(222, 593, 'SoraLink', 26, 'white', true)}<path d="M353 516q18 22 0 44m12-55q28 33 0 66" stroke="${orange}" fill="none" stroke-width="5" stroke-linecap="round"/></g>`,
  ),
);
let grid = '';
for (let i = 0; i < 4; i++) {
  const x = 474 + (i % 2) * 133,
    y = 303 + Math.floor(i / 2) * 173;
  grid += `<rect x="${x}" y="${y}" width="119" height="157" rx="13" fill="#f4f5f6"/><rect x="${x + 8}" y="${y + 8}" width="103" height="81" rx="8" fill="${i % 2 ? '#242c39' : '#ffe4c9'}"/>${logo(x + 42, y + 31, 35)}${line(x + 11, y + 104, 86, '#7d8590', 6)}${line(x + 11, y + 121, 61, '#c6cbd1', 5)}<rect x="${x + 11}" y="${y + 135}" width="38" height="9" rx="4" fill="${orange}"/>`;
}
writeFileSync(
  base + 'catalogue.svg',
  shell(
    phone(
      `${logo(475, 205, 35)}${text(523, 230, 'SoraLink', 22, '#17191c', true)}${line(475, 266, 246, '#e7e9ec', 17)}${grid}`,
    ) +
      `<g filter="url(#shadow)"><rect x="790" y="377" width="180" height="230" rx="17" fill="#242c39"/>${logo(815, 403, 42)}${text(815, 492, 'PDF', 42, 'white', true)}${line(815, 524, 112, '#75808e', 6)}${line(815, 545, 88, '#75808e', 6)}<rect x="815" y="567" width="112" height="13" rx="6" fill="${orange}"/></g>`,
  ),
);
let calendar = '';
for (let i = 0; i < 35; i++) {
  let x = 287 + (i % 7) * 66,
    y = 348 + Math.floor(i / 7) * 63;
  calendar += `<rect x="${x}" y="${y}" width="52" height="47" rx="11" fill="${[9, 17, 23].includes(i) ? orange : '#f3f4f5'}"/>${text(x + 15, y + 30, String((i + 1) % 31 || 31), 17, '#343b44', true)}`;
}
writeFileSync(
  base + 'activite.svg',
  shell(
    `<g filter="url(#shadow)"><rect x="235" y="220" width="560" height="485" rx="30" fill="white"/>${logo(273, 258, 40)}${text(329, 288, 'SoraLink', 25, '#17191c', true)}${line(555, 271, 190, '#e7e9ec', 12)}${calendar}</g><g filter="url(#shadow)"><rect x="712" y="504" width="285" height="171" rx="24" fill="#242c39"/>${circle(758, 549, 18, orange)}<path d="m749 548 7 7 12-14" stroke="#111" stroke-width="3" fill="none"/>${line(792, 537, 161, '#77818d', 8)}${line(792, 558, 110, '#77818d', 6)}${text(746, 622, '10:30', 36, 'white', true)}</g>`,
  ),
);
writeFileSync(
  base + 'accompagnement.svg',
  shell(
    `<g filter="url(#shadow)"><rect x="210" y="232" width="520" height="380" rx="26" fill="white"/>${logo(250, 269, 44)}${text(313, 300, 'SoraLink', 27, '#17191c', true)}${[0, 1, 2].map((i) => `${circle(272, 377 + i * 69, 16, orange)}<path d="m264 ${377 + i * 69} 6 6 12-13" stroke="#111" stroke-width="3" fill="none"/>${line(312, 366 + i * 69, 330 - i * 40, '#c0c6cc', 9)}${line(312, 388 + i * 69, 245 - i * 35, '#e1e4e7', 6)}`).join('')}</g><g filter="url(#shadow)"><rect x="655" y="447" width="325" height="176" rx="28" fill="#242c39"/><path d="m696 618-18 44 70-44" fill="#242c39"/>${circle(708, 501, 20, orange)}${circle(708, 498, 7, '#111')}<path d="M696 514q12-15 24 0" stroke="#111" stroke-width="4" fill="none"/>${line(748, 489, 177, '#8e98a5', 9)}${line(748, 513, 132, '#8e98a5', 7)}${line(692, 557, 229, '#8e98a5', 8)}${line(692, 579, 159, '#8e98a5', 7)}</g>`,
  ),
);
