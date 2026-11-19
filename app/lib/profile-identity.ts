export function profileKind(data: { profileType?: unknown } | null | undefined) {
  return data?.profileType === 'business' ? 'business' : 'person';
}
export function profileName(
  data: { profileType?: unknown; name?: unknown; business?: unknown } | null | undefined,
): string {
  const value = profileKind(data) === 'business' ? data?.business : data?.name;
  return typeof value === 'string' ? value.trim() : '';
}

export function profileIdentityError(data: Parameters<typeof profileName>[0], ar = false): string {
  if (profileName(data)) return '';
  return profileKind(data) === 'business'
    ? ar
      ? 'عمّر اسم المحل ولا المقاولة باش تسجّل التغييرات.'
      : 'Renseignez le nom de l’établissement pour enregistrer les modifications.'
    : ar
      ? 'عمّر الاسم الكامل باش تسجّل التغييرات.'
      : 'Renseignez le nom complet pour enregistrer les modifications.';
}
