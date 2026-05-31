'use client';

import { API_URL, authHeaders } from '@/app/lib/api';
import { getArchiveOwnerId } from '@/app/lib/archiveContext';
import type { MemoryProofItem } from '@/app/components/MemoryProofCard';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface MemoryDetail {
  memory_id: string;
  raw_text?: string;
  structured_data?: { summary?: string; people?: string[]; places?: string[] };
  metadata?: { original_filename?: string };
}

export function MemorySourceDrawer({ proof, onClose }: { proof: MemoryProofItem; onClose: () => void }) {
  const [detail, setDetail] = useState<MemoryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const owner = getArchiveOwnerId();
        const ownerQuery = owner ? `?owner_id=${encodeURIComponent(owner)}` : '';
        const response = await fetch(`${API_URL}/memories/${encodeURIComponent(proof.memory_id)}${ownerQuery}`, {
          credentials: 'include',
          headers: authHeaders(),
        });
        if (!response.ok) throw new Error(await response.text());
        if (!cancelled) setDetail(await response.json());
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load memory');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [proof.memory_id]);

  const excerpt = detail?.raw_text || detail?.structured_data?.summary || proof.summary;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" role="dialog" aria-modal="true">
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold text-amber-800">Source memory</p>
            <h2 className="text-lg font-bold text-slate-950">{proof.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">
            Close
          </button>
        </div>
        <div className="space-y-4 p-5">
          {error && <p className="text-sm text-red-700">{error}</p>}
          {!detail && !error && <p className="text-sm text-slate-500">Loading…</p>}
          {detail && (
            <>
              <p className="text-xs text-slate-500">{detail.metadata?.original_filename}</p>
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-sm leading-7 text-slate-800">
                {excerpt?.slice(0, 4000) || 'No text extracted yet.'}
              </div>
              {detail.structured_data?.people?.length ? (
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">People:</span> {detail.structured_data.people.join(', ')}
                </p>
              ) : null}
              <Link href={`/memories?highlight=${proof.memory_id}`} className="inline-block text-sm font-semibold text-amber-800 hover:text-amber-900">
                Open in library →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
