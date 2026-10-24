export function accentText(color: string) {
  const hex = /^#[0-9a-f]{6}$/i.test(color || '') ? color : '#d5b66f';
  const rgb = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 > 0.179 ? '#111111' : '#ffffff';
}
export function buttonForeground(color: string) {
  return accentText(color) === '#111111' ? '#000000' : '#ffffff';
}
