export function profileKind(data: { profileType?: unknown } | null | undefined) {
  return data?.profileType === 'business' ? 'business' : 'person';
}
export function profileName(
  data: { profileType?: unknown; name?: unknown; business?: unknown } | null | undefined,
): string {
  const value = profileKind(data) === 'business' ? data?.business : data?.name;
  return typeof value === 'string' ? value.trim() : '';
}
