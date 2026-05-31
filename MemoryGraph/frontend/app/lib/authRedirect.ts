const DEFAULT_NEXT = '/studio';

export function sanitizeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_NEXT;
  }
  if (value.startsWith('/auth/')) {
    return DEFAULT_NEXT;
  }
  return value;
}

export function loginPathWithNext(next?: string | null): string {
  const safe = sanitizeNextPath(next);
  if (safe === DEFAULT_NEXT) return '/auth/login?next=/studio';
  return `/auth/login?next=${encodeURIComponent(safe)}`;
}

export function registerPathWithNext(next?: string | null): string {
  const safe = sanitizeNextPath(next);
  if (safe === DEFAULT_NEXT) return '/auth/register?next=/studio';
  return `/auth/register?next=${encodeURIComponent(safe)}`;
}
