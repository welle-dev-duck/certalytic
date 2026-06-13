export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function readEntityName(
  value: unknown,
  key: 'name' | 'email' = 'name',
): string | undefined {
  if (typeof value !== 'object' || value === null || !(key in value)) {
    return undefined;
  }

  const field = (value as Record<string, unknown>)[key];

  return typeof field === 'string' && field.length > 0 ? field : undefined;
}
