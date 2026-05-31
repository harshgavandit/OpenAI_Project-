'use client';

import { API_URL, authHeaders } from '@/app/lib/api';
import { useState } from 'react';

export function DuplicateMergePanel({
  duplicates,
  onMerged,
}: {
  duplicates: string[][];
  onMerged?: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  if (!duplicates.length) return null;

  const dismiss = async (group: string[]) => {
    const key = `duplicate:${group.join(':')}`;
    setBusy(key);
    try {
      await fetch(`${API_URL}/archive/intelligence/actions`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ insight_key: key, action: 'dismiss' }),
      });
      onMerged?.();
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
      <h3 className="text-sm font-bold text-amber-950">Possible duplicates</h3>
      <p className="mt-1 text-sm text-amber-900/80">These memories look similar. Review or dismiss the suggestion.</p>
      <ul className="mt-4 space-y-3">
        {duplicates.map((group) => (
          <li key={group.join('-')} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 text-sm">
            <span className="font-medium text-slate-800">{group.length} related items</span>
            <button
              type="button"
              disabled={busy === `duplicate:${group.join(':')}`}
              onClick={() => void dismiss(group)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Dismiss
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
