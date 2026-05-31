/** Active family archive when viewing or contributing as a guest. */

export const ARCHIVE_OWNER_KEY = 'mg_archive_owner';

export function getArchiveOwnerId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ARCHIVE_OWNER_KEY);
}

export function setArchiveOwnerId(ownerId: string | null): void {
  if (typeof window === 'undefined') return;
  if (ownerId) sessionStorage.setItem(ARCHIVE_OWNER_KEY, ownerId);
  else sessionStorage.removeItem(ARCHIVE_OWNER_KEY);
  window.dispatchEvent(new Event('mg-archive-change'));
}

export const ARCHIVE_CHANGE_EVENT = 'mg-archive-change';
