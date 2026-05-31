'use client';

export function SampleArchiveBanner({
  memoryCount,
  onLoadSample,
  busy,
}: {
  memoryCount: number;
  onLoadSample: () => void;
  busy?: boolean;
}) {
  if (memoryCount > 8) return null;

  return (
    <section className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">Explore first</p>
      <h3 className="mt-1 text-lg font-bold text-slate-950">Load the Patel family sample archive</h3>
      <p className="mt-2 text-sm text-slate-600">
        50+ memories, a full family map, and story artifacts — try Ask with &ldquo;What do we know about grandfather in Mumbai?&rdquo;
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={onLoadSample}
        className="mt-4 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? 'Loading sample…' : 'Load sample archive'}
      </button>
    </section>
  );
}
