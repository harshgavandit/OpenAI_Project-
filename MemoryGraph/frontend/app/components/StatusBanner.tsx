'use client';

export function StatusBanner({
  busy,
  notice,
  error,
}: {
  busy?: string | null;
  notice?: string | null;
  error?: string | null;
}) {
  if (!busy && !notice && !error) return null;

  return (
    <div className="space-y-2" aria-live="polite">
      {busy && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" aria-hidden />
          {busy}…
        </div>
      )}
      {notice && !error && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
