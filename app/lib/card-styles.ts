// Presets only affect appearance. Content, publication and plan rights stay with the owner.
export const cardStyles = [
  {
    id: 'executive',
    fr: 'Exécutif',
    ar: 'مهني',
    descriptionFr: 'Sobre et structuré',
    descriptionAr: 'بسيط ومنظّم',
    background: '#eef2f6',
    surface: '#ffffff',
    text: '#17243b',
    accent: '#24436a',
    font: 'classic',
    shape: 'square',
  },
  {
    id: 'creative',
    fr: 'Créatif',
    ar: 'إبداعي',
    descriptionFr: 'Place aux images et aux réalisations',
    descriptionAr: 'الصور والإنجازات فالمقدمة',
    background: '#f6f0e9',
    surface: '#ffffff',
    text: '#34251e',
    accent: '#a5452e',
    font: 'modern',
    shape: 'rounded',
  },
  {
    id: 'direct',
    fr: 'Contact direct',
    ar: 'تواصل مباشر',
    descriptionFr: 'Votre contact à portée de main',
    descriptionAr: 'معلومات التواصل بسهولة',
    background: '#eaf4ef',
    surface: '#ffffff',
    text: '#153b2b',
    accent: '#176346',
    font: 'simple',
    shape: 'rounded',
  },
  {
    id: 'minimal',
    fr: 'Minimaliste',
    ar: 'بسيط',
    descriptionFr: 'Épuré et essentiel',
    descriptionAr: 'واضح وبلا تعقيد',
    background: '#10141d',
    surface: '#181e29',
    text: '#f8fafc',
    accent: '#dce4ef',
    font: 'modern',
    shape: 'pill',
  },
] as const;
export const cardPalettes = [
  { id: 'navy', color: '#24436a', fr: 'Bleu profond', ar: 'أزرق غامق' },
  { id: 'green', color: '#176346', fr: 'Vert', ar: 'أخضر' },
  { id: 'terracotta', color: '#a5452e', fr: 'Terre cuite', ar: 'طوبي' },
  { id: 'purple', color: '#68459a', fr: 'Violet', ar: 'بنفسجي' },
  { id: 'black', color: '#22252c', fr: 'Graphite', ar: 'رمادي غامق' },
] as const;
export function cardStyleId(value: unknown) {
  return cardStyles.find((style) => style.id === value)?.id || '';
}
export function applyCardStyle(data: any, id: string) {
  const style = cardStyles.find((style) => style.id === id);
  if (!style) return data;
  const theme =
    data.cardTheme === 'light' || data.cardTheme === 'dark'
      ? data.cardTheme
      : id === 'minimal'
        ? 'dark'
        : 'light';
  const neutralLight = theme === 'light' && id === 'minimal';
  return {
    ...data,
    template: style.id,
    cardTheme: theme,
    cardFont: style.font,
    buttonShape: style.shape,
    avatarShape: id === 'executive' ? 'square' : 'circle',
    fondColor: theme === 'dark' ? '#10141d' : neutralLight ? '#eef2f6' : style.background,
    blockColor: theme === 'dark' ? '#181e29' : neutralLight ? '#ffffff' : style.surface,
    textColor: theme === 'dark' ? '#f8fafc' : neutralLight ? '#17243b' : style.text,
    color: style.accent,
    buttonColor: style.accent,
    buttonStyle: 'filled',
    buttonSize: id === 'direct' ? 'large' : 'normal',
  };
}
export const socialKeys = ['instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'x'] as const;
export function socialOrder(value: unknown): string[] {
  const selected = Array.isArray(value) ? value.filter((key) => socialKeys.includes(key)) : [];
  return [...new Set([...selected, ...socialKeys])];
}
export function applyCardTheme(data: any, theme: string) {
  if (theme !== 'light' && theme !== 'dark') return data;
  return {
    ...data,
    cardTheme: theme,
    fondColor: theme === 'dark' ? '#10141d' : '#eef2f6',
    blockColor: theme === 'dark' ? '#181e29' : '#ffffff',
    textColor: theme === 'dark' ? '#f8fafc' : '#17243b',
  };
}

export function primaryColor(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const hex = value.trim().replace(/^#/, '');
  return /^[0-9a-f]{6}$/i.test(hex) ? '#' + hex.toLowerCase() : null;
}
export function applyPrimaryColor(data: any, value: unknown) {
  const color = primaryColor(value);
  return color ? { ...data, color, buttonColor: color } : data;
}
